@echo off
setlocal
title CampusHub - Development Server
cd /d "%~dp0\.."

echo ===================================================
echo               CampusHub - Start Server
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

:: 2. Check and initialize .env if missing
if not exist ".env" (
    echo [.env] Setting up initial environment file...
    call npm run env:setup
    echo [.env] Created .env file. Please check that MONGODB_URI points to your MongoDB database.
    echo.
)

:: 3. Check dependencies
if not exist "node_modules\" (
    echo [npm] Installing project dependencies...
    call npm install
    if %errorlevel% neq 0 (
        echo [ERROR] npm install failed.
        pause
        exit /b 1
    )
)

:: 4. Open browser and start development server
echo.
echo CampusHub will be available at: http://localhost:3001
echo Opening browser...
start "" http://localhost:3001

echo.
echo [Server] Starting Next.js development server...
echo Press Ctrl+C to stop the server.
echo ===================================================
echo.
call npm run dev

if %errorlevel% neq 0 (
    echo.
    echo [ERROR] Application stopped unexpectedly. Check the error message above.
    pause
)
