"""
agent_tray.py — Fiscal Agente com ícone na bandeja do Windows
==============================================================
Roda o agente em background e exibe um ícone na bandeja (system tray).
Verde = conectado ao servidor. Vermelho = desconectado.

Uso: pythonw agent_tray.py   (sem janela de console)
     python   agent_tray.py   (com console, útil para depuração)
"""
import asyncio
import json
import os
import subprocess
import sys
import threading
import time
from collections import deque
from pathlib import Path

# Força UTF-8
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")

# Carrega agent.env
_ENV_PATH = Path(__file__).parent / "agent.env"
if _ENV_PATH.exists():
    from dotenv import load_dotenv
    load_dotenv(_ENV_PATH)

LOGIN    = os.environ.get("LOGIN", "")
SENHA    = os.environ.get("SENHA", "")
SERVIDOR = os.environ.get("SERVIDOR", "localhost:3000")

_BASE = Path(__file__).parent
BOTS_DIR = {
    "iss":  str(_BASE / "T-ISS"),
    "siga": str(_BASE / "T-SIGA"),
    "mei":  str(_BASE / "T-MEI"),
}

WS_URL = f"ws://{SERVIDOR}/ws/agent"
RECONECTAR_INTERVALO = 5

# ── Estado global ────────────────────────────────────────────────────────────
_status = "desconectado"      # "conectado" | "desconectado" | "autenticando"
_status_msg = ""              # texto extra (nome do operador, erro, etc.)
_logs: deque = deque(maxlen=200)
_proc_atual: subprocess.Popen | None = None
_loop: asyncio.AbstractEventLoop | None = None
_tray_icon = None             # referência ao pystray.Icon


def _add_log(msg: str) -> None:
    ts = time.strftime("%H:%M:%S")
    _logs.append(f"[{ts}] {msg}")


def _set_status(status: str, msg: str = "") -> None:
    global _status, _status_msg
    _status = status
    _status_msg = msg
    _update_tray_icon()


# ── Criação do ícone (círculo colorido via Pillow) ───────────────────────────
def _make_icon_image(color: str) -> "PIL.Image.Image":
    from PIL import Image, ImageDraw
    size = 64
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    margin = 6
    draw.ellipse([margin, margin, size - margin, size - margin], fill=color)
    return img


_ICON_COLORS = {
    "conectado":    "#4ade80",   # verde
    "autenticando": "#fbbf24",   # amarelo
    "desconectado": "#f87171",   # vermelho
}


def _update_tray_icon() -> None:
    if _tray_icon is None:
        return
    color = _ICON_COLORS.get(_status, "#f87171")
    try:
        _tray_icon.icon = _make_icon_image(color)
        label = "Fiscal Agente"
        if _status == "conectado" and _status_msg:
            label = f"Fiscal Agente — {_status_msg}"
        elif _status == "desconectado":
            label = "Fiscal Agente — Desconectado"
        elif _status == "autenticando":
            label = "Fiscal Agente — Conectando..."
        _tray_icon.title = label
    except Exception:
        pass


# ── Lógica do agente (idêntica ao agent.py, com _set_status) ────────────────
async def executar_bot(ws, bot: str, empresas: list, config: dict) -> None:
    global _proc_atual

    bot_dir = BOTS_DIR.get(bot)
    if not bot_dir or not Path(bot_dir).exists():
        msg = f"Pasta do {bot.upper()} não encontrada: {bot_dir}"
        _add_log(f"ERRO: {msg}")
        await ws.send(json.dumps({"tipo": "bot-erro", "mensagem": msg}))
        return

    runner_path = Path(bot_dir) / "runner.py"
    if not runner_path.exists():
        msg = f"runner.py não encontrado em {bot_dir}"
        _add_log(f"ERRO: {msg}")
        await ws.send(json.dumps({"tipo": "bot-erro", "mensagem": msg}))
        return

    env = {**os.environ, "PYTHONIOENCODING": "utf-8"}
    if config.get("pastaDownloads"):
        env.update({"BOT_ISS_DOWNLOADS": config["pastaDownloads"],
                    "SIGA_DOWNLOADS": config["pastaDownloads"],
                    "MEI_DOWNLOADS": config["pastaDownloads"],
                    "DOWNLOAD_DIR": config["pastaDownloads"]})
    if config.get("emailRemetente"):
        env.update({"BOT_ISS_SMTP_USER": config["emailRemetente"],
                    "SMTP_USER": config["emailRemetente"]})
    if config.get("emailSenha"):
        env.update({"BOT_ISS_SMTP_PASS": config["emailSenha"],
                    "SMTP_PASS": config["emailSenha"]})
    if config.get("emailDestinatario"):
        env["BOT_ISS_EMAIL_DESTINO"] = config["emailDestinatario"]

    python_cmd = os.environ.get("PYTHON_CMD", sys.executable)
    # garante que usamos python.exe (não pythonw.exe) para subprocessos
    python_cmd = python_cmd.replace("pythonw", "python")
    cmd = [python_cmd, str(runner_path), json.dumps(empresas)]

    _add_log(f"Iniciando {bot.upper()}...")

    _proc_atual = subprocess.Popen(
        cmd, cwd=bot_dir, env=env,
        stdout=subprocess.PIPE, stderr=subprocess.PIPE,
        text=True, encoding="utf-8", errors="replace",
    )

    async def _ler(stream, stream_nome: str):
        loop = asyncio.get_event_loop()
        while True:
            linha = await loop.run_in_executor(None, stream.readline)
            if not linha:
                break
            linha = linha.rstrip()
            if linha:
                _add_log(f"[{bot.upper()}] {linha}")
                await ws.send(json.dumps({"tipo": "log", "bot": bot,
                                          "linha": linha, "stream": stream_nome}))

    await asyncio.gather(_ler(_proc_atual.stdout, "stdout"),
                         _ler(_proc_atual.stderr, "stderr"))

    code = _proc_atual.wait()
    _proc_atual = None
    await ws.send(json.dumps({"tipo": "bot-done", "bot": bot, "code": code}))
    _add_log(f"{bot.upper()} encerrado com código {code}.")


async def conectar() -> None:
    import websockets

    _set_status("autenticando")
    _add_log(f"Conectando a {WS_URL}...")

    async with websockets.connect(WS_URL, ping_interval=None) as ws:
        await ws.send(json.dumps({"tipo": "auth", "login": LOGIN, "senha": SENHA}))
        resp = json.loads(await ws.recv())

        if resp.get("tipo") != "auth-ok":
            msg = resp.get("mensagem", "erro desconhecido")
            _add_log(f"Autenticação falhou: {msg}")
            _set_status("desconectado", msg)
            return

        nome = resp["nome"]
        _add_log(f"Autenticado como {nome}. Aguardando comandos...")
        _set_status("conectado", nome)

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
                    _add_log("Bot cancelado pelo servidor.")


async def _loop_agente() -> None:
    if not LOGIN or not SENHA:
        _add_log("ERRO: LOGIN e SENHA não configurados em agent.env")
        _set_status("desconectado", "Sem credenciais")
        return

    while True:
        try:
            await conectar()
        except Exception as e:
            _add_log(f"Conexão perdida: {e}")
        _set_status("desconectado")
        _add_log(f"Reconectando em {RECONECTAR_INTERVALO}s...")
        await asyncio.sleep(RECONECTAR_INTERVALO)


def _iniciar_loop_em_thread() -> None:
    global _loop
    _loop = asyncio.new_event_loop()
    asyncio.set_event_loop(_loop)
    _loop.run_until_complete(_asyncio_main())


async def _asyncio_main() -> None:
    await _loop_agente()


# ── Janela de logs (Tkinter) ─────────────────────────────────────────────────
def _abrir_janela_logs() -> None:
    try:
        import tkinter as tk
        from tkinter import scrolledtext

        win = tk.Tk()
        win.title("Fiscal Agente — Logs")
        win.geometry("640x420")
        win.configure(bg="#071929")

        txt = scrolledtext.ScrolledText(
            win, state="disabled", wrap="word",
            bg="#040d19", fg="#7dd8f0",
            font=("Consolas", 10), relief="flat",
        )
        txt.pack(fill="both", expand=True, padx=8, pady=8)

        lbl_status = tk.Label(
            win, text="", bg="#071929", fg="#94a3b8", font=("Consolas", 9)
        )
        lbl_status.pack(pady=(0, 6))

        def atualizar():
            txt.configure(state="normal")
            txt.delete("1.0", "end")
            txt.insert("end", "\n".join(_logs))
            txt.see("end")
            txt.configure(state="disabled")
            cor = {"conectado": "#4ade80", "autenticando": "#fbbf24"}.get(_status, "#f87171")
            lbl_status.configure(
                text=f"● {_status.capitalize()}{' — ' + _status_msg if _status_msg else ''}",
                fg=cor,
            )
            win.after(1500, atualizar)

        atualizar()
        win.mainloop()
    except Exception as e:
        _add_log(f"Erro ao abrir janela de logs: {e}")


# ── Menu da bandeja ───────────────────────────────────────────────────────────
def _menu_status(icon, item) -> None:
    _abrir_janela_logs()


def _menu_sair(icon, item) -> None:
    _add_log("Encerrando agente...")
    if _proc_atual:
        try:
            _proc_atual.terminate()
        except Exception:
            pass
    if _loop:
        _loop.call_soon_threadsafe(_loop.stop)
    icon.stop()


def _build_menu():
    import pystray
    return pystray.Menu(
        pystray.MenuItem("Ver logs", _menu_status, default=True),
        pystray.Menu.SEPARATOR,
        pystray.MenuItem("Sair", _menu_sair),
    )


# ── Entrada principal ─────────────────────────────────────────────────────────
def main() -> None:
    global _tray_icon

    try:
        import pystray
    except ImportError:
        print("pystray não instalado. Execute: pip install pystray Pillow")
        sys.exit(1)

    # Inicia o loop asyncio em thread separada
    t = threading.Thread(target=_iniciar_loop_em_thread, daemon=True)
    t.start()

    # Cria o ícone da bandeja
    icone_inicial = _make_icon_image(_ICON_COLORS["desconectado"])
    _tray_icon = pystray.Icon(
        "fiscal_agente",
        icone_inicial,
        "Fiscal Agente — Iniciando...",
        _build_menu(),
    )

    # Duplo clique abre a janela de logs (no Windows, default=True já faz isso)
    _tray_icon.run()


if __name__ == "__main__":
    main()
