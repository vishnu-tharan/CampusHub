@echo off
setlocal
title CampusHub - Setup
cd /d "%~dp0\.."

echo ===================================================
echo               CampusHub - Initial Setup
echo ===================================================
echo.

:: 1. Check Node.js
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not found in your PATH.
    echo Please install Node.js v22 or v24 from https://nodejs.org/
    echo.
    pause
    exit /b 1
)

:: 2. Setup .env file
if not exist ".env" (
    echo [1/2] Creating .env file from template...
    call npm run env:setup
    echo Created .env file.
) else (
    echo [1/2] .env file already exists. Skipping recreation.
)
echo.

:: 3. Install dependencies
echo [2/2] Installing dependencies via npm...
call npm install

if %errorlevel% neq 0 (
    echo.
    echo [ERROR] Dependency installation failed.
    pause
    exit /b 1
)

echo.
echo ===================================================
echo Setup completed successfully!
echo.
echo Next steps:
echo   1. Ensure MongoDB is running - default: mongodb://127.0.0.1:27017/campushub
echo   2. Double-click "seed.bat" to populate initial demo data
echo   3. Double-click "start.bat" to launch CampusHub
echo ===================================================
echo.
pause
