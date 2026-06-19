"""
Bot ISS — Automação do ISS Eletrônico SpeedGov por fila de empresas.

Fluxo (competência = mês anterior):
  1. Verificar NFS-e emitidas (Prestador > Notas Fiscais)
  2. Escrituração Prestador:
       Com notas → Fechar Notas de Serviço → mês anterior → Continuar
       Sem notas → Declarar Sem Movimento → mês anterior → Fechamento da Declaração → confirmar
  3. Downloads: declaração PDF, boleto ISS, relatório situacional
  4. Área do Tomador: Nova Declaração → Declarar Sem Movimento → mês anterior
       → Fechamento da Declaração → confirmar → Imprimir Declaração → salvar PDF
  5. E-mail final com todos os arquivos gerados

Uso:
    python bot_iss.py

Pré-requisitos:
    pip install -r requirements.txt
    playwright install chromium
    Copie .env.example para .env e configure as variáveis.
"""
from __future__ import annotations

import asyncio
import io
import json
import logging
import os
import sys
import urllib.request
import warnings
from datetime import date

# Força UTF-8 no terminal Windows
if hasattr(sys.stdout, "buffer"):
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")
if hasattr(sys.stderr, "buffer"):
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding="utf-8", errors="replace")

# Suprime aviso inofensivo do asyncio no Windows ao encerrar pipes
warnings.filterwarnings("ignore", message="unclosed transport", category=ResourceWarning)

def _suppress_pipe_errors(unraisable):
    if unraisable.exc_type is ValueError and "I/O operation on closed pipe" in str(unraisable.exc_value):
        return
    sys.__unraisablehook__(unraisable)

sys.unraisablehook = _suppress_pipe_errors

from config import DOWNLOAD_DIR, FISCAL_SYSTEM_URL, HEADLESS
from db import ensure_tables, get_all_empresas, log_result, update_empresa_total
from email_sender import send_files
from iss_session import ISSSession

_fmt = logging.Formatter("%(asctime)s %(message)s", datefmt="%H:%M:%S")

# Arquivo: captura TUDO (DEBUG) para diagnóstico
_fh = logging.FileHandler("bot_iss.log", encoding="utf-8", mode="a")
_fh.setLevel(logging.DEBUG)
_fh.setFormatter(_fmt)

# Terminal/UI: apenas INFO (mensagens de etapa limpas)
_sh = logging.StreamHandler()
_sh.setLevel(logging.INFO)
_sh.setFormatter(_fmt)

logger = logging.getLogger("bot_iss")
logger.setLevel(logging.DEBUG)
logger.propagate = False
logger.addHandler(_fh)
logger.addHandler(_sh)


def atualizar_tarefa_fiscal(cnpj: str, mes: int, ano: int, tarefa: str, valor: str) -> None:
    """Notifica o Sistema Fiscal para marcar uma tarefa como concluída (ou com erro).

    Opcional — só executa se FISCAL_SYSTEM_URL estiver configurado no .env.
    """
    if not FISCAL_SYSTEM_URL:
        return
    hoje = date.today()
    periodo = f"{hoje.month:02d}/{hoje.year}"
    payload = json.dumps({"cnpj": cnpj, "periodo": periodo, "tarefa": tarefa, "valor": valor}).encode()
    url = f"{FISCAL_SYSTEM_URL}/api/bot-iss/update-tarefa"
    try:
        req = urllib.request.Request(
            url, data=payload,
            headers={"Content-Type": "application/json"},
            method="POST",
        )
        with urllib.request.urlopen(req, timeout=5) as resp:
            body = json.loads(resp.read())
            if body.get("ok"):
                logger.debug("Sistema Fiscal — tarefa '%s' de %s atualizada para '%s'", tarefa, cnpj, valor)
    except Exception as exc:
        logger.debug("Sistema Fiscal — não foi possível atualizar tarefa: %s", exc)


async def process_empresa(empresa: dict) -> None:
    empresa_id = empresa.get("id")
    login_str = empresa["login"]
    cnpj = empresa.get("cnpj") or login_str
    senha = empresa["senha"]
    municipio = empresa["municipio"]
    _email_empresa = (empresa["email_destino"] or "").strip()
    _email_padrao  = os.environ.get("BOT_ISS_EMAIL_DESTINO", "").strip()
    # Envia para ambos se forem diferentes; senão, só para o disponível
    _emails_vistos: set[str] = set()
    email_destino: list[str] = []
    for _e in [_email_empresa, _email_padrao]:
        if _e and _e not in _emails_vistos:
            _emails_vistos.add(_e)
            email_destino.append(_e)
    razao_social = empresa.get("razao_social") or login_str

    company_dir = os.path.join(DOWNLOAD_DIR, f"{municipio}_{login_str}")
    os.makedirs(company_dir, exist_ok=True)

    session = ISSSession(municipio=municipio, download_dir=company_dir, headless=HEADLESS)
    files_downloaded: list[str] = []
    total_notas = 0.0
    mes = session.mes_atual
    ano = session.ano_atual

    try:
        logger.info("LOGIN — %s", razao_social)
        await session.start()
        await session.login(login_str, senha)

        mes = session.mes_atual
        ano = session.ano_atual
        logger.debug("[%s] Competencia: %02d/%d | municipio: %s", login_str, mes, ano, municipio)

        # ── 1. Verificar NFS-e emitidas ────────────────────────────────
        logger.info("VERIFICANDO NFS-e — %s", razao_social)
        notas = await session.get_notas_mes_atual()
        total_notas = session.sum_notas(notas)
        tem_movimento = total_notas > 0
        logger.debug("[%s] %d nota(s) | R$ %.2f | %s", login_str, len(notas), total_notas,
                     "COM MOVIMENTO" if tem_movimento else "SEM MOVIMENTO")

        if empresa_id is not None:
            update_empresa_total(empresa_id, total_notas)

        # ── 2. Escrituração Prestador ──────────────────────────────────
        logger.info("ESCRITURACAO PRESTADOR — %s — %s", razao_social,
                    "COM MOVIMENTO" if tem_movimento else "SEM MOVIMENTO")
        escrit = await session.check_escrituracao_mes_atual()

        if escrit is None:
            logger.debug("[%s] Sem escrituracao — criando nova declaracao...", login_str)
            escrit = await session.nova_declaracao_prestador(tem_movimento=tem_movimento)
            if escrit is None:
                raise RuntimeError(
                    "Escrituracao nao encontrada na lista apos criacao. "
                    "Verifique manualmente o sistema."
                )
            logger.debug("[%s] Escrituracao criada: %s", login_str, escrit)
        else:
            logger.debug("[%s] Escrituracao existente — situacao: %s", login_str, escrit["situacao"].upper())

        # ── 3. Downloads ───────────────────────────────────────────────
        logger.info("BAIXANDO DECLARACAO — %s", razao_social)
        if escrit.get("notanumdec"):
            decl_path = await session.download_declaracao(
                mes=escrit["mes"],
                ano=escrit["ano"],
                notanumdec=escrit["notanumdec"],
                full_url=escrit.get("declaracao_url"),
            )
            if decl_path:
                files_downloaded.append(decl_path)
            else:
                logger.debug("[%s] Declaracao nao pode ser baixada", login_str)
        else:
            logger.debug("[%s] notanumdec indisponivel — declaracao ignorada", login_str)

        logger.info("BAIXANDO BOLETO — %s", razao_social)
        await session._ir_prestador("Escriturações")
        boleto_paths = await session.download_boletos_escrituracao(mes=escrit["mes"], ano=escrit["ano"])
        if not boleto_paths:
            logger.debug("[%s] Tentando boletos via menu Prestador > Boletos", login_str)
            boleto_paths = await session.download_boletos_iss(mes=escrit["mes"], ano=escrit["ano"])
        if boleto_paths:
            logger.debug("[%s] %d boleto(s) baixado(s)", login_str, len(boleto_paths))
        else:
            logger.debug("[%s] Boleto ISS nao encontrado para %02d/%d", login_str, escrit["mes"], escrit["ano"])
        files_downloaded.extend(boleto_paths)

        logger.info("BAIXANDO RELATORIO SITUACIONAL — %s", razao_social)
        sit_path = await session.download_situacional()
        if sit_path:
            files_downloaded.append(sit_path)
        else:
            logger.debug("[%s] Relatorio Situacional nao pode ser baixado", login_str)

        # ── 4. Área do Tomador ─────────────────────────────────────────
        logger.info("AREA DO TOMADOR — %s", razao_social)
        try:
            tomador_files = await session.fechar_escrituracoes_tomador()
            files_downloaded.extend(tomador_files)
            logger.debug("[%s] Tomador concluido (%d arquivo(s))", login_str, len(tomador_files))
        except Exception as tomador_exc:
            logger.debug("[%s] Tomador — ERRO: %s", login_str, tomador_exc, exc_info=True)
            shot_path = await session.screenshot_erro("tomador_erro_final")
            extra_files = [shot_path] if shot_path else []
            subject_err = f"[ERRO] ISS {municipio.upper()} — {razao_social} — Tomador {mes:02d}/{ano}"
            body_err = (
                f"RESUMO — CNPJ: {cnpj}\n"
                f"Municipio: {municipio.upper()} | Competencia: {mes:02d}/{ano}\n"
                f"NFS-e emitidas: R$ {total_notas:.2f}\n"
                f"Escrituracao: {escrit.get('situacao', '-') if escrit else '-'}\n"
                f"Status: ERRO (Tomador)\n\nDetalhe: {tomador_exc}"
            )
            send_files(email_destino, subject_err, body_err, extra_files)

        # ── 5. E-mail final ────────────────────────────────────────────
        logger.info("ENVIANDO EMAIL — %s", razao_social)
        if files_downloaded:
            subject = f"ISS {municipio.upper()} — {razao_social} — {mes:02d}/{ano}"
            arquivos_lista = "\n".join(f"  - {os.path.basename(p)}" for p in files_downloaded)
            body = (
                f"RESUMO — CNPJ: {cnpj}\n"
                f"Municipio: {municipio.upper()} | Competencia: {mes:02d}/{ano}\n"
                f"NFS-e emitidas: R$ {total_notas:.2f}"
                + (" (SEM MOVIMENTO)" if not tem_movimento else "")
                + f"\nEscrituracao: {escrit.get('situacao', 'FECHADA') if escrit else 'FECHADA'}\n"
                f"Arquivos:\n{arquivos_lista}\nStatus: OK"
            )
            send_files(email_destino, subject, body, files_downloaded)
            logger.debug("[%s] Email enviado para %s (%d arquivo(s))", login_str, ", ".join(email_destino), len(files_downloaded))
        else:
            logger.debug("[%s] Nenhum arquivo disponivel para envio", login_str)

        log_result(
            empresa_id=empresa_id,
            municipio=municipio,
            login=login_str,
            status="ok",
            total_notas=total_notas,
            arquivos=[os.path.basename(p) for p in files_downloaded],
        )
        atualizar_tarefa_fiscal(cnpj, mes, ano, "ISS", date.today().isoformat())
        logger.info("CONCLUIDO — %s", razao_social)

    except Exception as exc:
        logger.debug("[%s] ERRO: %s", login_str, exc, exc_info=True)
        shot_path = await session.screenshot_erro("erro_geral")
        extra_files = [shot_path] if shot_path else []
        try:
            subject_err = f"[ERRO] ISS {municipio.upper()} — {razao_social} — {mes:02d}/{ano}"
            arquivos_parciais = "\n".join(f"  - {os.path.basename(p)}" for p in files_downloaded) or "  (nenhum)"
            body_err = (
                f"RESUMO — CNPJ: {cnpj}\n"
                f"Municipio: {municipio.upper()} | Competencia: {mes:02d}/{ano}\n"
                f"NFS-e emitidas: R$ {total_notas:.2f}\n"
                f"Arquivos:\n{arquivos_parciais}\nStatus: ERRO\n\nDetalhe: {exc}"
            )
            send_files(email_destino, subject_err, body_err, files_downloaded + extra_files)
        except Exception as mail_exc:
            logger.debug("[%s] Falha ao enviar email de erro: %s", login_str, mail_exc)
        log_result(
            empresa_id=empresa_id,
            municipio=municipio,
            login=login_str,
            status="erro",
            total_notas=total_notas,
            arquivos=[os.path.basename(p) for p in files_downloaded],
            erro=str(exc),
        )
        atualizar_tarefa_fiscal(cnpj, mes, ano, "ISS", "ERRO")
        logger.info("ERRO — %s — %s", razao_social, exc)
    finally:
        await session.logout()
        await session.close()


async def main() -> None:
    logger.info("=== Bot ISS iniciado ===")
    ensure_tables()

    # Aguarda 3s para garantir que o sistema fiscal terminou de gravar no banco
    await asyncio.sleep(3)

    empresas = get_all_empresas()

    cnpjs_env = os.environ.get("BOT_ISS_CNPJS", "").strip()
    if cnpjs_env:
        allowed = {c.strip() for c in cnpjs_env.split(",") if c.strip()}
        empresas = [e for e in empresas if e.get("cnpj") in allowed]
        logger.info("Filtrando por CNPJs selecionados: %s", sorted(allowed))

    if not empresas:
        logger.warning("Nenhuma empresa na fila para processar.")
        return

    logger.info("Fila: %d empresa(s)", len(empresas))

    for empresa in empresas:
        logger.info(
            "--- Iniciando: %s (%s @ %s) ---",
            empresa.get("razao_social") or empresa["login"],
            empresa["login"],
            empresa["municipio"],
        )
        await process_empresa(empresa)

    logger.info("=== Bot ISS concluído ===")


if __name__ == "__main__":
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    try:
        loop.run_until_complete(main())
    finally:
        loop.run_until_complete(asyncio.sleep(0.25))
        loop.run_until_complete(loop.shutdown_asyncgens())
        loop.close()
