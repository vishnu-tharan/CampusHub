@echo off
setlocal
cd /d "%~dp0"

:: Forward directly to the runner inside the run directory
if exist "run\start.bat" (
    call "run\start.bat" %*
) else (
    echo [ERROR] run\start.bat not found.
    pause
)
