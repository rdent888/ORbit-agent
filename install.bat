@echo off
title Orbit Agent - Setup & Installer
color 0B

echo ========================================================
echo          Orbit Agent - Automatic Setup Wizard
echo ========================================================
echo.

cd /d "%~dp0"

:: 1. Check Python
echo [1/4] Checking Python installation...
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Python tidak terdeteksi di sistem PATH!
    echo Silakan install Python 3.10+ dari https://www.python.org/
    echo Pastikan centang "Add Python to PATH" saat instalasi.
    pause
    exit /b 1
)
python --version

:: 2. Check Node.js & npm
echo.
echo [2/4] Checking Node.js & npm...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js tidak terdeteksi di sistem PATH!
    echo Silakan install Node.js (LTS) dari https://nodejs.org/
    pause
    exit /b 1
)
node --version

:: 3. Setup Backend Virtual Environment & Dependencies
echo.
echo [3/4] Menyiapkan Python Virtual Environment (backend/venv)...
if not exist "backend\venv" (
    python -m venv backend\venv
)

echo Menginstall library backend (FastAPI, LiteLLM, SQLAlchemy, dll)...
call backend\venv\Scripts\python.exe -m pip install --upgrade pip >nul 2>&1
call backend\venv\Scripts\pip.exe install -r backend\requirements.txt

if not exist ".env" (
    if exist ".env.example" (
        copy .env.example .env >nul
    )
)

:: 4. Setup Frontend Dependencies
echo.
echo [4/4] Menginstall dependensi frontend (React, Tailwind, Vite)...
cd frontend
call npm install
cd ..

echo.
echo ========================================================
echo   Instalasi Orbit Agent Berhasil Selesai!
echo ========================================================
echo.
echo Untuk menjalankan aplikasi, Anda cukup menjalankan:
echo    start.bat
echo.
set /p launch="Apakah Anda ingin langsung menjalankan Orbit Agent sekarang? (Y/N): "
if /i "%launch%"=="Y" (
    call start.bat
)

exit /b 0
