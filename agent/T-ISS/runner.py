"""
runner.py — T-ISS standalone
==============================
Recebe a lista de empresas como JSON via sys.argv[1] e executa o bot para cada uma.

Uso:
    python runner.py '[{"cnpj":"12345678000195","nome":"Empresa X","login":"12345678000195",
                        "senha":"senha123","municipio":"fortaleza","email":"dest@email.com"}]'

Campos por empresa:
    cnpj       — CNPJ da empresa (apenas dígitos ou com máscara)
    nome       — Razão social (exibida nos logs)
    login      — Inscrição municipal ou CNPJ usado no login do ISS
    senha      — Senha de acesso ao sistema ISS
    municipio  — Município normalizado (ex: "fortaleza", "juazeirodonorte")
    email      — E-mail de destino para envio dos arquivos (opcional)

Saída (stdout):
    Mensagens de log de cada etapa.
    Ao finalizar cada empresa:
        __OK__:CNPJ:NOME
        __ERRO__:CNPJ:NOME
"""
import asyncio
import json
import sys
import unicodedata
from pathlib import Path

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
if hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(encoding="utf-8", errors="replace")

sys.path.insert(0, str(Path(__file__).parent))


def log(msg: str) -> None:
    print(msg, flush=True)


def _norm_municipio(v: str) -> str:
    """Remove acentos e espaços do nome do município."""
    nfd = unicodedata.normalize("NFD", v)
    return nfd.encode("ascii", "ignore").decode("ascii").lower().replace(" ", "")


async def main() -> None:
    if len(sys.argv) < 2:
        log("[T-ISS] ERRO: Nenhuma empresa fornecida.")
        log('[T-ISS] Uso: python runner.py \'[{"cnpj":"...","login":"...","senha":"...","municipio":"..."}]\'')
        sys.exit(1)

    try:
        empresas_raw = json.loads(sys.argv[1])
    except Exception as e:
        log(f"[T-ISS] ERRO ao ler lista de empresas: {e}")
        sys.exit(1)

    if not empresas_raw:
        log("[T-ISS] Nenhuma empresa na lista.")
        sys.exit(0)

    try:
        from db import ensure_tables
        from bot_iss import process_empresa
    except ImportError as e:
        log(f"[T-ISS] ERRO ao importar bot_iss: {e}")
        log("[T-ISS] Instale as dependências: pip install -r requirements.txt && playwright install chromium")
        sys.exit(1)

    ensure_tables()

    empresas = []
    for e in empresas_raw:
        login     = (e.get("login")     or "").strip()
        senha     = (e.get("senha")     or "").strip()
        municipio = (e.get("municipio") or "").strip()
        if not login or not senha or not municipio:
            log(f"[T-ISS] AVISO: {e.get('nome', e.get('cnpj', '?'))} sem login/senha/municipio — ignorado.")
            continue
        empresas.append({
            "id":           None,
            "cnpj":         (e.get("cnpj")  or "").strip(),
            "razao_social": (e.get("nome")  or "").strip(),
            "login":        login,
            "senha":        senha,
            "municipio":    _norm_municipio(municipio),
            "email_destino":(e.get("email") or "").strip(),
        })

    if not empresas:
        log("[T-ISS] Nenhuma empresa válida para processar.")
        sys.exit(1)

    log(f"[T-ISS] Iniciando para {len(empresas)} empresa(s)...")

    sucesso = 0
    erros   = 0

    for i, emp in enumerate(empresas, 1):
        nome = emp.get("razao_social") or emp["login"]
        cnpj = emp.get("cnpj", "")
        log(f"[T-ISS] [{i}/{len(empresas)}] {nome} — {cnpj}")
        try:
            await process_empresa(emp)
            sucesso += 1
            log(f"__OK__:{cnpj}:{nome}")
        except Exception as e:
            erros += 1
            log(f"__ERRO__:{cnpj}:{nome}")
            log(f"[T-ISS] Detalhe: {e}")

    log(f"[T-ISS] Resultado: {sucesso} OK | {erros} erro(s)")


loop = asyncio.new_event_loop()
asyncio.set_event_loop(loop)
try:
    loop.run_until_complete(main())
finally:
    loop.run_until_complete(asyncio.sleep(0.25))
    loop.run_until_complete(loop.shutdown_asyncgens())
    loop.close()
