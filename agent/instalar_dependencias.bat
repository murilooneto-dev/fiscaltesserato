@echo off
title Fiscal Agente - Instalador

echo.
echo ====================================================
echo   FISCAL AGENTE - Instalacao de Dependencias
echo ====================================================
echo.
echo  Antes de continuar, certifique-se de ter instalado:
echo.
echo   1. Python 3.11 ou superior
echo      https://www.python.org/downloads/
echo      (marque "Add Python to PATH" na instalacao)
echo.
echo   2. Google Chrome instalado no PC
echo      https://www.google.com/chrome/
echo.
echo  Pressione qualquer tecla para continuar...
pause >nul

python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo.
    echo  ERRO: Python nao encontrado no PATH.
    echo  Instale pelo link acima marcando "Add Python to PATH".
    echo.
    pause
    exit /b 1
)

echo.
echo  Python encontrado:
python --version

echo.
echo  [1/3] Instalando dependencias do agente...
cd /d "%~dp0"
python -m pip install -r requirements.txt --quiet
if %errorlevel% neq 0 (
    echo  ERRO ao instalar dependencias do agente.
    pause
    exit /b 1
)

echo  [2/3] Instalando dependencias dos bots...

if exist "%~dp0T-ISS\requirements.txt" (
    echo   - T-ISS...
    python -m pip install -r "%~dp0T-ISS\requirements.txt" --quiet
)
if exist "%~dp0T-SIGA\requirements.txt" (
    echo   - T-SIGA...
    python -m pip install -r "%~dp0T-SIGA\requirements.txt" --quiet
)
if exist "%~dp0T-MEI\requirements.txt" (
    echo   - T-MEI...
    python -m pip install -r "%~dp0T-MEI\requirements.txt" --quiet
)

echo  [3/3] Instalando navegadores (pode demorar alguns minutos)...
python -m playwright install chromium
python -m playwright install firefox

echo.
echo ====================================================
echo   Instalacao concluida!
echo.
echo   Proximo passo:
echo   1. Copie agent.env.example para agent.env
echo   2. Preencha LOGIN, SENHA e SERVIDOR no agent.env
echo   3. Execute iniciar.bat
echo ====================================================
echo.
pause
