@echo off
cd /d "%~dp0"
title Fatura+ (API + Web)

echo Iniciando backend e frontend...
call npm run dev:all

echo.
echo O processo terminou ou foi interrompido.
pause
