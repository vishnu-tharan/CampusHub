@echo off
setlocal
title CampusHub - Tests and Linting
cd /d "%~dp0\.."

echo ===================================================
echo               CampusHub - Tests and Linting
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

echo [1/2] Running automated unit tests...
call npm test
if %errorlevel% neq 0 (
    echo.
    echo [ERROR] Unit tests failed!
    pause
    exit /b 1
)

echo.
echo [2/2] Running ESLint code quality checks...
call npm run lint
if %errorlevel% neq 0 (
    echo.
    echo [ERROR] Linting checks failed!
    pause
    exit /b 1
)

echo.
echo ===================================================
echo All tests and linting checks passed successfully!
echo ===================================================
echo.
pause
