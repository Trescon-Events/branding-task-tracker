@echo off
title TaskSphere Dashboard Server
echo ===================================================
echo   Starting TaskSphere Timesheet & Task Dashboard
echo ===================================================
echo.

:: Check if Node.js is installed
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed or not added to PATH.
    echo Please install Node.js from https://nodejs.org/ first.
    pause
    exit /b
)

:: Install dependencies if node_modules doesn't exist
if not exist "node_modules\" (
    echo [INFO] Installing required dependencies (express)...
    call npm install
    if %errorlevel% neq 0 (
        echo [ERROR] Dependency installation failed.
        pause
        exit /b
      )
)

:: Start the application
echo [INFO] JSON Database configuration checked.
echo [INFO] Starting Express Node.js Server...
echo.
echo ===================================================
echo   Access the dashboard locally:
echo   - Local: http://localhost:3000
echo.
echo   Access from other devices in the same network:
echo   - Run 'ipconfig' in command prompt to find your IPv4
echo   - Connect using: http://[your-ip-address]:3000
echo ===================================================
echo.
node server.js
pause
