@echo off
setlocal
title CampusHub - Change User Role
cd /d "%~dp0\.."

echo ===================================================
echo               CampusHub - Set User Role
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

set USER_EMAIL=%1
set TARGET_ROLE=%2

if "%USER_EMAIL%"=="" (
    set /p USER_EMAIL="Enter user email: "
)

if "%TARGET_ROLE%"=="" (
    echo.
    echo Select role:
    echo   1. ORGANIZER
    echo   2. STUDENT
    set /p CHOICE="Enter 1 or 2: "
    if "%CHOICE%"=="1" set TARGET_ROLE=ORGANIZER
    if "%CHOICE%"=="2" set TARGET_ROLE=STUDENT
)

if "%USER_EMAIL%"=="" (
    echo [ERROR] Email is required.
    pause
    exit /b 1
)

if not "%TARGET_ROLE%"=="ORGANIZER" (
    if not "%TARGET_ROLE%"=="STUDENT" (
        echo [ERROR] Invalid role. Must be ORGANIZER or STUDENT.
        pause
        exit /b 1
    )
)

echo.
echo Updating %USER_EMAIL% to %TARGET_ROLE%...
call npm run user:role -- "%USER_EMAIL%" "%TARGET_ROLE%"

echo.
pause
