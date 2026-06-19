@echo off
title Fiscal Agente
cd /d "%~dp0"

if not exist agent.env (
    echo ERRO: arquivo agent.env nao encontrado.
    echo Copie agent.env.example para agent.env e preencha LOGIN, SENHA e SERVIDOR.
    pause
    exit /b 1
)

echo Iniciando Fiscal Agente...
python agent.py
pause
