@echo off
cd /d "%~dp0"

if not exist agent.env (
    echo ERRO: arquivo agent.env nao encontrado.
    echo Copie agent.env.example para agent.env e preencha LOGIN, SENHA e SERVIDOR.
    pause
    exit /b 1
)

pythonw --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERRO: pythonw nao encontrado.
    echo Instale o Python marcando "Add Python to PATH" e tente novamente.
    pause
    exit /b 1
)

echo Iniciando agente na bandeja do Windows...
start "" pythonw agent_tray.py
echo Agente iniciado. Verifique o icone na bandeja (canto inferior direito).
timeout /t 3 >nul
