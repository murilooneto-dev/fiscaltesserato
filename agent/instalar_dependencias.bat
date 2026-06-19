@echo off
title Fiscal Agente — Instalador
chcp 65001 >nul
echo.
echo ============================================================
echo   FISCAL AGENTE — Instalacao de Dependencias
echo ============================================================
echo.

:: ── 1. Verifica Python ───────────────────────────────────────────────────────
echo [1/5] Verificando Python...
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo.
    echo  Python nao encontrado. Baixando instalador...
    echo  Aguarde — isso pode demorar alguns minutos.
    echo.

    :: Baixa o instalador do Python 3.12 via PowerShell
    powershell -Command "Invoke-WebRequest -Uri 'https://www.python.org/ftp/python/3.12.9/python-3.12.9-amd64.exe' -OutFile '%TEMP%\python_installer.exe'"

    if not exist "%TEMP%\python_installer.exe" (
        echo.
        echo  ERRO: Nao foi possivel baixar o Python.
        echo  Acesse https://www.python.org/downloads/ e instale manualmente.
        pause
        exit /b 1
    )

    echo  Instalando Python 3.12 (aguarde)...
    "%TEMP%\python_installer.exe" /quiet InstallAllUsers=0 PrependPath=1 Include_pip=1

    :: Atualiza PATH da sessao atual
    for /f "tokens=*" %%i in ('powershell -Command "[System.Environment]::GetEnvironmentVariable(\"PATH\",\"User\")"') do set PATH=%%i;%PATH%

    python --version >nul 2>&1
    if %errorlevel% neq 0 (
        echo.
        echo  Python instalado. FECHE este terminal, abra um novo e rode este script novamente.
        pause
        exit /b 1
    )
    echo  Python instalado com sucesso.
) else (
    python --version
)

:: ── 2. Atualiza pip ──────────────────────────────────────────────────────────
echo.
echo [2/5] Atualizando pip...
python -m pip install --upgrade pip --quiet

:: ── 3. Instala dependencias do agente ────────────────────────────────────────
echo.
echo [3/5] Instalando dependencias do agente...
cd /d "%~dp0"
python -m pip install -r requirements.txt

:: ── 4. Instala dependencias dos bots ─────────────────────────────────────────
echo.
echo [4/5] Instalando dependencias dos bots...

if exist "%~dp0T-ISS\requirements.txt" (
    echo   - T-ISS...
    python -m pip install -r "%~dp0T-ISS\requirements.txt" --quiet
) else (
    echo   - T-ISS: pasta nao encontrada, pulando.
)

if exist "%~dp0T-SIGA\requirements.txt" (
    echo   - T-SIGA...
    python -m pip install -r "%~dp0T-SIGA\requirements.txt" --quiet
) else (
    echo   - T-SIGA: pasta nao encontrada, pulando.
)

if exist "%~dp0T-MEI\requirements.txt" (
    echo   - T-MEI...
    python -m pip install -r "%~dp0T-MEI\requirements.txt" --quiet
) else (
    echo   - T-MEI: pasta nao encontrada, pulando.
)

:: ── 5. Instala navegadores do Playwright ─────────────────────────────────────
echo.
echo [5/5] Instalando navegadores (Playwright)...
echo   Isso pode demorar alguns minutos na primeira vez.
python -m playwright install chromium
python -m playwright install firefox

:: ── Finalizado ───────────────────────────────────────────────────────────────
echo.
echo ============================================================
echo   Instalacao concluida!
echo.
echo   Proximo passo:
echo   1. Copie agent.env.example para agent.env
echo   2. Preencha LOGIN, SENHA e SERVIDOR no agent.env
echo   3. Execute iniciar.bat
echo ============================================================
echo.
pause
