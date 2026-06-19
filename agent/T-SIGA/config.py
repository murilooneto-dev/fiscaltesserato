"""
config.py — Configuração do T-SIGA
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

# ── Pastas ─────────────────────────────────────────────────────────────────────
_DOCS = Path(os.environ.get("USERPROFILE", Path.home())) / "Documents" / "SIGA"
_APP  = Path(os.environ.get("APPDATA", Path.home() / "AppData" / "Roaming")) / "SIGA"

# Pasta onde os arquivos baixados serão salvos
# Estrutura: {PASTA_DOWNLOADS}\{CNPJ - Razão Social}\{AAAA-MM}\arquivo.xlsx
PASTA_DOWNLOADS = os.environ.get("SIGA_DOWNLOADS") or str(_DOCS / "downloads")

# Banco de dados SQLite com as empresas cadastradas (usado pelo banco.py)
DB_PATH = os.environ.get("SIGA_DB_PATH") or str(_APP / "empresas.db")

# Planilha Excel para importação de CNPJs (opcional)
PLANILHA_CONTRIBUINTES = os.environ.get("SIGA_PLANILHA") or str(_DOCS / "contribuintes.xlsx")
COLUNA_CNPJ = os.environ.get("SIGA_COLUNA_CNPJ", "CNPJ")

# ── URL do SIGA ────────────────────────────────────────────────────────────────
URL_BASE = os.environ.get("SIGA_URL_BASE", "https://siga.sefaz.ce.gov.br")

# ── Chrome ─────────────────────────────────────────────────────────────────────
def _achar_chrome() -> str:
    candidatos = [
        Path(os.environ.get("ProgramFiles",       r"C:\Program Files"))          / "Google/Chrome/Application/chrome.exe",
        Path(os.environ.get("ProgramFiles(x86)",  r"C:\Program Files (x86)"))    / "Google/Chrome/Application/chrome.exe",
        Path(os.environ.get("LOCALAPPDATA", ""))                                  / "Google/Chrome/Application/chrome.exe",
    ]
    for c in candidatos:
        if c.exists():
            return str(c)
    return str(candidatos[0])

CHROME_EXECUTABLE   = os.environ.get("SIGA_CHROME_PATH") or _achar_chrome()
CHROME_PERFIL_SIGA  = os.environ.get("SIGA_CHROME_PROFILE") or str(_APP / "chrome_profile")
PORTA_CDP           = int(os.environ.get("SIGA_CDP_PORT", "9222"))

# ── Tempos ─────────────────────────────────────────────────────────────────────
TIMEOUT_LOGIN_MIN        = int(os.environ.get("SIGA_TIMEOUT_LOGIN_MIN", "10"))
TIMEOUT_MS               = int(os.environ.get("SIGA_TIMEOUT_MS",        "90000"))
TIMEOUT_RELATORIO_MS     = int(os.environ.get("SIGA_TIMEOUT_RELATORIO_MS", "180000"))
VELOCIDADE_MS            = int(os.environ.get("SIGA_VELOCIDADE_MS",     "400"))
PAUSA_ENTRE_CONTRIBUINTES = int(os.environ.get("SIGA_PAUSA_ENTRE",      "5"))

# ── Identidade (white-label) ───────────────────────────────────────────────────
NOME_ESCRITORIO = os.environ.get("SIGA_NOME_ESCRITORIO", "ESCRITÓRIO")
NOME_SUBTITULO  = os.environ.get("SIGA_NOME_SUBTITULO",  "Automação SIGA")
