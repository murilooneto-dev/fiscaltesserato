"""
runner.py — T-SIGA standalone
==============================
Recebe a lista de empresas como JSON via sys.argv[1] e executa o bot para cada uma.

Uso:
    python runner.py '[{"cnpj":"12345678000195","nome":"Empresa X"},...]'

Saída (stdout):
    Mensagens de log de cada etapa.
    Ao finalizar cada empresa:
        __OK__:CNPJ:NOME
        __ERRO__:CNPJ:NOME
"""
import asyncio
import json
import sys
import os
from pathlib import Path

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
if hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(encoding="utf-8", errors="replace")

# Garante que a pasta do runner está no path
sys.path.insert(0, str(Path(__file__).parent))


def log(msg: str) -> None:
    print(msg, flush=True)


async def main() -> None:
    if len(sys.argv) < 2:
        log("[T-SIGA] ERRO: Nenhuma empresa fornecida.")
        log("[T-SIGA] Uso: python runner.py '[{\"cnpj\":\"...\",\"nome\":\"...\"},...]'")
        sys.exit(1)

    try:
        empresas = json.loads(sys.argv[1])
    except Exception as e:
        log(f"[T-SIGA] ERRO ao ler lista de empresas: {e}")
        sys.exit(1)

    if not empresas:
        log("[T-SIGA] Nenhuma empresa na lista.")
        sys.exit(0)

    try:
        from automacao_siga import conectar_e_aguardar_login, processar, _parar_execucao, URL_HOME
    except ImportError as e:
        log(f"[T-SIGA] ERRO ao importar automacao_siga: {e}")
        log("[T-SIGA] Instale as dependências: pip install -r requirements.txt")
        sys.exit(1)

    log(f"[T-SIGA] Iniciando para {len(empresas)} empresa(s)...")

    try:
        log("[T-SIGA] Conectando ao Chrome com perfil salvo...")
        log("[T-SIGA] Se solicitado, faça o login no navegador que abrir.")
        p, browser, page = await conectar_e_aguardar_login()
        log("[T-SIGA] Sessão ativa. Iniciando processamento...")

        sucesso = 0
        erros = 0

        for i, emp in enumerate(empresas, 1):
            if _parar_execucao.is_set():
                log("[T-SIGA] Processo interrompido.")
                break

            cnpj = str(emp.get("cnpj", "")).strip()
            nome = emp.get("nome", cnpj)
            log(f"[T-SIGA] [{i}/{len(empresas)}] {nome} — {cnpj}")

            ok = await processar(page, cnpj)
            if ok:
                sucesso += 1
                log(f"__OK__:{cnpj}:{nome}")
            else:
                erros += 1
                log(f"__ERRO__:{cnpj}:{nome}")

            if i < len(empresas) and not _parar_execucao.is_set():
                try:
                    await page.goto(URL_HOME, wait_until="load", timeout=15_000)
                except Exception:
                    pass

        log(f"[T-SIGA] Resultado: {sucesso} OK | {erros} erro(s)")

        await browser.close()
        await p.stop()

    except Exception as e:
        log(f"[T-SIGA] Erro fatal: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


loop = asyncio.new_event_loop()
asyncio.set_event_loop(loop)
try:
    loop.run_until_complete(main())
finally:
    loop.run_until_complete(asyncio.sleep(0.25))
    loop.run_until_complete(loop.shutdown_asyncgens())
    loop.close()
