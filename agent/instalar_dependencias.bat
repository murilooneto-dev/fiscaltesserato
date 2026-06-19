@echo off
title Instalacao de dependencias — Fiscal Agente
cd /d "%~dp0"
echo Instalando dependencias Python...
python -m pip install -r requirements.txt
echo.
echo Concluido. Agora edite agent.env e execute iniciar.bat
pause
