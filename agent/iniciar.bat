@echo off
cd /d "%~dp0"

if not exist agent.env (
    echo ERRO: arquivo agent.env nao encontrado.
    echo Copie agent.env.example para agent.env e preencha LOGIN, SENHA e SERVIDOR.
    pause
    exit /b 1
)

rem Usa pythonw para rodar sem janela de console (ícone fica na bandeja)
start "" pythonw agent_tray.py
