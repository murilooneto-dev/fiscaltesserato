"""
banco.py — Gerenciamento do banco de dados de empresas (SQLite)
================================================================
Funções disponíveis:
  init_db()                      → cria o banco e a tabela se não existirem
  importar_do_excel(planilha)    → importa CNPJs de uma planilha Excel
  cadastrar_empresa(cnpj, razao) → adiciona uma empresa manualmente
  listar_empresas()              → retorna [(cnpj, razao_social), ...]
  total_empresas()               → número de empresas cadastradas
  empresa_existe(cnpj)           → True/False
"""

import re
import sqlite3
from pathlib import Path

import pandas as pd

from config import DB_PATH, PLANILHA_CONTRIBUINTES, COLUNA_CNPJ


# ─── Helpers ─────────────────────────────────────────────────────────────────

def _limpar_cnpj(cnpj: str) -> str:
    return re.sub(r"\D", "", str(cnpj).strip())


def _conectar() -> sqlite3.Connection:
    Path(DB_PATH).parent.mkdir(parents=True, exist_ok=True)
    return sqlite3.connect(DB_PATH)


# ─── Inicialização ────────────────────────────────────────────────────────────

def init_db() -> None:
    """Cria o banco e a tabela 'empresas' se ainda não existirem."""
    with _conectar() as con:
        con.execute("""
            CREATE TABLE IF NOT EXISTS empresas (
                id            INTEGER PRIMARY KEY AUTOINCREMENT,
                cnpj          TEXT    UNIQUE NOT NULL,
                razao_social  TEXT    DEFAULT '',
                ativo         INTEGER DEFAULT 1,
                data_cadastro TEXT    DEFAULT (datetime('now','localtime'))
            )
        """)
        con.commit()


# ─── CRUD ─────────────────────────────────────────────────────────────────────

def cadastrar_empresa(cnpj_raw: str, razao_social: str = "") -> bool:
    """
    Cadastra uma empresa. Retorna True se inserida/reativada, False se já estava ativa.
    """
    cnpj = _limpar_cnpj(cnpj_raw)
    if len(cnpj) not in (11, 14):
        raise ValueError(f"CNPJ/CPF inválido: '{cnpj_raw}'")

    with _conectar() as con:
        row = con.execute(
            "SELECT ativo FROM empresas WHERE cnpj = ?", (cnpj,)
        ).fetchone()

        if row is None:
            # Nova empresa — insere
            con.execute(
                "INSERT INTO empresas (cnpj, razao_social) VALUES (?, ?)",
                (cnpj, razao_social.strip()),
            )
            con.commit()
            return True

        if row[0] == 0:
            # Existia mas estava desativada — reativa e atualiza razão social
            nova_razao = razao_social.strip()
            if not nova_razao:
                # Mantém a razão social que já estava salva
                r = con.execute(
                    "SELECT razao_social FROM empresas WHERE cnpj=?", (cnpj,)
                ).fetchone()
                nova_razao = r[0] if r else ""
            con.execute(
                "UPDATE empresas SET ativo = 1, razao_social = ? WHERE cnpj = ?",
                (nova_razao, cnpj),
            )
            con.commit()
            return True

        return False  # já existe e está ativa


def empresa_existe(cnpj_raw: str) -> bool:
    cnpj = _limpar_cnpj(cnpj_raw)
    with _conectar() as con:
        row = con.execute(
            "SELECT 1 FROM empresas WHERE cnpj = ?", (cnpj,)
        ).fetchone()
    return row is not None


def listar_empresas() -> list[tuple[str, str]]:
    """Retorna [(cnpj, razao_social), ...] ordenado por razão social."""
    with _conectar() as con:
        rows = con.execute(
            "SELECT cnpj, razao_social FROM empresas WHERE ativo = 1 ORDER BY razao_social, cnpj"
        ).fetchall()
    return rows


def desativar_empresa(cnpj_raw: str) -> None:
    """Desativa (remove logicamente) uma empresa pelo CNPJ."""
    cnpj = _limpar_cnpj(cnpj_raw)
    with _conectar() as con:
        con.execute("UPDATE empresas SET ativo = 0 WHERE cnpj = ?", (cnpj,))
        con.commit()


def total_empresas() -> int:
    with _conectar() as con:
        return con.execute("SELECT COUNT(*) FROM empresas WHERE ativo = 1").fetchone()[0]


def razao_social_por_cnpj(cnpj_raw: str) -> str:
    """Retorna a razão social cadastrada para o CNPJ, ou '' se não encontrada."""
    cnpj = _limpar_cnpj(cnpj_raw)
    with _conectar() as con:
        row = con.execute(
            "SELECT razao_social FROM empresas WHERE cnpj = ?", (cnpj,)
        ).fetchone()
    if row and row[0]:
        return row[0].strip()
    return ""


# ─── Importação do Excel ──────────────────────────────────────────────────────

def importar_do_excel(
    planilha: str | None = None,
    col_cnpj: str | None = None,
) -> tuple[int, int]:
    """
    Lê a planilha Excel e importa os CNPJs para o banco.
    Usa PLANILHA_CONTRIBUINTES e COLUNA_CNPJ do config.py por padrão.

    Retorna (inseridas, duplicadas).
    """
    planilha  = planilha  or PLANILHA_CONTRIBUINTES
    col_cnpj  = col_cnpj  or COLUNA_CNPJ

    df = pd.read_excel(planilha, dtype=str)

    if col_cnpj not in df.columns:
        raise ValueError(
            f"Coluna '{col_cnpj}' não encontrada na planilha.\n"
            f"Disponíveis: {list(df.columns)}"
        )

    # Tenta detectar coluna de razão social automaticamente
    col_razao = None
    for candidato in ("RAZAO_SOCIAL", "RAZÃO SOCIAL", "RAZAO SOCIAL",
                      "NOME", "EMPRESA", "CONTRIBUINTE"):
        if candidato.upper() in [c.upper() for c in df.columns]:
            col_razao = next(c for c in df.columns if c.upper() == candidato.upper())
            break

    inseridas = duplicadas = 0
    for _, row in df.iterrows():
        cnpj_raw = str(row[col_cnpj]).strip()
        if not cnpj_raw or cnpj_raw.lower() in ("nan", "none", ""):
            continue
        razao = str(row[col_razao]).strip() if col_razao else ""
        if razao.lower() in ("nan", "none"):
            razao = ""
        try:
            ok = cadastrar_empresa(cnpj_raw, razao)
            if ok:
                inseridas += 1
            else:
                duplicadas += 1
        except ValueError:
            pass  # CNPJ inválido — ignora silenciosamente

    return inseridas, duplicadas
