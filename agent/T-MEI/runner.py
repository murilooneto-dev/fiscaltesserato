"""
runner.py — T-MEI standalone
==============================
Recebe a lista de empresas como JSON via sys.argv[1] e executa o bot DAS-SIMEI para cada uma.

Uso:
    python runner.py '[{"cnpj":"12345678000195","nome":"Empresa X","email":"dest@email.com"}]'

Campos por empresa:
    cnpj   — CNPJ da empresa (apenas dígitos ou com máscara)
    nome   — Razão social (exibida nos logs)
    email  — E-mail de destino para envio do DAS (opcional — usa EMAIL_DESTINATARIO do .env se omitido)

Saída (stdout):
    Mensagens de log de cada etapa.
    Ao finalizar cada empresa:
        __OK__:CNPJ:NOME
        __ERRO__:CNPJ:NOME
"""
import json
import sys
from pathlib import Path

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
if hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(encoding="utf-8", errors="replace")

sys.path.insert(0, str(Path(__file__).parent))


def log(msg: str) -> None:
    print(msg, flush=True)


def main() -> None:
    if len(sys.argv) < 2:
        log("[T-MEI] ERRO: Nenhuma empresa fornecida.")
        log('[T-MEI] Uso: python runner.py \'[{"cnpj":"...","nome":"...","email":"..."}]\'')
        sys.exit(1)

    try:
        empresas_raw = json.loads(sys.argv[1])
    except Exception as e:
        log(f"[T-MEI] ERRO ao ler lista de empresas: {e}")
        sys.exit(1)

    if not empresas_raw:
        log("[T-MEI] Nenhuma empresa na lista.")
        sys.exit(0)

    try:
        import config
        import bot as bot_module
    except ImportError as e:
        log(f"[T-MEI] ERRO ao importar bot: {e}")
        log("[T-MEI] Instale as dependências: pip install -r requirements.txt && playwright install firefox")
        sys.exit(1)

    pasta_downloads = Path(config.DOWNLOAD_DIR)
    pasta_downloads.mkdir(parents=True, exist_ok=True)

    # Injeta destinatário padrão nos que não tiverem email próprio
    empresas = []
    for e in empresas_raw:
        cnpj  = (e.get("cnpj")  or "").strip()
        nome  = (e.get("nome")  or cnpj).strip()
        email = (e.get("email") or config.EMAIL_DESTINATARIO).strip()
        if not cnpj:
            log(f"[T-MEI] AVISO: empresa sem CNPJ — ignorada.")
            continue
        empresas.append({"cnpj": cnpj, "nome": nome, "email": email})

    if not empresas:
        log("[T-MEI] Nenhuma empresa válida para processar.")
        sys.exit(1)

    log(f"[T-MEI] Iniciando para {len(empresas)} empresa(s)...")
    log(f"[T-MEI] Pasta de downloads: {pasta_downloads.resolve()}")

    sucesso = 0
    erros   = 0

    def _log_callback(msg: str) -> None:
        log(msg)

    for i, emp in enumerate(empresas, 1):
        nome = emp["nome"]
        cnpj = emp["cnpj"]
        log(f"\n[T-MEI] [{i}/{len(empresas)}] {nome} — {cnpj}")
        try:
            bot_module.executar(
                empresas=[emp],
                pasta_downloads=pasta_downloads,
                log_callback=_log_callback,
            )
            sucesso += 1
            log(f"__OK__:{cnpj}:{nome}")
        except Exception as e:
            erros += 1
            log(f"__ERRO__:{cnpj}:{nome}")
            log(f"[T-MEI] Detalhe: {e}")

    log(f"\n[T-MEI] Resultado: {sucesso} OK | {erros} erro(s)")


if __name__ == "__main__":
    main()
