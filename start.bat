@echo off
title Internal Analyst Stock - Launcher
echo ============================================
echo   Internal Analyst Stock - Starting...
echo ============================================
echo.

:: Start Backend (Express + MongoDB)
echo [1/2] Starting Backend on port 5000...
start "Backend - Express" cmd /k "cd /d %~dp0 && npm run dev"

:: Wait a moment for backend to init
timeout /t 2 /nobreak >nul

:: Start Frontend (Vite React)
echo [2/2] Starting Frontend on port 3000...
start "Frontend - Vite" cmd /k "cd /d %~dp0\client && npm run dev"

echo.
echo ============================================
echo   Both servers are starting!
echo   Backend:  http://localhost:5000
echo   Frontend: http://localhost:3000
echo ============================================
echo.
echo Press any key to close this launcher window...
pause >nul
