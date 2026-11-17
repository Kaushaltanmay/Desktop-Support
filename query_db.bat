@echo off
title Fly Media SQLite Database Terminal
echo ============================================================
echo   FLY MEDIA TECHNOLOGY - REAL-TIME SQL DATABASE TERMINAL
echo   Database: server\desktop_support.db
echo ============================================================
echo.
echo Quick Tips:
echo   - List all tables:        .tables
echo   - See table structure:    .schema tablename
echo   - End all SQL queries with a semicolon (;)
echo   - Exit terminal:          .exit
echo.
sqlite3 -header -column "server\desktop_support.db"
