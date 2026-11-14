@echo off
title Fly Media Technology - Server Host & Cloudflare Tunnel
echo ============================================================
echo   FLY MEDIA TECHNOLOGY - SERVER HOST & CLOUDFLARE TUNNEL
echo ============================================================
echo.
echo [1/2] Starting Unified Server (Port 5000: Web + API + Database)...
start "Fly Media Backend Host" cmd /k "npx tsx server/server.ts"

timeout /t 3 /nobreak >nul

echo.
echo [2/2] Connecting to Cloudflare Global Edge Network...
echo Any PC, Mac, Android, or iPhone in the world can connect using the URL below!
echo.
"C:\Program Files (x86)\cloudflared\cloudflared.exe" tunnel --url http://localhost:5000
pause

