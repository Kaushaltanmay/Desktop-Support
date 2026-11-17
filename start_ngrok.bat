@echo off
title Fly Media Technology - Server Host (Ngrok Static Domain)
echo ============================================================
echo   FLY MEDIA TECHNOLOGY - NGROK PERMANENT STATIC DOMAIN
echo ============================================================
echo.
echo [1/2] Starting Unified Server (Port 5000: Web + API + Database)...
start "Fly Media Backend Host" cmd /k "npx tsx server/server.ts"

timeout /t 3 /nobreak >nul

echo.
echo [2/2] Connecting to Permanent Ngrok Static Domain...
echo URL: https://undamaged-seminar-tweak.ngrok-free.dev
echo.
"C:\Users\tech\AppData\Local\Microsoft\WinGet\Packages\Ngrok.Ngrok_Microsoft.Winget.Source_8wekyb3d8bbwe\ngrok.exe" http 5000 --url https://undamaged-seminar-tweak.ngrok-free.dev
pause
