"""
config.py — T-MEI standalone
Lê configurações de variáveis de ambiente (passadas pelo agente ou pelo .env).
"""
import os
from pathlib import Path

from dotenv import load_dotenv

load_dotenv(Path(__file__).parent / ".env")

DOWNLOAD_DIR    = os.getenv("MEI_DOWNLOADS") or os.getenv("DOWNLOAD_DIR", "downloads")
EMAIL_REMETENTE = os.getenv("EMAIL_REMETENTE", "")
EMAIL_SENHA_APP = os.getenv("EMAIL_SENHA_APP", "") or os.getenv("SMTP_PASS", "")
EMAIL_DESTINATARIO = os.getenv("EMAIL_DESTINATARIO", "") or os.getenv("BOT_ISS_EMAIL_DESTINO", "")
