@echo off
title Orbit Agent Launcher
color 0B

echo ========================================================
echo       Starting Orbit Agent (Autonomous Coding IDE)
echo ========================================================
echo.

cd /d "%~dp0"

echo [1/3] Starting Python Backend on http://localhost:8000...
start "Orbit Backend" /min cmd /c "cd backend && venv\Scripts\python.exe -m uvicorn main:app --host 127.0.0.1 --port 8000 --reload"

timeout /t 2 /nobreak >nul

echo [2/3] Starting Frontend Dev Server on http://localhost:5173...
start "Orbit Frontend" /min cmd /c "cd frontend && npm run dev"

timeout /t 3 /nobreak >nul

echo [3/3] Opening browser...
start http://localhost:5173

echo.
echo ========================================================
echo   Orbit Agent is running!
echo   Backend:  http://localhost:8000
echo   Frontend: http://localhost:5173
echo ========================================================
echo.
echo Press any key to stop all services...
pause >nul

taskkill /FI "WINDOWTITLE eq Orbit Backend*" /T /F >nul 2>&1
taskkill /FI "WINDOWTITLE eq Orbit Frontend*" /T /F >nul 2>&1
echo Done.
