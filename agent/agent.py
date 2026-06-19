"""
agent.py — Agente local do Fiscal Tesserato
=============================================
Conecta ao servidor central via WebSocket, autentica com login/senha do operador,
executa bots localmente e retorna logs em tempo real.

Configuração: edite agent.env na mesma pasta.
"""
import asyncio
import json
import os
import subprocess
import sys
from pathlib import Path

# Força UTF-8 no Windows
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")

# Carrega agent.env da mesma pasta do script
_ENV_PATH = Path(__file__).parent / "agent.env"
if _ENV_PATH.exists():
    from dotenv import load_dotenv
    load_dotenv(_ENV_PATH)

LOGIN    = os.environ.get("LOGIN", "")
SENHA    = os.environ.get("SENHA", "")
SERVIDOR = os.environ.get("SERVIDOR", "localhost:3000")

# Pastas dos bots relativas à pasta do agente
_BASE = Path(__file__).parent
BOTS_DIR = {
    "iss":  str(_BASE / "T-ISS"),
    "siga": str(_BASE / "T-SIGA"),
    "mei":  str(_BASE / "T-MEI"),
}

WS_URL = f"ws://{SERVIDOR}/ws/agent"
RECONECTAR_INTERVALO = 5  # segundos entre tentativas

_proc_atual: subprocess.Popen | None = None


def log(msg: str) -> None:
    print(msg, flush=True)


async def executar_bot(ws, bot: str, empresas: list, config: dict) -> None:
    global _proc_atual

    bot_dir = BOTS_DIR.get(bot)
    if not bot_dir or not Path(bot_dir).exists():
        await ws.send(json.dumps({
            "tipo": "bot-erro",
            "mensagem": f"Pasta do {bot.upper()} não encontrada: {bot_dir}"
        }))
        return

    runner_path = Path(bot_dir) / "runner.py"
    if not runner_path.exists():
        await ws.send(json.dumps({
            "tipo": "bot-erro",
            "mensagem": f"runner.py não encontrado em {bot_dir}"
        }))
        return

    env = {
        **os.environ,
        "PYTHONIOENCODING": "utf-8",
    }
    if config.get("pastaDownloads"):
        env["BOT_ISS_DOWNLOADS"] = config["pastaDownloads"]
        env["SIGA_DOWNLOADS"]    = config["pastaDownloads"]
        env["MEI_DOWNLOADS"]     = config["pastaDownloads"]
        env["DOWNLOAD_DIR"]      = config["pastaDownloads"]
    if config.get("emailRemetente"):
        env["BOT_ISS_SMTP_USER"] = config["emailRemetente"]
        env["SMTP_USER"]         = config["emailRemetente"]
    if config.get("emailSenha"):
        env["BOT_ISS_SMTP_PASS"] = config["emailSenha"]
        env["SMTP_PASS"]         = config["emailSenha"]
    if config.get("emailDestinatario"):
        env["BOT_ISS_EMAIL_DESTINO"] = config["emailDestinatario"]

    python_cmd = os.environ.get("PYTHON_CMD", sys.executable)
    cmd = [python_cmd, str(runner_path), json.dumps(empresas)]

    log(f"[Agente] Iniciando {bot.upper()}...")

    _proc_atual = subprocess.Popen(
        cmd,
        cwd=bot_dir,
        env=env,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True,
        encoding="utf-8",
        errors="replace",
    )

    async def _ler_stream(stream, stream_nome: str):
        loop = asyncio.get_event_loop()
        while True:
            linha = await loop.run_in_executor(None, stream.readline)
            if not linha:
                break
            linha = linha.rstrip()
            if linha:
                await ws.send(json.dumps({
                    "tipo": "log", "bot": bot, "linha": linha, "stream": stream_nome
                }))

    await asyncio.gather(
        _ler_stream(_proc_atual.stdout, "stdout"),
        _ler_stream(_proc_atual.stderr, "stderr"),
    )

    code = _proc_atual.wait()
    _proc_atual = None
    await ws.send(json.dumps({"tipo": "bot-done", "bot": bot, "code": code}))
    log(f"[Agente] {bot.upper()} encerrado com código {code}.")


async def conectar() -> None:
    import websockets

    log(f"[Agente] Conectando a {WS_URL} ...")

    async with websockets.connect(WS_URL, ping_interval=None) as ws:
        await ws.send(json.dumps({"tipo": "auth", "login": LOGIN, "senha": SENHA}))
        resp = json.loads(await ws.recv())

        if resp.get("tipo") != "auth-ok":
            log(f"[Agente] Autenticação falhou: {resp.get('mensagem', 'erro desconhecido')}")
            return

        log(f"[Agente] Autenticado como {resp['nome']} (id={resp['operadorId']}). Aguardando comandos...")

        async for raw in ws:
            msg = json.loads(raw)

            if msg.get("tipo") == "ping":
                await ws.send(json.dumps({"tipo": "pong"}))

            elif msg.get("tipo") == "rodar-bot":
                if _proc_atual is not None:
                    await ws.send(json.dumps({
                        "tipo": "bot-erro",
                        "mensagem": "Outro bot já está rodando neste PC."
                    }))
                    continue
                asyncio.create_task(
                    executar_bot(ws, msg["bot"], msg.get("empresas", []), msg.get("config", {}))
                )

            elif msg.get("tipo") == "cancelar-bot":
                if _proc_atual:
                    _proc_atual.terminate()
                    log("[Agente] Bot cancelado pelo servidor.")


async def main() -> None:
    if not LOGIN or not SENHA:
        log("[Agente] ERRO: LOGIN e SENHA não configurados em agent.env")
        sys.exit(1)

    while True:
        try:
            await conectar()
        except Exception as e:
            log(f"[Agente] Conexão perdida: {e}")
        log(f"[Agente] Reconectando em {RECONECTAR_INTERVALO}s...")
        await asyncio.sleep(RECONECTAR_INTERVALO)


if __name__ == "__main__":
    asyncio.run(main())
