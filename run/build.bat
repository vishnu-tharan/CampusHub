@echo off
setlocal
title CampusHub - Build
cd /d "%~dp0\.."

echo ===================================================
echo               CampusHub - Production Build
echo ===================================================
echo.

:: Check Node.js
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not found in your PATH.
    echo Please install Node.js v22 or v24 from https://nodejs.org/
    echo.
    pause
    exit /b 1
)

echo Building Next.js production bundle...
echo.
call npm run build

if %errorlevel% equ 0 (
    echo.
    echo ===================================================
    echo Build completed successfully!
    echo ===================================================
) else (
    echo.
    echo [ERROR] Build failed. Review the output messages above.
)

echo.
pause
