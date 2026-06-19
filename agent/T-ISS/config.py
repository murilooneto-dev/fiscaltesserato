"""
config.py — Configuração do T-ISS
====================================
Todas as variáveis podem ser definidas no arquivo .env da pasta raiz.
"""
import os
from pathlib import Path

try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass  # dotenv opcional — variáveis de ambiente do sistema também funcionam

# ── Banco de dados interno do bot (log de execuções) ──────────────────────────
DB_PATH = os.environ.get("ISS_DB_PATH") or "bot_iss.db"

# ── Banco do Sistema Fiscal (fonte das empresas — opcional) ───────────────────
# Usado apenas pelo db.py ao buscar empresas via get_all_empresas().
# Não é necessário se você passar as empresas direto pelo runner.py.
FISCAL_DB_PATH = os.environ.get("FISCAL_DB_PATH") or ""

# ── Pasta de downloads ─────────────────────────────────────────────────────────
# Subpasta por empresa criada automaticamente: {DOWNLOAD_DIR}/{municipio}_{login}/
DOWNLOAD_DIR = (
    os.environ.get("BOT_ISS_DOWNLOADS")
    or os.environ.get("DOWNLOAD_DIR")
    or str(Path(__file__).parent / "downloads")
)

# ── SMTP ───────────────────────────────────────────────────────────────────────
SMTP_HOST  = os.environ.get("SMTP_HOST",  "smtp.gmail.com")
SMTP_PORT  = int(os.environ.get("SMTP_PORT", "587"))
SMTP_USER  = os.environ.get("BOT_ISS_SMTP_USER") or os.environ.get("SMTP_USER",  "")
SMTP_PASS  = os.environ.get("BOT_ISS_SMTP_PASS") or os.environ.get("SMTP_PASS",  "")
EMAIL_FROM = os.environ.get("EMAIL_FROM", SMTP_USER)

# ── Browser ────────────────────────────────────────────────────────────────────
# true  = sem janela (produção)
# false = abre janela (útil para depurar)
HEADLESS = os.environ.get("HEADLESS", "true").lower() == "true"

# ── Sistema Fiscal (callback de atualização de tarefas) ───────────────────────
# Deixe em branco se não estiver integrado ao Fiscal Tesserato.
FISCAL_SYSTEM_URL = os.environ.get("FISCAL_SYSTEM_URL", "")
