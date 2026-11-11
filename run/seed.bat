@echo off
setlocal
title CampusHub - Database Seeder
cd /d "%~dp0\.."

echo ===================================================
echo               CampusHub - Database Seeder
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

:: 2. Check .env
if not exist ".env" (
    echo [.env] Setting up initial environment file...
    call npm run env:setup
    echo [.env] Created .env file.
    echo.
)

:: 3. Check dependencies
if not exist "node_modules\" (
    echo [npm] Installing project dependencies first...
    call npm install
    if %errorlevel% neq 0 (
        echo [ERROR] npm install failed.
        pause
        exit /b 1
    )
)

echo Seeding MongoDB database with demo clubs, events, and accounts...
echo Ensure your MongoDB server is running...
echo.

call npm run db:seed

if %errorlevel% equ 0 (
    echo.
    echo ===================================================
    echo Seed completed successfully!
    echo.
    echo Demo Accounts:
    echo   Organizer: organizer@campushub.test
    echo   Student:   student@campushub.test
    echo   Password:  CampusHub-Demo-2026!
    echo ===================================================
) else (
    echo.
    echo [ERROR] Database seeding failed.
    echo Please ensure MongoDB is running at the MONGODB_URI in your .env file.
)

echo.
pause
