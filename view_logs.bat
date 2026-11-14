@echo off
title Fly Media Server Logs (Live Stream)
echo ============================================================
echo   FLY MEDIA SERVER - LIVE INCOMING IP & REQUEST LOGS
echo   (Press Ctrl + C anytime to exit)
echo ============================================================
echo.
if not exist "server\server.log" (
    echo [INFO] server\server.log not found yet. It will appear when server receives requests.
    echo.
)
powershell -NoExit -Command "Get-Content 'server\server.log' -Tail 30 -Wait"
