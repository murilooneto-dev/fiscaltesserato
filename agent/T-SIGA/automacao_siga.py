"""
SIGA - Automação NFe Emitidas Autorizadas e Canceladas
=======================================================
Execute o executar.bat. O script vai:

  1. Abrir o Chrome automaticamente (sem flags de automação)
  2. Aguardar você fazer o login completo no SIGA
  3. Continuar como um robô: digita CNPJ, clica nos menus,
     aguarda mudanças de página, baixa os arquivos.
"""

import asyncio
import re
import logging
import subprocess
import threading
import urllib.request
from datetime import date, datetime, timedelta
from pathlib import Path

import pandas as pd
import questionary
from playwright.async_api import async_playwright, TimeoutError as PlaywrightTimeout

import config as cfg
from config import (
    PLANILHA_CONTRIBUINTES,
    COLUNA_CNPJ,
    URL_BASE,
    CHROME_EXECUTABLE,
    CHROME_PERFIL_SIGA,
    PORTA_CDP,
    TIMEOUT_LOGIN_MIN,
    TIMEOUT_MS,
    TIMEOUT_RELATORIO_MS,
    VELOCIDADE_MS,
    PAUSA_ENTRE_CONTRIBUINTES,
)
from banco import init_db, importar_do_excel, cadastrar_empresa, listar_empresas, total_empresas, razao_social_por_cnpj

# ─── Controle de execução (definidos aqui, manipulados pela UI) ──────────────
_parar_execucao: threading.Event = threading.Event()

# ─── Logging ─────────────────────────────────────────────────────────────────
_LOG_DIR = Path(cfg.PASTA_DOWNLOADS).parent
_LOG_DIR.mkdir(parents=True, exist_ok=True)

_fmt = logging.Formatter("%(asctime)s %(message)s", datefmt="%H:%M:%S")

# Arquivo: captura TUDO (DEBUG) para diagnóstico
_fh = logging.FileHandler(_LOG_DIR / "siga_automacao.log", encoding="utf-8", mode="a")
_fh.setLevel(logging.DEBUG)
_fh.setFormatter(_fmt)

# Terminal/UI: apenas INFO (mensagens de etapa limpas)
_sh = logging.StreamHandler()
_sh.setLevel(logging.INFO)
_sh.setFormatter(_fmt)

log = logging.getLogger(__name__)
log.setLevel(logging.DEBUG)
log.propagate = False
log.addHandler(_fh)
log.addHandler(_sh)

MESES_PT = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
]

URL_HOME = f"{URL_BASE}/ui/selecao-contribuinte/contribuinte"


# ─── Utilitários ─────────────────────────────────────────────────────────────

def limpar_cnpj(cnpj: str) -> str:
    return re.sub(r"\D", "", str(cnpj).strip())

def formatar_cnpj(cnpj: str) -> str:
    """50323168000106 → 50.323.168/0001-06"""
    c = cnpj.zfill(14)
    return f"{c[:2]}.{c[2:5]}.{c[5:8]}/{c[8:12]}-{c[12:]}"

def mes_anterior() -> tuple[int, int]:
    primeiro = date.today().replace(day=1)
    return (primeiro - timedelta(days=1)).month, (primeiro - timedelta(days=1)).year

def _sanitizar_nome(nome: str) -> str:
    """Remove caracteres inválidos para nomes de pasta no Windows."""
    return re.sub(r'[\\/:*?"<>|]', "", nome).strip()


async def _aguardar(page, timeout: int = 5_000) -> None:
    """Tenta networkidle com timeout curto; se o Angular travar, segue mesmo assim."""
    try:
        await page.wait_for_load_state("networkidle", timeout=timeout)
    except Exception:
        pass


async def _forcar_recarregar_home(page, motivo: str = "") -> None:
    """Forca reload real da rota do SIGA quando o Angular fica parado."""
    if motivo:
        log.debug(f"  [reload] Forcando recarregamento: {motivo}")

    try:
        await page.reload(wait_until="domcontentloaded", timeout=15_000)
        await asyncio.sleep(2)
    except Exception as e:
        log.debug(f"  [reload] page.reload falhou: {e}")

    try:
        await page.goto("about:blank", wait_until="domcontentloaded", timeout=5_000)
        await page.goto(URL_HOME, wait_until="domcontentloaded", timeout=20_000)
        await asyncio.sleep(3)
    except Exception as e:
        log.debug(f"  [reload] goto about:blank -> URL_HOME falhou: {e}")


def pasta_destino(cnpj: str) -> Path:
    mes, ano = mes_anterior()
    razao = razao_social_por_cnpj(cnpj)
    if razao:
        nome_pasta = f"{cnpj} - {_sanitizar_nome(razao)}"
    else:
        nome_pasta = cnpj
    p = Path(cfg.PASTA_DOWNLOADS) / nome_pasta / f"{ano}-{mes:02d}"
    p.mkdir(parents=True, exist_ok=True)
    return p



# ─── Chrome via CDP ──────────────────────────────────────────────────────────

def cdp_ativo() -> bool:
    try:
        with urllib.request.urlopen(
            f"http://localhost:{PORTA_CDP}/json/version", timeout=2
        ) as r:
            return r.status == 200
    except Exception:
        return False

def abrir_chrome() -> None:
    Path(CHROME_PERFIL_SIGA).mkdir(parents=True, exist_ok=True)
    subprocess.Popen([
        CHROME_EXECUTABLE,
        f"--remote-debugging-port={PORTA_CDP}",
        f"--user-data-dir={CHROME_PERFIL_SIGA}",
        "--no-first-run",
        "--no-default-browser-check",
        "--start-maximized",
        URL_HOME,
    ])
    log.debug("Chrome aberto.")

async def aguardar_chrome_iniciar() -> None:
    for _ in range(30):
        if cdp_ativo():
            return
        await asyncio.sleep(1)
    raise RuntimeError(
        f"Chrome não respondeu.\nVerifique CHROME_EXECUTABLE em config.py:\n  {CHROME_EXECUTABLE}"
    )

async def conectar_e_aguardar_login() -> tuple:
    if not cdp_ativo():
        abrir_chrome()
        await aguardar_chrome_iniciar()
    else:
        log.debug("Chrome já em execução — conectando...")

    p       = await async_playwright().start()
    browser = await p.chromium.connect_over_cdp(f"http://localhost:{PORTA_CDP}")

    # Procura aba do SIGA ou usa a primeira disponível
    page = None
    for ctx in browser.contexts:
        for pg in ctx.pages:
            if URL_BASE in pg.url:
                page = pg
                break
        if page:
            break
    if page is None:
        ctx  = browser.contexts[0] if browser.contexts else await browser.new_context()
        page = ctx.pages[0]        if ctx.pages        else await ctx.new_page()

    page.set_default_timeout(TIMEOUT_MS)

    # ── Aguarda o campo de busca de contribuinte aparecer ────────────────────
    # Essa é a verificação definitiva de "login concluído + tela pronta":
    # o campo só aparece depois que o usuário fez login e o Angular renderizou
    # a tela de seleção. Não usamos URL pois URL_HOME já contém /ui/ e seria
    # considerado "logado" antes mesmo do login ser realizado.
    _SELETOR_CAMPO_LOGIN = (
        "input[placeholder*='CNPJ' i], input[placeholder*='CGF' i], "
        "input[placeholder*='Razão' i], input[placeholder*='contribuinte' i], "
        "input[placeholder*='pesquis' i], #tabela-pesquisa-id"
    )
    timeout_login_ms = TIMEOUT_LOGIN_MIN * 60 * 1_000

    # 1. Verifica se o campo já está visível (sessão ativa)
    campo_visivel = False
    try:
        await page.wait_for_selector(_SELETOR_CAMPO_LOGIN, state="visible", timeout=3_000)
        campo_visivel = True
    except Exception:
        pass

    if not campo_visivel:
        if URL_BASE in page.url:
            await _forcar_recarregar_home(page, "campo de busca ausente na aba do SIGA")
        # 2. Navega para URL_HOME apenas se não estiver no domínio do SIGA
        # (evita reiniciar a tela de login quando o Chrome já abriu a página de autenticação)
        if URL_BASE not in page.url:
            try:
                await page.goto(URL_HOME, wait_until="load", timeout=20_000)
            except Exception:
                pass
        # Espera networkidle para garantir que o Angular terminou de montar a tela
        try:
            await page.wait_for_load_state("networkidle", timeout=10_000)
        except Exception:
            pass
        try:
            await page.wait_for_selector(_SELETOR_CAMPO_LOGIN, state="visible", timeout=10_000)
            campo_visivel = True
        except Exception:
            pass

    if not campo_visivel:
        # 3. Sessão expirada — aguarda o usuário fazer login manualmente
        print()
        print("=" * 62)
        print("  Chrome aberto no SIGA.")
        print("  -> Resolva o CAPTCHA")
        print("  -> Selecione o certificado digital")
        print("  O bot iniciará automaticamente apos o login.")
        print(f"  (Limite: {TIMEOUT_LOGIN_MIN} minutos)")
        print("=" * 62)
        print()

        try:
            await page.wait_for_selector(
                _SELETOR_CAMPO_LOGIN, state="visible", timeout=timeout_login_ms
            )
        except Exception:
            raise TimeoutError(
                f"Login nao detectado apos {TIMEOUT_LOGIN_MIN} minutos. "
                "Verifique se o Chrome esta aberto e o login foi realizado."
            )

    log.debug(f"Login detectado em: {page.url} — interface pronta.")
    return p, browser, page


# ─── Passo 1: Buscar e selecionar contribuinte ───────────────────────────────

async def buscar_contribuinte(page, cnpj_puro: str) -> None:
    """
    Na tela inicial do SIGA:
    - Garante que está na tela de seleção de contribuinte
    - Digita o CNPJ no campo de busca
    - Clica no botão de pesquisa
    - Aguarda a tabela carregar
    - Clica na linha do contribuinte
    - Aguarda a nova página carregar (URL pode variar conforme versão do SIGA)
    """
    cnpj_fmt = formatar_cnpj(cnpj_puro)
    log.debug(f"  [1] Buscando contribuinte: {cnpj_fmt}")
    log.debug(f"  [1] URL atual: {page.url}")

    # ── Garante que está na tela de seleção de contribuinte ───────────────────
    if "selecao-contribuinte" not in page.url:
        log.debug("  [1] Navegando para a tela de seleção de contribuinte...")
        try:
            item_menu = page.get_by_text(
                re.compile(r"Buscar.*Contribuinte|Lista.*Contribuinte|Selec.*Contribuinte", re.IGNORECASE)
            ).first
            if await item_menu.count():
                await item_menu.click()
                await _aguardar(page)
            else:
                raise Exception("Item de menu não encontrado")
        except Exception:
            await page.goto(URL_HOME, wait_until="load", timeout=20_000)

        # Aguarda Angular terminar de renderizar após qualquer navegação
        try:
            await page.wait_for_load_state("networkidle", timeout=10_000)
        except Exception:
            pass
        log.debug(f"  [1] Tela de seleção carregada: {page.url}")

    # ── Aguarda o campo de busca aparecer (Angular pode ainda estar renderizando) ──
    _SELETOR_CAMPO = (
        "input[placeholder*='CNPJ' i], input[placeholder*='CGF' i], "
        "input[placeholder*='Razão' i], input[placeholder*='contribuinte' i], "
        "input[placeholder*='pesquis' i], #tabela-pesquisa-id"
    )
    try:
        await page.wait_for_selector(_SELETOR_CAMPO, state="visible", timeout=30_000)
        log.debug("  [1] Tela de seleção pronta — campo de busca visível.")
    except Exception:
        await _forcar_recarregar_home(page, "campo de busca nao apareceu na selecao")
        try:
            await page.wait_for_selector(_SELETOR_CAMPO, state="visible", timeout=30_000)
            log.debug("  [1] Tela de seleção pronta após recarregar.")
        except Exception:
            await screenshot_debug(page, "debug_campo_busca_timeout")
            raise Exception(
                "Campo de busca não apareceu em 30s após navegar para seleção de contribuinte. "
                "Veja screenshots/debug_campo_busca_timeout.png"
            )

    # ── Localiza o campo de busca ─────────────────────────────────────────────
    # Usa get_by_placeholder (mais confiável no Playwright que CSS com flag i).
    # O campo real tem placeholder "CNPJ, CGF ou Razão Social..." — tenta
    # variações para compatibilidade com diferentes versões do SIGA.
    _TENTATIVAS_CAMPO = [
        # get_by_placeholder — corresponde a qualquer placeholder que CONTENHA o texto
        lambda: page.get_by_placeholder(re.compile(r"CNPJ", re.IGNORECASE)).first,
        lambda: page.get_by_placeholder(re.compile(r"CGF", re.IGNORECASE)).first,
        lambda: page.get_by_placeholder(re.compile(r"Razão|Razao", re.IGNORECASE)).first,
        lambda: page.get_by_placeholder(re.compile(r"contribuinte", re.IGNORECASE)).first,
        lambda: page.get_by_placeholder(re.compile(r"pesquis", re.IGNORECASE)).first,
        # CSS por ID — específico do SIGA
        lambda: page.locator("#tabela-pesquisa-id").first,
    ]

    campo = None
    for tentativa in _TENTATIVAS_CAMPO:
        try:
            loc = tentativa()
            if await loc.count() and await loc.is_visible():
                campo = loc
                log.debug(f"  [1] Campo de busca encontrado.")
                break
        except Exception:
            continue

    if campo is None:
        await screenshot_debug(page, "debug_campo_busca")
        raise Exception(
            "Campo de busca não encontrado na tela de seleção de contribuinte. "
            "Veja screenshots/debug_campo_busca.png"
        )

    await campo.click(click_count=3)
    await campo.fill(cnpj_fmt)
    log.debug(f"  [1] CNPJ digitado: {cnpj_fmt} — aguardando 10s...")
    await asyncio.sleep(10)

    # ── Botão pesquisar ───────────────────────────────────────────────────────
    _SELETORES_BOTAO = [
        "button:has(.pi-search)",
        "button.p-button-icon-only",
        "button[aria-label*='pesquis' i]",
        "button[aria-label*='search' i]",
        "button[aria-label*='buscar' i]",
        "button[type='submit']",
    ]

    botao = None
    for seletor in _SELETORES_BOTAO:
        try:
            loc = page.locator(seletor).first
            if await loc.count() and await loc.is_visible():
                botao = loc
                log.debug(f"  [1] Botão de pesquisa encontrado: {seletor!r}")
                break
        except Exception:
            continue

    if botao is None:
        # Fallback: pressiona Enter no campo
        log.debug("  [1] Botão de pesquisa não encontrado — pressionando Enter.")
        await campo.press("Enter")
    else:
        await botao.click()

    log.debug("  [1] Pesquisa enviada — aguardando resultado...")

    # Aguarda linha aparecer na tabela de resultados.
    # Tenta múltiplos seletores pois o ID pode variar entre versões do SIGA.
    _SELETORES_LINHA = [
        "tr#body-custom",
        "table tbody tr.ng-star-inserted",
        ".p-datatable-tbody tr",
        "table tbody tr",
    ]

    seletor_linha_encontrado = None
    for sel_linha in _SELETORES_LINHA:
        try:
            await page.wait_for_selector(sel_linha, timeout=TIMEOUT_MS)
            seletor_linha_encontrado = sel_linha
            log.debug(f"  [1] Linha de resultado encontrada com seletor: {sel_linha!r}")
            break
        except PlaywrightTimeout:
            log.debug(f"  [1] Seletor {sel_linha!r} não encontrou resultado.")

    if seletor_linha_encontrado is None:
        await screenshot_debug(page, "debug_resultado_busca")
        raise Exception(
            f"Nenhuma linha de resultado encontrada para o CNPJ {cnpj_fmt}. "
            "Veja screenshots/debug_resultado_busca.png"
        )

    # ── Aguarda que a linha correta (com o CNPJ digitado) esteja visível ──────
    # O Angular filtra a tabela de forma assíncrona; sem essa espera o bot pode
    # clicar na primeira linha da lista anterior (outro contribuinte).
    cnpj_num = re.sub(r"\D", "", cnpj_puro)
    linha_correta = None
    for _ in range(20):   # até 20 s
        linhas = page.locator(seletor_linha_encontrado)
        total = await linhas.count()
        for li in range(min(total, 20)):
            try:
                txt = re.sub(r"\D", "", await linhas.nth(li).inner_text())
                if cnpj_num in txt:
                    linha_correta = linhas.nth(li)
                    break
            except Exception:
                continue
        if linha_correta is not None:
            break
        await asyncio.sleep(1)

    if linha_correta is None:
        await screenshot_debug(page, "debug_resultado_busca")
        raise Exception(
            f"Resultado da busca não contém o CNPJ {cnpj_fmt} após aguardar. "
            "Veja screenshots/debug_resultado_busca.png"
        )

    url_antes = page.url

    # Clica na linha do contribuinte correto
    # Tabelas PrimeNG às vezes exigem dblclick ou disparo via JS — tenta as três estratégias
    log.debug("  [1] Clicando no contribuinte (tentativa 1 — click)...")
    await linha_correta.click()

    # ── Aguarda navegação após seleção do contribuinte ────────────────────────
    # Aceita qualquer mudança de URL: o SIGA pode navegar para fora de
    # selecao-contribuinte OU mudar a URL dentro dela (ex: incluindo o CNPJ).
    _timeout_selecao = TIMEOUT_LOGIN_MIN * 60 * 1_000
    url_mudou = False
    try:
        await page.wait_for_url(
            lambda url: url != url_antes,
            timeout=8_000,
        )
        url_mudou = True
    except PlaywrightTimeout:
        pass

    if not url_mudou:
        # Tentativa 2: duplo clique
        log.debug("  [1] URL não mudou — tentando dblclick...")
        try:
            await linha_correta.dblclick()
            await page.wait_for_url(
                lambda url: url != url_antes,
                timeout=8_000,
            )
            url_mudou = True
        except PlaywrightTimeout:
            pass

    if not url_mudou:
        # Tentativa 3: disparo via JavaScript (ignora event.stopPropagation do Angular)
        log.debug("  [1] URL não mudou — tentando clique via JavaScript...")
        try:
            await linha_correta.dispatch_event("click")
            await page.wait_for_url(
                lambda url: url != url_antes,
                timeout=8_000,
            )
            url_mudou = True
        except PlaywrightTimeout:
            pass

    if not url_mudou:
        # Aguarda longo para certificado A3 / PIN (usuário precisa confirmar manualmente)
        log.debug(f"  [1] Aguardando confirmação manual (PIN/certificado) — até {TIMEOUT_LOGIN_MIN} min...")
        log.info("  [1] (Se aparecer diálogo de certificado/PIN, confirme agora)")
        try:
            await page.wait_for_url(
                lambda url: url != url_antes,
                timeout=_timeout_selecao,
            )
        except PlaywrightTimeout:
            log.debug("  [1] URL não mudou após timeout — continuando mesmo assim...")

    await _aguardar(page)
    log.debug(f"  [1] Página carregada: {page.url}")

    # ── Verificação de segurança ──────────────────────────────────────────────
    # Aceita navegação para dentro de selecao-contribuinte com CNPJ na URL
    # (algumas versões do SIGA mantêm "selecao-contribuinte" na rota após a seleção)
    url_atual = page.url
    cnpj_na_url_atual = cnpj_num in url_atual.replace(".", "").replace("/", "").replace("-", "")
    ainda_na_selecao = "selecao-contribuinte" in url_atual and not cnpj_na_url_atual and url_atual == url_antes

    if ainda_na_selecao:
        await screenshot_debug(page, "debug_selecao_nao_saiu")
        raise Exception(
            f"Ainda na tela de seleção após clicar no contribuinte ({cnpj_fmt}). "
            "O contribuinte não foi selecionado corretamente. "
            "Veja screenshots/debug_selecao_nao_saiu.png"
        )

    # ── Confirma que a URL corresponde ao CNPJ esperado (aviso, não erro fatal) ──
    if not cnpj_na_url_atual:
        cnpj_na_url = re.search(r"/contribuinte/(\d+)/", url_atual)
        cnpj_aberto = cnpj_na_url.group(1) if cnpj_na_url else "desconhecido"
        log.debug(
            f"  [1] Aviso: CNPJ na URL ({cnpj_aberto}) pode diferir do solicitado ({cnpj_fmt}). "
            "Continuando — o SIGA pode usar formato de URL diferente."
        )
        await screenshot_debug(page, "debug_cnpj_url_check")
    else:
        log.debug(f"  [1] CNPJ confirmado na URL: {cnpj_fmt}")


# ─── Passo 2: Clicar em Informações Fiscais ──────────────────────────────────

async def clicar_informacoes_fiscais(page) -> None:
    """
    Clica no item 'Informações Fiscais' da página do contribuinte.

    O link pode aparecer como:
      - Item de menu lateral (li / a no nav)
      - Botão / card na área principal
      - Aba horizontal
    Tenta múltiplos seletores em sequência para compatibilidade com
    diferentes versões do layout do SIGA.
    """
    log.debug("  [2] Localizando 'Informações Fiscais'...")
    log.debug(f"  [2] URL atual: {page.url}")

    # Guard: só deve ser chamada APÓS o contribuinte ter sido selecionado
    if "selecao-contribuinte" in page.url:
        raise Exception(
            "clicar_informacoes_fiscais chamada na tela de seleção de contribuinte — "
            "o contribuinte ainda não foi selecionado. Abortando."
        )

    padrao = re.compile(r"Informa[çc][õo]es?\s+Fiscais?", re.IGNORECASE)

    candidatos = [
        # Menu lateral — link ou item de lista
        page.locator("nav a, nav li, aside a, aside li").filter(has_text=padrao).first,
        # Qualquer link com o texto exato
        page.locator("a").filter(has_text=padrao).first,
        # Role link ou menuitem
        page.get_by_role("link",     name=padrao).first,
        page.get_by_role("menuitem", name=padrao).first,
        # Aba horizontal
        page.get_by_role("tab",      name=padrao).first,
        # Botão ou card
        page.get_by_role("button",   name=padrao).first,
        # Fallback genérico: qualquer elemento visível com o texto
        page.get_by_text(padrao).first,
    ]

    item = None
    for candidato in candidatos:
        try:
            if await candidato.count():
                item = candidato
                break
        except Exception:
            continue

    if item is None:
        await screenshot_debug(page, "debug_informacoes_fiscais")
        raise Exception(
            "Link 'Informações Fiscais' não encontrado na página. "
            "Veja screenshots/debug_informacoes_fiscais.png"
        )

    await item.wait_for(state="visible", timeout=TIMEOUT_MS)
    await item.scroll_into_view_if_needed()
    await item.click()
    log.debug("  [2] 'Informações Fiscais' clicado — aguardando carregar...")

    await _aguardar(page)
    log.debug(f"  [2] Informações Fiscais carregada: {page.url}")


# ─── Passo 2b: Selecionar tabela Emissor / Destinatário ─────────────────────

async def selecionar_tabela(page, tipo: str) -> None:
    """
    Clica em 'Emissor' ou 'Destinatário' no seletor de tabela.

    Estrutura real do elemento (PrimeNG SelectButton):
      <div role="radio" aria-label="Destinatário" class="p-button ...">
        <span class="p-button-label">Destinatário</span>
      </div>
    Não é um <button> — usa role="radio" e aria-label.
    """
    log.debug(f"  [2b] Selecionando tabela: {tipo}")

    candidatos = [
        # Seletor pelo aria-label (mais preciso)
        page.locator(f"[aria-label='{tipo}']").first,
        # Pelo role radio + nome acessível
        page.get_by_role("radio", name=re.compile(tipo, re.IGNORECASE)).first,
        # Pelo span p-button-label dentro do div.p-button
        page.locator("div.p-button span.p-button-label").filter(
            has_text=re.compile(f"^{tipo}$", re.IGNORECASE)
        ).first,
        # Fallback genérico
        page.locator("div[role='radio']").filter(
            has_text=re.compile(f"^{tipo}$", re.IGNORECASE)
        ).first,
    ]

    botao = None
    for candidato in candidatos:
        if await candidato.count():
            botao = candidato
            break

    if botao is None:
        await screenshot_debug(page, f"debug_tabela_{tipo}")
        raise Exception(
            f"Botão '{tipo}' não encontrado no seletor de tabela. "
            f"Veja screenshots/debug_tabela_{tipo}.png"
        )

    await botao.wait_for(state="visible", timeout=TIMEOUT_MS)
    await botao.click()
    await _aguardar(page)
    log.debug(f"  [2b] Tabela '{tipo}' selecionada.")


# ─── Screenshots ─────────────────────────────────────────────────────────────

async def screenshot_debug(page, nome: str) -> None:
    """Salva screenshot do navegador para diagnóstico."""
    pasta = Path(cfg.PASTA_DOWNLOADS).parent / "screenshots"
    pasta.mkdir(exist_ok=True)
    caminho = pasta / f"{nome}.png"
    await page.screenshot(path=str(caminho), full_page=True)
    log.debug(f"  Screenshot salvo: {caminho}")


async def tirar_screenshot(page, cnpj: str, tipo: str, prefixo: str = "print") -> Path:
    """
    Salva um screenshot da tela atual na pasta de destino do CNPJ.
    Nome: print_emissor_MAIO_2026_2026-06-02_14-30-00.png
          print_nfce_emissor_MAIO_2026_2026-06-02_14-30-00.png
    Deve ser chamado ANTES de coletar a tabela para download.
    Aguarda 5 s antes de capturar para garantir que a página carregou.
    """
    await asyncio.sleep(5)
    destino = pasta_destino(cnpj)
    mes, ano = mes_anterior()
    nome_mes = MESES_PT[mes - 1].upper()
    timestamp = datetime.now().strftime("%Y-%m-%d_%H-%M-%S")
    tipo_slug = tipo.lower().replace("á", "a").replace("ã", "a").replace("é", "e")
    nome_arquivo = f"{prefixo}_{tipo_slug}_{nome_mes}_{ano}_{timestamp}.png"
    caminho = destino / nome_arquivo
    await page.screenshot(path=str(caminho), full_page=True)
    log.debug(f"  [screenshot] Print salvo: {caminho}")
    return caminho


# ─── Índices das colunas na tabela de Indicadores por Mês ───────────────────
# NF-e:  [0]MÊS [1]NFe-QTD [2]NFe-VALOR [3]Aut-QTD [4]Aut-% [5]Aut-VALOR [6]Can-QTD ...
# NFC-e: [0]MÊS [1]Aut-QTD [2]Aut-VALOR [3]Can-QTD [4]Can-% [5]Can-VALOR
INDICE_AUTORIZADAS      = 3   # NF-e
INDICE_CANCELADAS       = 6   # NF-e
INDICE_NFCE_AUTORIZADAS = 1   # NFC-e

# ─── Acumulador de arquivos baixados (preenchido em _baixar_coluna) ──────────
# Cada entrada: {"cnpj", "periodo", "documento", "tabela", "tipo_nota", "caminho"}
_arquivos_coletados: list[dict] = []


# ─── Passos 3+4: Selecionar mês e clicar coluna desejada ────────────────────

async def _linha_do_mes(page, nome_mes: str):
    """Localiza e retorna a linha (<tr>) que contém o nome do mês na tabela."""
    for sel in ("table tbody tr", ".p-datatable-tbody tr"):
        linhas = page.locator(sel)
        total = await linhas.count()
        for i in range(total):
            try:
                txt = await linhas.nth(i).inner_text()
                if nome_mes.lower() in txt.lower():
                    return linhas.nth(i)
            except Exception:
                continue
    return None


async def clicar_mes_e_coluna(page, indice_coluna: int, nome_coluna: str) -> None:
    """
    Na tabela 'Indicadores por Mês' (tela de Informações Fiscais):

    1. Encontra a linha do mês anterior (ex.: Abril).
    2. Clica no link do nome do mês (coluna MÊS).
    3. Clica no número da célula no índice especificado.

    Estrutura padrão:
      [0] MÊS | [1] NFe-QTD | [2] NFe-VALOR | [3] Aut-QTD | [4] Aut-% |
      [5] Aut-VALOR | [6] Can-QTD | ...
    """
    mes, ano = mes_anterior()
    nome_mes = MESES_PT[mes - 1]
    log.debug(f"  [3] Localizando linha do mês '{nome_mes}' na tabela de indicadores...")

    await page.wait_for_selector(
        "table tbody tr, .p-datatable-tbody tr",
        timeout=TIMEOUT_MS,
    )

    # ── Passo 3: clica no nome do mês ────────────────────────────────────────
    linha = await _linha_do_mes(page, nome_mes)
    if linha is None:
        await screenshot_debug(page, "debug_tabela_meses")
        raise Exception(
            f"Linha do mês '{nome_mes}' não encontrada na tabela. "
            "Veja o screenshot em screenshots/debug_tabela_meses.png"
        )

    # Clica no link dentro da 1ª célula (nome do mês)
    # → expande a linha mostrando sub-itens (Interno, Interestadual, Externo)
    # → NÃO navega para outra página; tudo ocorre na mesma tela
    primeira_celula = linha.locator("td").first
    link_mes = primeira_celula.locator("a").first
    if await link_mes.count():
        await link_mes.click()
    else:
        await primeira_celula.click()
    log.debug(f"  [3] '{nome_mes}' clicado — aguardando expansão da linha...")
    await asyncio.sleep(0.5)   # Angular expande a linha antes do próximo locator

    # ── Passo 4: clica no QTD da coluna solicitada ───────────────────────────
    linha = await _linha_do_mes(page, nome_mes)
    if linha is None:
        await screenshot_debug(page, "debug_apos_click_mes")
        raise Exception(
            f"Linha '{nome_mes}' sumiu após o clique. "
            "Veja o screenshot em screenshots/debug_apos_click_mes.png"
        )

    celulas = linha.locator("td")
    qtd_cel = await celulas.count()
    log.debug(f"  [4] Células na linha '{nome_mes}': {qtd_cel} | Coluna alvo: {nome_coluna} (índice {indice_coluna})")

    if qtd_cel > indice_coluna:
        alvo = celulas.nth(indice_coluna)

        # Verifica se há registros antes de tentar clicar
        valor_cel = (await alvo.inner_text()).strip()
        if valor_cel in ("0", "-", "", "0,00", "0.00"):
            raise ValueError(
                f"Coluna '{nome_coluna}' com valor zero ({valor_cel!r}) — sem registros para baixar."
            )

        link = alvo.locator("a").first
        if await link.count():
            await link.click()
            log.debug(f"  [4] Link da coluna '{nome_coluna}' clicado.")
        else:
            await alvo.click()
            log.debug(f"  [4] Célula da coluna '{nome_coluna}' clicada.")
    else:
        # Fallback: 2º link da linha (pula o link do nome do mês)
        links = linha.locator("a")
        qtd_links = await links.count()
        log.warning(
            f"  [4] Poucos tds ({qtd_cel}) para índice {indice_coluna}; "
            f"tentando 2º link da linha..."
        )
        alvo_link = links.nth(1) if qtd_links >= 2 else links.first
        await alvo_link.click()

    await page.wait_for_selector("text=/Detalhamento/i", timeout=TIMEOUT_MS)
    log.debug(f"  [3+4] Mês '{nome_mes}' e '{nome_coluna}' selecionados — Detalhamento carregado.")


# Mantém o nome antigo como alias para não quebrar chamadas externas
async def clicar_mes_e_nfe_autorizadas(page) -> None:
    await clicar_mes_e_coluna(page, INDICE_AUTORIZADAS, "NF-E Emitidas Autorizadas")


# ─── Passo 5: Solicitar geração do arquivo (Baixar Tabela) ──────────────────

async def clicar_baixar_tabela(page) -> bool:
    """
    Aguarda a seção '2. Detalhamento' aparecer na mesma página
    e clica no botão 'Baixar Tabela' DESSA seção (o último botão
    com ícone pi pi-download na página — o primeiro pertence à
    tabela de Indicadores por Mês).

    Após o clique o sistema gera o arquivo em segundo plano;
    o download real acontece depois, na aba Downloads.

    Retorna:
      True  — nova solicitação criada com sucesso
      False — o site informou que já existe uma solicitação em fila
              (nenhuma linha nova é criada na tabela de Downloads)
    """
    log.debug("  [5] Aguardando seção 'Detalhamento' carregar na página...")

    # Aguarda a seção Detalhamento aparecer (confirma que o clique no
    # número da NF-E Autorizadas funcionou e a tabela carregou abaixo)
    await page.wait_for_selector(
        "text=/Detalhamento/i",
        timeout=TIMEOUT_MS,
    )

    # A página tem DOIS botões "Baixar Tabela" (ícone pi-download):
    #   [0] → tabela "Indicadores por Mês"   (NÃO queremos esse)
    #   [1] → seção "Detalhamento ..."        (ESSE é o correto, circulado no print)
    # Usamos .last para pegar sempre o da seção Detalhamento.
    todos = page.locator("button:has(.pi-download)")
    qtd   = await todos.count()
    log.debug(f"  [5] Botões 'Baixar Tabela' encontrados na página: {qtd}")

    if qtd >= 2:
        botao = todos.last          # botão da seção Detalhamento
    elif qtd == 1:
        botao = todos.first         # só existe um — usa ele
    else:
        await screenshot_debug(page, "debug_baixar_tabela")
        raise Exception(
            "Botão 'Baixar Tabela' (pi-download) não encontrado na página. "
            "Veja screenshots/debug_baixar_tabela.png"
        )

    await botao.scroll_into_view_if_needed()
    await botao.wait_for(state="visible", timeout=TIMEOUT_MS)
    await botao.click()
    log.debug("  [5] 'Baixar Tabela' clicado — verificando resposta do servidor...")
    await asyncio.sleep(1)   # breve pausa para o toast de resposta aparecer

    # ── Detecta se o site respondeu "já existe solicitação" ──────────────────
    # O SIGA exibe um toast/alert quando a solicitação já está na fila;
    # nesse caso NÃO cria uma nova linha na tabela de Downloads.
    _PATTERN_JA_EXISTE = re.compile(
        r"j[aá]\s*exist|j[aá]\s*foi\s*solicit|solicit.*j[aá]|"
        r"already\s*exist|duplicate|duplic|em\s*fila|na\s*fila",
        re.IGNORECASE,
    )
    ja_existe = False
    try:
        # Verifica toasts, mensagens e diálogos visíveis
        candidatos_msg = page.locator(
            "p-toast .p-toast-message-text, "
            ".p-message-text, "
            "p-messages .p-messages-detail, "
            ".p-dialog-content, "
            "[role='alert'], "
            "[role='status']"
        )
        qtd_msg = await candidatos_msg.count()
        for mi in range(min(qtd_msg, 5)):
            try:
                txt = (await candidatos_msg.nth(mi).inner_text()).strip()
                if txt and _PATTERN_JA_EXISTE.search(txt):
                    log.debug(
                        f"  [5] Servidor informou solicitação duplicada: {txt!r} "
                        f"— a linha já existe na fila de Downloads."
                    )
                    ja_existe = True
                    break
            except Exception:
                continue
    except Exception:
        pass

    if not ja_existe:
        log.debug("  [5] Nova solicitação criada — arquivo sendo gerado em segundo plano.")

    return not ja_existe   # True = nova, False = já existia


# ─── Passo 6: Navegar para a aba Downloads ───────────────────────────────────

async def clicar_menu_downloads(page) -> None:
    """Clica em 'Downloads' no menu lateral do SIGA."""
    log.debug("  [6] Abrindo aba Downloads no menu lateral...")

    item = page.get_by_text(
        re.compile(r"^Downloads?$", re.IGNORECASE)
    ).first
    await item.wait_for(state="visible", timeout=TIMEOUT_MS)
    await item.click()

    await _aguardar(page)
    log.debug("  [6] Aba Downloads aberta.")


# ─── Passo 7: Atualizar status e baixar o arquivo ────────────────────────────

async def _identificar_linha(page, seletor: str, tempo_solicitacao: datetime):
    """
    Varre as linhas da tabela de Downloads e retorna a que tem DATA SOLIC
    mais próxima de tempo_solicitacao (dentro de 15 min).

    Estrutura esperada das colunas:
      [0] CNPJ BASE | [1] CNPJ | [2] TELA/ABA | [3] TIPO DOC | [4] FILTROS |
      [5] DATA SOLIC | [6] DATA EXPIR | [7] STATUS | [8] DOWNLOAD

    Retorna (locator_da_linha, índice) ou (None, -1) se não encontrar.
    """
    FORMATOS_DATA = ("%d/%m/%Y %H:%M:%S", "%d/%m/%Y %H:%M", "%Y-%m-%d %H:%M:%S", "%Y-%m-%dT%H:%M:%S")
    JANELA_MAX    = timedelta(minutes=15)
    IDX_DATA_SOLIC = 5   # coluna DATA SOLIC (0-based)

    linhas = page.locator(seletor)
    total  = await linhas.count()
    if total == 0:
        return None, -1

    melhor_linha = None
    melhor_diff  = JANELA_MAX
    melhor_idx   = -1

    for i in range(min(total, 20)):   # verifica até 20 linhas
        try:
            celulas = linhas.nth(i).locator("td")
            qtd     = await celulas.count()

            # Tenta a coluna esperada; se não houver células suficientes, usa a 1ª disponível
            idx = IDX_DATA_SOLIC if qtd > IDX_DATA_SOLIC else max(0, qtd - 3)
            data_txt = (await celulas.nth(idx).inner_text()).strip()

            for fmt in FORMATOS_DATA:
                try:
                    dt   = datetime.strptime(data_txt, fmt)
                    diff = abs(dt - tempo_solicitacao)
                    if diff < melhor_diff:
                        melhor_diff  = diff
                        melhor_linha = linhas.nth(i)
                        melhor_idx   = i
                    break
                except ValueError:
                    continue
        except Exception:
            continue

    if melhor_linha is not None:
        log.debug(
            f"  [7] Linha identificada: índice {melhor_idx} "
            f"(diferença de {melhor_diff.seconds}s em relação à solicitação)"
        )
    else:
        # Sem correspondência — sinaliza para o chamador tentar outra estratégia
        log.debug(
            "  [7] Nenhuma linha com DATA SOLIC dentro de 15 min encontrada."
        )

    return melhor_linha, melhor_idx


async def _identificar_linha_por_filtros(
    page, seletor: str, tipo_str: str
):
    """
    Estratégia PRINCIPAL de identificação de linha na tabela de Downloads.

    Usa a coluna 'FILTROS APLICADOS' (índice 4) que contém:
      Período Selecionado: MM/AAAA
      Resultado Processamento: AUTORIZADA | CANCELADA
      Visão: EMISSOR | DESTINATÁRIO

    Deriva os valores esperados a partir de tipo_str
    (ex: "emissor_nf-e_emitidas_autorizadas" ou "destinatario_nf-e_emitidas_canceladas").

    Retorna (locator_da_linha, índice) ou (None, -1).
    """
    mes, ano    = mes_anterior()
    periodo_esp = f"{mes:02d}/{ano}"          # ex: "05/2026"

    tl = tipo_str.lower()
    visao_esp     = "DESTINAT" if "destinat" in tl else "EMISSOR"
    resultado_esp = "CANCELAD" if "cancelad" in tl else "AUTORIZADA"

    IDX_FILTROS = 4   # coluna FILTROS APLICADOS (0-based)

    log.debug(
        f"  [7] Buscando por FILTROS: Período={periodo_esp} | "
        f"Visão={visao_esp} | Resultado={resultado_esp}"
    )

    linhas = page.locator(seletor)
    total  = await linhas.count()
    if total == 0:
        return None, -1

    for i in range(min(total, 30)):
        try:
            celulas = linhas.nth(i).locator("td")
            qtd     = await celulas.count()
            if qtd <= IDX_FILTROS:
                continue
            filtros_txt = (await celulas.nth(IDX_FILTROS).inner_text()).strip().upper()
            if (
                periodo_esp     in filtros_txt and
                visao_esp       in filtros_txt and
                resultado_esp   in filtros_txt
            ):
                status = ""
                if qtd >= 2:
                    status = (await celulas.nth(qtd - 2).inner_text()).strip()
                log.debug(
                    f"  [7] ✓ Linha por FILTROS: índice {i} | STATUS={status!r}"
                )
                return linhas.nth(i), i
        except Exception:
            continue

    log.debug(
        f"  [7] Nenhuma linha encontrada com os filtros esperados "
        f"({periodo_esp} / {visao_esp} / {resultado_esp})."
    )
    return None, -1


async def _identificar_linha_por_cnpj(
    page, seletor: str, cnpj: str
):
    """
    Estratégia de fallback: varre as linhas procurando o CNPJ no conteúdo.
    Prioriza linhas com status ativo; aceita qualquer linha com o CNPJ.
    Retorna (locator_da_linha, índice) ou (None, -1).
    """
    linhas   = page.locator(seletor)
    total    = await linhas.count()
    if total == 0:
        return None, -1

    cnpj_num = re.sub(r"\D", "", cnpj)

    # 1ª passagem: CNPJ + status ativo
    for i in range(min(total, 30)):
        try:
            txt = await linhas.nth(i).inner_text()
            if cnpj_num not in re.sub(r"\D", "", txt):
                continue
            celulas = linhas.nth(i).locator("td")
            qtd = await celulas.count()
            if qtd < 2:
                continue
            status = (await celulas.nth(qtd - 2).inner_text()).strip().lower()
            if any(s in status for s in ("process", "aguard", "fila", "queue", "pendent")):
                log.debug(f"  [7] Linha por CNPJ (ativa): índice {i} | STATUS={status!r}")
                return linhas.nth(i), i
        except Exception:
            continue

    # 2ª passagem: qualquer linha com o CNPJ
    for i in range(min(total, 30)):
        try:
            txt = await linhas.nth(i).inner_text()
            if cnpj_num in re.sub(r"\D", "", txt):
                celulas = linhas.nth(i).locator("td")
                qtd = await celulas.count()
                status = (await celulas.nth(qtd - 2).inner_text()).strip() if qtd >= 2 else ""
                log.debug(f"  [7] Linha por CNPJ (qualquer): índice {i} | STATUS={status!r}")
                return linhas.nth(i), i
        except Exception:
            continue

    log.debug(f"  [7] Nenhuma linha encontrada com CNPJ {cnpj}.")
    return None, -1


async def aguardar_e_baixar(
    page, cnpj: str, tipo: str = "emissor",
    tempo_solicitacao: datetime | None = None,
    nova_solicitacao: bool = True,
    nome_coluna: str = "",
) -> Path:
    """
    Na aba Downloads:
    1. Clica em 'Atualizar Status' e aguarda 8 s para o servidor processar.
    2. Identifica a linha correta:
       - Se nova_solicitacao=True  → usa DATA SOLIC mais próxima de tempo_solicitacao
       - Se nova_solicitacao=False → busca pelo CNPJ (solicitação já existia na fila)
       - Fallback: se nenhuma estratégia funcionar, usa a 1ª linha e avisa
    3. Lê o STATUS da linha identificada e aguarda 'Concluído'.
    4. Clica em 'Download' na última célula dessa mesma linha.
    5. Salva o arquivo em Downloads/{CNPJ - Razão Social}/{AAAA-MM}/.
    """
    if tempo_solicitacao is None:
        tempo_solicitacao = datetime.now()

    if not nova_solicitacao:
        log.debug(
            f"  [7] Solicitação duplicada detectada — buscando linha existente "
            f"pelo CNPJ {cnpj} na fila de Downloads..."
        )

    log.debug(
        f"  [7] Aguardando download na aba Downloads "
        f"(solicitado às {tempo_solicitacao.strftime('%H:%M:%S')})..."
    )

    destino        = pasta_destino(cnpj)
    mes, ano       = mes_anterior()
    INTERVALO      = 6   # segundos entre cada polling de status
    tentativas     = max(1, int(TIMEOUT_RELATORIO_MS // (INTERVALO * 1_000)))
    seletor_linhas = "table tbody tr, .p-datatable-tbody tr"

    linha_alvo = None   # locator da linha identificada
    idx_alvo   = -1

    for i in range(tentativas):
        # ── 1. Clica em "Atualizar Status" ───────────────────────────────────
        btn = page.get_by_role("button", name=re.compile(r"atualizar\s+status", re.IGNORECASE)).first
        if not await btn.count():
            btn = page.locator("button").filter(
                has_text=re.compile(r"atualizar\s+status", re.IGNORECASE)
            ).first

        if await btn.count():
            await btn.click()
            log.debug(f"  [7] ({i+1}/{tentativas}) 'Atualizar Status' clicado...")
            await _aguardar(page)
            await asyncio.sleep(1)   # aguarda Angular re-renderizar a tabela
        else:
            log.debug("  [7] Botão 'Atualizar Status' não encontrado.")

        # ── 2. Aguarda a tabela aparecer ──────────────────────────────────────
        try:
            await page.wait_for_selector(seletor_linhas, timeout=15_000)
        except Exception:
            log.debug(f"  [7] ({i+1}/{tentativas}) Tabela ainda não apareceu — aguardando {INTERVALO}s...")
            await asyncio.sleep(INTERVALO)
            continue

        # ── 3. Identifica a linha correta ─────────────────────────────────────
        # • nova_solicitacao=True  → novo item sempre aparece no TOPO (pág. 1)
        #   Busca só na pág. 1; fallback por DATA SOLIC para confirmar.
        # • nova_solicitacao=False → arquivo já existia na fila; pode estar
        #   em qualquer página — percorre todas até encontrar pelo CNPJ+tipo.

        if nova_solicitacao:
            # Nova solicitação: item recém-criado fica no topo (pág. 1)
            await _ir_primeira_pagina_downloads(page)
            linha_alvo, idx_alvo = await _checar_linha_existente(
                page, seletor_linhas, tipo, nome_coluna, cnpj
            )
            if linha_alvo is None:
                log.debug("  [7] Filtros não encontrados — tentando por DATA SOLIC...")
                linha_alvo, idx_alvo = await _identificar_linha(
                    page, seletor_linhas, tempo_solicitacao
                )
        else:
            # Solicitação duplicada: percorre todas as páginas para encontrar
            log.debug("  [7] Solicitação já existia — buscando em todas as páginas...")
            linha_alvo, idx_alvo = await _buscar_linha_em_todas_paginas(
                page, tipo, nome_coluna, cnpj
            )

        if linha_alvo is None:
            log.debug("  [7] Tentando identificar pelo CNPJ na página atual...")
            linha_alvo, idx_alvo = await _identificar_linha_por_cnpj(
                page, seletor_linhas, cnpj
            )

        if linha_alvo is None:
            log.debug("  [7] Linha não encontrada nesta tentativa — aguardando próximo ciclo...")
            await asyncio.sleep(INTERVALO)
            continue

        # ── 4. Lê STATUS da penúltima célula da linha identificada ────────────
        try:
            celulas   = linha_alvo.locator("td")
            qtd_cel   = await celulas.count()
            if qtd_cel < 2:
                raise ValueError(f"Apenas {qtd_cel} célula(s)")
            status_txt = (await celulas.nth(qtd_cel - 2).inner_text()).strip()
        except Exception as exc:
            log.debug(f"  [7] ({i+1}/{tentativas}) Erro ao ler status da linha {idx_alvo}: {exc}")
            await asyncio.sleep(INTERVALO)
            continue

        log.debug(f"  [7] ({i+1}/{tentativas}) Linha {idx_alvo} | STATUS = {status_txt!r}")

        if "conclu" not in status_txt.lower():
            await asyncio.sleep(INTERVALO)
            continue

        # ── 5. Linha concluída — localiza o link de Download ──────────────────
        log.debug(f"  [7] ✓ Arquivo pronto na linha {idx_alvo}! Localizando 'Download'...")
        # Usa diretamente a linha já identificada pelo critério correto (CNPJ + tipo + visão).
        # Não re-confirma por CNPJ genérico para não trocar por outro arquivo do mesmo CNPJ.

        # Estratégia 1: último td.align-center → span/a/button
        td_dl   = linha_alvo.locator("td.align-center").last
        link_dl = td_dl.locator("span, a, button").first

        # Estratégia 2: última célula da linha
        if not await link_dl.count():
            link_dl = linha_alvo.locator("td").last.locator("span, a, button").first

        # Estratégia 3: texto "Download" dentro da linha
        if not await link_dl.count():
            link_dl = linha_alvo.get_by_text(re.compile(r"^Download$", re.IGNORECASE)).first

        if not await link_dl.count():
            await screenshot_debug(page, f"debug_download_link_linha{idx_alvo}")
            raise Exception(
                f"Elemento 'Download' não encontrado na linha {idx_alvo}. "
                f"Veja screenshots/debug_download_link_linha{idx_alvo}.png"
            )

        log.debug("  [7] Elemento 'Download' localizado — clicando...")
        await link_dl.scroll_into_view_if_needed()
        await link_dl.wait_for(state="visible", timeout=TIMEOUT_MS)

        async with page.expect_download(timeout=120_000) as dl_ctx:
            await link_dl.click()

        download = await dl_ctx.value
        nome_sug = download.suggested_filename or f"nfe_{cnpj}_{tipo}_{ano}{mes:02d}.csv"
        caminho  = destino / nome_sug
        await download.save_as(str(caminho))
        log.debug(f"  [7] ✓ Arquivo salvo: {caminho}")
        return caminho

    raise TimeoutError(
        f"Arquivo não ficou disponível após {tentativas} tentativas "
        f"({TIMEOUT_RELATORIO_MS // 1000} s). Verifique a aba Downloads manualmente."
    )


# ─── Aba NFC-e: navegação e processamento ────────────────────────────────────

async def clicar_aba_nfce(page) -> None:
    """
    Clica na aba 'NFC-e' do menu horizontal superior da tela de
    Informações Fiscais (NF-e | Manifestações NF-e | ... | NFC-e | EFD | ...).
    """
    log.debug("  [nfce] Clicando na aba 'NFC-e' do menu superior...")

    candidatos = [
        page.get_by_role("tab", name=re.compile(r"^NFC-e$", re.IGNORECASE)).first,
        page.locator("a, li, span, div").filter(
            has_text=re.compile(r"^NFC-e$", re.IGNORECASE)
        ).first,
        page.get_by_text(re.compile(r"^NFC-e$", re.IGNORECASE)).first,
    ]

    aba = None
    for c in candidatos:
        if await c.count():
            aba = c
            break

    if aba is None:
        await screenshot_debug(page, "debug_aba_nfce")
        raise Exception(
            "Aba 'NFC-e' não encontrada no menu superior. "
            "Veja screenshots/debug_aba_nfce.png"
        )

    await aba.wait_for(state="visible", timeout=TIMEOUT_MS)
    await aba.click()
    await _aguardar(page)
    log.debug("  [nfce] Aba NFC-e aberta.")


async def processar_nfce(page, cnpj: str) -> bool:
    """
    Dentro da tela de Informações Fiscais, acessa a aba NFC-e e baixa
    a tabela de NFC-e Autorizadas do mês anterior (Emissor).

    Retorna True se o download foi concluído, False caso contrário
    (zero registros, erro recuperável). Não levanta exceção — o fluxo
    principal de NF-e não deve ser interrompido por falha aqui.
    """
    mes, ano = mes_anterior()
    nome_mes = MESES_PT[mes - 1]
    log.debug(f"\n  ── NFC-e Emissor ({nome_mes}/{ano}) ──")

    try:
        # Garante que está em Informações Fiscais e clica na aba NFC-e
        await clicar_informacoes_fiscais(page)
        await clicar_aba_nfce(page)

        # A tela NFC-e abre em Emissor por padrão — confirma visualmente
        # (se não estiver em Emissor, seleciona)
        emissor_ativo = page.locator(
            "[aria-label='Emissor'], div[role='radio']"
        ).filter(has_text=re.compile(r"^Emissor$", re.IGNORECASE)).first
        if await emissor_ativo.count():
            classes = await emissor_ativo.get_attribute("class") or ""
            if "p-highlight" not in classes and "active" not in classes.lower():
                await emissor_ativo.click()
                await _aguardar(page)

        # Print antes de coletar
        await tirar_screenshot(page, cnpj, "nfce_emissor", prefixo="print_nfce")

        # Clica no mês e na coluna NFC-e Autorizadas QTD (índice 1)
        sucesso = await _baixar_coluna(
            page, cnpj, "nfce_emissor",
            INDICE_NFCE_AUTORIZADAS, "NFC-E Autorizadas"
        )

        if sucesso:
            log.debug(f"  [nfce] ✓ NFC-e Emissor baixado: {nome_mes}/{ano}")
        return sucesso

    except Exception as e:
        log.warning(f"  [nfce] Não foi possível processar NFC-e para {cnpj}: {e}. Continuando...")
        return False


# ─── Navegação de paginação na tabela de Downloads ───────────────────────────

async def _proxima_pagina_downloads(page) -> bool:
    """
    Tenta clicar no botão 'Próxima página' do paginator do SIGA.
    Retorna True se clicou com sucesso, False se não existe ou está desabilitado.
    """
    candidatos = [
        page.locator(".p-paginator-next").first,
        page.locator("button[aria-label='Next Page']").first,
        page.locator("button[aria-label='Próxima Página']").first,
        page.locator("button[aria-label='Proxima Pagina']").first,
        page.get_by_role("button", name=re.compile(r"next|próxim|proxim", re.IGNORECASE)).first,
    ]
    for btn in candidatos:
        try:
            if not await btn.count():
                continue
            classes   = await btn.get_attribute("class") or ""
            disabled  = await btn.get_attribute("disabled")
            aria_dis  = await btn.get_attribute("aria-disabled") or ""
            if disabled is not None or "disabled" in classes or aria_dis.lower() == "true":
                return False
            await btn.click()
            await _aguardar(page)
            await asyncio.sleep(0.8)
            return True
        except Exception:
            continue
    return False


async def _ir_primeira_pagina_downloads(page) -> None:
    """
    Clica no botão 'Primeira página' do paginator para garantir que a
    busca sempre começa do início.
    """
    candidatos = [
        page.locator(".p-paginator-first").first,
        page.locator("button[aria-label='First Page']").first,
        page.locator("button[aria-label='Primeira Página']").first,
        page.get_by_role("button", name=re.compile(r"first|primeir", re.IGNORECASE)).first,
    ]
    for btn in candidatos:
        try:
            if not await btn.count():
                continue
            disabled = await btn.get_attribute("disabled")
            if disabled is not None:
                return  # já está na primeira página
            await btn.click()
            await _aguardar(page)
            await asyncio.sleep(0.5)
            return
        except Exception:
            continue


async def _buscar_linha_em_todas_paginas(
    page, tipo_str: str, nome_coluna: str, cnpj: str
) -> tuple:
    """
    Percorre TODAS as páginas da lista de Downloads do SIGA procurando a
    linha que corresponde a:
      - CNPJ   : mesmo do contribuinte selecionado
      - Período: mês anterior
      - Visão  : EMISSOR / DESTINATÁRIO
      - Resultado: AUTORIZADA / CANCELADA
      - Tipo doc : NF-e / NFC-e

    Navega para a primeira página antes de começar e avança página a página
    até encontrar a linha ou esgotar todas as páginas.

    Retorna (locator_da_linha, índice_na_pagina_atual) ou (None, -1).
    A função deixa o paginator na página onde a linha foi encontrada para
    que o clique de download funcione corretamente.
    """
    seletor = "table tbody tr, .p-datatable-tbody tr"

    await _ir_primeira_pagina_downloads(page)

    pagina = 1
    MAX_PAGINAS = 50  # teto de segurança

    while pagina <= MAX_PAGINAS:
        log.debug(f"  [check] Buscando na página {pagina} da lista de Downloads...")
        linha, idx = await _checar_linha_existente(page, seletor, tipo_str, nome_coluna, cnpj)
        if linha is not None:
            log.debug(f"  [check] ✓ Linha encontrada na página {pagina}.")
            return linha, idx

        avancoou = await _proxima_pagina_downloads(page)
        if not avancoou:
            log.debug(f"  [check] Última página atingida ({pagina}). Linha não encontrada.")
            return None, -1

        pagina += 1

    log.debug(f"  [check] Limite de {MAX_PAGINAS} páginas atingido sem encontrar a linha.")
    return None, -1


# ─── Verificação prévia na aba Downloads ────────────────────────────────────

async def _checar_linha_existente(
    page, seletor: str, tipo_str: str, nome_coluna: str, cnpj: str = ""
) -> tuple:
    """
    Verifica na tabela de Downloads se já existe uma linha para o relatório:
      - CNPJ      : deve bater com o contribuinte atual (coluna 0)
      - Período  : mês anterior  (ex: 05/2026)
      - Visão    : EMISSOR / DESTINATÁRIO
      - Resultado: AUTORIZADA / CANCELADA
      - Tipo doc : NF-e / NFC-e

    A coluna FILTROS APLICADOS (índice 4) contém texto como:
      "Período Selecionado: 05/2026
       Resultado Processamento: AUTORIZADA
       Visão: DESTINATÁRIO"

    O tipo NF-e vs NFC-e é inferido pelo texto completo da linha
    (colunas TELA/ABA ou TIPO DOC).

    Retorna (locator_da_linha, índice) ou (None, -1).
    """
    mes, ano      = mes_anterior()
    periodo_esp   = f"{mes:02d}/{ano}"
    tl            = tipo_str.lower()
    visao_esp     = "DESTINAT" if "destinat" in tl else "EMISSOR"
    resultado_esp = "CANCELAD" if "cancelad" in nome_coluna.lower() else "AUTORIZADA"
    eh_nfce       = "nfc" in tl
    IDX_FILTROS   = 4
    cnpj_num      = re.sub(r"\D", "", cnpj)

    log.debug(
        f"  [check] Procurando: CNPJ={cnpj_num} | período={periodo_esp} | "
        f"visão={visao_esp} | resultado={resultado_esp} | "
        f"tipo={'NFC-e' if eh_nfce else 'NF-e'}"
    )

    try:
        await page.wait_for_selector(seletor, timeout=10_000)
    except Exception:
        log.debug("  [check] Tabela de Downloads não encontrada.")
        return None, -1

    linhas = page.locator(seletor)
    total  = await linhas.count()
    if total == 0:
        log.debug("  [check] Downloads vazia.")
        return None, -1

    for i in range(min(total, 50)):
        try:
            celulas = linhas.nth(i).locator("td")
            qtd     = await celulas.count()
            if qtd <= IDX_FILTROS:
                continue

            # Verifica CNPJ nas colunas 0 (CNPJ BASE) e 1 (CNPJ)
            if cnpj_num:
                cnpj_c0 = re.sub(r"\D", "", await celulas.nth(0).inner_text())
                cnpj_c1 = re.sub(r"\D", "", await celulas.nth(1).inner_text()) if qtd > 1 else ""
                if cnpj_num not in cnpj_c0 and cnpj_num not in cnpj_c1:
                    continue

            filtros_txt = (await celulas.nth(IDX_FILTROS).inner_text()).strip().upper()

            # Período + visão + resultado devem estar nos filtros
            if not (
                periodo_esp   in filtros_txt and
                visao_esp     in filtros_txt and
                resultado_esp in filtros_txt
            ):
                continue

            # Distingue NF-e de NFC-e pelo texto completo da linha
            linha_txt = (await linhas.nth(i).inner_text()).upper()
            if eh_nfce:
                if "NFC" not in linha_txt:
                    continue
            else:
                # Deve conter NF-E mas NÃO ser NFC-e
                if "NF-E" not in linha_txt and "NFE" not in linha_txt:
                    continue
                if "NFC" in linha_txt:
                    continue

            status = (await celulas.nth(qtd - 2).inner_text()).strip() if qtd >= 2 else ""
            log.debug(f"  [check] ✓ Linha encontrada: idx={i} | CNPJ={cnpj_num} | status={status!r}")
            return linhas.nth(i), i

        except Exception:
            continue

    log.debug(f"  [check] Nenhuma linha correspondente para CNPJ={cnpj_num}.")
    return None, -1


# ─── Baixar uma coluna específica (autorizadas ou canceladas) ───────────────

async def _baixar_coluna(
    page, cnpj: str, tipo: str, indice: int, nome_coluna: str
) -> bool:
    """
    Fluxo por relatório (Emissor/Destinatário Autorizada/Cancelada, NFC-e):

    1. Vai para Informações Fiscais e posiciona na aba/tabela certa.
    2. Clica no mês e na coluna — levanta ValueError se valor for 0 (sem registros).
    3. Solicita geração ("Baixar Tabela").
    4. Vai para a aba Downloads.
    5. Busca a requisição em TODAS as páginas (CNPJ + período + tipo).
    6. Aguarda status "Concluído" e baixa o arquivo.

    Retorna True se baixou com sucesso, False se coluna vazia ou erro recuperável.
    Não levanta exceção para não interromper as demais colunas.
    """
    tipo_key   = f"{tipo}_{nome_coluna.lower().replace(' ', '_')}"
    tipo_label = tipo.upper().replace("_", " ")

    try:
        # ── 1. Posiciona na aba/tabela correta em Informações Fiscais
        await clicar_informacoes_fiscais(page)
        if "destinat" in tipo.lower():
            await selecionar_tabela(page, "Destinatário")
        elif "nfc" in tipo.lower():
            await clicar_aba_nfce(page)

        # ── 2. Clica no mês e na coluna (ValueError se valor = 0)
        log.info(f"CONSULTANDO {tipo_label} — {nome_coluna}")
        await clicar_mes_e_coluna(page, indice, nome_coluna)

        # ── 3. Solicita geração do arquivo
        log.info(f"SOLICITANDO {tipo_label} — {nome_coluna}")
        nova_solicitacao  = await clicar_baixar_tabela(page)
        tempo_solicitacao = datetime.now()

        # ── 4. Vai para a aba Downloads
        await clicar_menu_downloads(page)

        # ── 5+6. Busca em todas as páginas e aguarda conclusão para baixar
        log.info(f"AGUARDANDO DOWNLOAD — {tipo_label} — {nome_coluna}")
        caminho = await aguardar_e_baixar(
            page, cnpj, tipo_key,
            tempo_solicitacao=tempo_solicitacao,
            nova_solicitacao=nova_solicitacao,
            nome_coluna=nome_coluna,
        )
        _arquivos_coletados.append(caminho)
        log.info(f"DOWNLOAD CONCLUIDO — {tipo_label} — {nome_coluna}")
        log.info(f"__EXCEL__:{caminho}")
        return True

    except ValueError as e:
        log.info(f"SEM REGISTROS — {tipo_label} — {nome_coluna}")
        log.debug(f"  [{nome_coluna}] Pulado ({tipo}): {e}")
        return False
    except Exception as e:
        log.warning(
            f"ERRO — {tipo_label} — {nome_coluna}: {e}"
        )
        return False


# ─── Processar um contribuinte ───────────────────────────────────────────────

async def processar(page, cnpj_raw: str) -> bool:
    cnpj = limpar_cnpj(cnpj_raw)
    if len(cnpj) not in (11, 14):
        log.warning(f"CNPJ inválido ignorado: '{cnpj_raw}'")
        return False

    log.info(f"\n{'─'*55}")
    log.info(f"Contribuinte: {cnpj_raw} → {cnpj}")

    try:
        # ── [1] Busca e seleciona o contribuinte ──────────────────────────────
        await buscar_contribuinte(page, cnpj)

        # ── [2] Clica em "Informações Fiscais" na nova página ─────────────────
        # A nova versão do SIGA abre uma página intermediária após selecionar
        # o contribuinte — é necessário clicar explicitamente em Informações Fiscais.
        log.debug("  [2] Navegando para Informações Fiscais...")
        await clicar_informacoes_fiscais(page)

        # ────────────────────────────────────────────────────────────────────
        # Emissor
        # ────────────────────────────────────────────────────────────────────
        log.debug("\n  ── Tabela: Emissor ──")

        # Print antes de qualquer coleta
        await tirar_screenshot(page, cnpj, "emissor")

        await _baixar_coluna(page, cnpj, "emissor", INDICE_AUTORIZADAS, "NF-E Emitidas Autorizadas")

        await clicar_informacoes_fiscais(page)
        await _baixar_coluna(page, cnpj, "emissor", INDICE_CANCELADAS, "NF-E Emitidas Canceladas")

        # ── Destinatário ──
        await clicar_informacoes_fiscais(page)
        await selecionar_tabela(page, "Destinatário")

        await tirar_screenshot(page, cnpj, "destinatario")

        await _baixar_coluna(page, cnpj, "destinatario", INDICE_AUTORIZADAS, "NF-E Emitidas Autorizadas")

        await clicar_informacoes_fiscais(page)
        await selecionar_tabela(page, "Destinatário")
        await _baixar_coluna(page, cnpj, "destinatario", INDICE_CANCELADAS, "NF-E Emitidas Canceladas")

        # ────────────────────────────────────────────────────────────────────
        # NFC-e Emissor (etapa complementar — falha não interrompe o resultado)
        # ────────────────────────────────────────────────────────────────────
        await processar_nfce(page, cnpj)

        log.info(f"✓ Concluído: {cnpj_raw}")
        return True

    except PlaywrightTimeout as e:
        log.error(f"✗ Timeout — {cnpj_raw}: {e}")
        return False
    except Exception as e:
        log.error(f"✗ Erro — {cnpj_raw}: {e}", exc_info=True)
        return False


# ─── Menu de gerenciamento de empresas ───────────────────────────────────────

def _menu_cadastro() -> None:
    """
    Exibido quando o banco está vazio ou quando o usuário escolhe
    'Gerenciar empresas' antes de rodar o robô.
    """
    while True:
        print()
        acao = questionary.select(
            "Gerenciar empresas:",
            choices=[
                questionary.Choice("Importar da planilha Excel (contribuintes.xlsx)", value="excel"),
                questionary.Choice("Adicionar empresa manualmente",                   value="manual"),
                questionary.Choice("Listar empresas cadastradas",                     value="listar"),
                questionary.Choice("Voltar / Continuar",                              value="voltar"),
            ],
        ).ask()

        if acao is None or acao == "voltar":
            break

        elif acao == "excel":
            print(f"\n  Importando de: {PLANILHA_CONTRIBUINTES}")
            try:
                ins, dup = importar_do_excel()
                print(f"  ✓ {ins} empresa(s) inserida(s) | {dup} já existia(m).")
            except FileNotFoundError:
                print(f"  ✗ Arquivo não encontrado: {PLANILHA_CONTRIBUINTES}")
            except Exception as e:
                print(f"  ✗ Erro: {e}")

        elif acao == "manual":
            cnpj = questionary.text("CNPJ (com ou sem máscara):").ask()
            if cnpj:
                razao = questionary.text("Razão social (opcional):").ask() or ""
                try:
                    ok = cadastrar_empresa(cnpj, razao)
                    print(f"  {'✓ Empresa cadastrada.' if ok else '⚠  CNPJ já existe no banco.'}")
                except ValueError as e:
                    print(f"  ✗ {e}")

        elif acao == "listar":
            empresas = listar_empresas()
            if not empresas:
                print("  Nenhuma empresa cadastrada.")
            else:
                print(f"\n  {'CNPJ':<18} {'Razão Social'}")
                print(f"  {'-'*18} {'-'*40}")
                for cnpj, razao in empresas:
                    print(f"  {cnpj:<18} {razao or '—'}")
                print(f"\n  Total: {len(empresas)} empresa(s)")


def _selecionar_empresas() -> list[str]:
    """
    Exibe um checkbox interativo com todas as empresas cadastradas.
    Retorna lista de CNPJs selecionados pelo usuário.
    """
    empresas = listar_empresas()
    if not empresas:
        return []

    # Monta as opções: "CNPJ  |  Razão Social"
    choices = [
        questionary.Choice(
            title=f"{cnpj:<18}  {razao or '(sem nome)'}",
            value=cnpj,
        )
        for cnpj, razao in empresas
    ]

    print()
    selecionadas = questionary.checkbox(
        "Selecione as empresas para processar  "
        "[ESPAÇO = marcar/desmarcar | ENTER = confirmar]:",
        choices=choices,
    ).ask()

    return selecionadas or []


# ─── Main assíncrono (só automação, sem input do usuário) ────────────────────

async def main(cnpjs: list[str]) -> None:
    """Recebe a lista de CNPJs já selecionados e executa a automação."""
    _arquivos_coletados.clear()   # garante lista limpa a cada execução
    _parar_execucao.clear()       # reseta flag de parada
    mes, ano = mes_anterior()

    log.info("=" * 55)
    log.info("  SIGA — Automação NF-e / NFC-e")
    log.info(f"  Período      : {MESES_PT[mes-1]}/{ano}")
    log.info(f"  Contribuintes: {len(cnpjs)}")
    log.info("=" * 55)

    ok, erro = [], []

    # Timeout máximo por empresa: usa TIMEOUT_RELATORIO_MS + margem fixa de 3 min
    # Se uma empresa travar além desse limite, é registrada como erro e o robô continua.
    TIMEOUT_POR_EMPRESA = (TIMEOUT_RELATORIO_MS / 1000) + 180   # segundos

    p, browser, page = await conectar_e_aguardar_login()
    try:
        for i, cnpj_raw in enumerate(cnpjs, 1):
            if _parar_execucao.is_set():
                log.info("  ⏹  Automação interrompida pelo usuário.")
                break

            log.info(f"\n[{i}/{len(cnpjs)}]")
            try:
                sucesso = await asyncio.wait_for(
                    processar(page, cnpj_raw),
                    timeout=TIMEOUT_POR_EMPRESA,
                )
            except asyncio.TimeoutError:
                log.error(
                    f"✗ Timeout global — {cnpj_raw}: empresa demorou mais de "
                    f"{int(TIMEOUT_POR_EMPRESA)}s sem concluir. Continuando..."
                )
                sucesso = False

            (ok if sucesso else erro).append(cnpj_raw)

            if i < len(cnpjs) and not _parar_execucao.is_set():
                # Volta à tela inicial independentemente de sucesso/erro
                try:
                    await page.goto(URL_HOME, wait_until="load")
                except Exception:
                    pass
                await asyncio.sleep(PAUSA_ENTRE_CONTRIBUINTES)
    finally:
        await p.stop()

    log.info("=" * 55)
    log.info(f"  Concluídos  : {len(ok)}")
    log.info(f"  Com erro    : {len(erro)}")
    log.info(f"  Planilhas   : {len(_arquivos_coletados)} arquivo(s) formatado(s)")
    if erro:
        log.warning("  CNPJs com erro:")
        for c in erro:
            log.warning(f"    - {c}")
    log.info("=" * 55)
    # Sinaliza conclusão para o painel web
    log.info(f"__RESUMO__:{len(ok)}:{len(erro)}:{len(_arquivos_coletados)}")


# ─── Ponto de entrada — menus síncronos ANTES do loop assíncrono ─────────────

if __name__ == "__main__":
    mes, ano = mes_anterior()

    print("\n" + "=" * 60)
    print("  SIGA — Automação NF-e / NFC-e")
    print(f"  Período : {MESES_PT[mes-1]}/{ano}")
    print("=" * 60)

    # Inicializa banco
    init_db()

    # Primeiro uso: banco vazio → oferece importação
    if total_empresas() == 0:
        print("\n  ⚠  Nenhuma empresa cadastrada ainda.")
        print("  Vamos cadastrar antes de continuar.\n")
        _menu_cadastro()
        if total_empresas() == 0:
            print("\n  Nenhuma empresa cadastrada. Encerrando.")
            raise SystemExit(0)

    # Menu inicial
    print()
    acao_inicial = questionary.select(
        "O que deseja fazer?",
        choices=[
            questionary.Choice("Selecionar empresas e rodar o robô", value="rodar"),
            questionary.Choice("Gerenciar empresas (cadastrar/importar/listar)", value="gerenciar"),
        ],
    ).ask()

    if acao_inicial is None:
        raise SystemExit(0)

    if acao_inicial == "gerenciar":
        _menu_cadastro()
        if total_empresas() == 0:
            print("\n  Nenhuma empresa cadastrada. Encerrando.")
            raise SystemExit(0)
        rodar = questionary.confirm("Deseja rodar o robô agora?").ask()
        if not rodar:
            raise SystemExit(0)

    # Seleção de empresas (síncrono, fora do loop async)
    cnpjs_selecionados = _selecionar_empresas()

    if not cnpjs_selecionados:
        print("\n  Nenhuma empresa selecionada. Encerrando.")
        raise SystemExit(0)

    print(f"\n  {len(cnpjs_selecionados)} empresa(s) selecionada(s). Iniciando robô...\n")

    # Agora sim: entra no loop assíncrono apenas com a automação
    asyncio.run(main(cnpjs_selecionados))
