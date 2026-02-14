@echo off
echo ======================================
echo   Starting Internal Analyst Stock
echo ======================================
echo.

:: Start backend server
echo [1/2] Starting backend server...
start "Backend Server" cmd /k "cd /d %~dp0 && npm run dev"

:: Wait a moment for backend to initialize
timeout /t 2 /nobreak > nul

:: Start frontend dev server
echo [2/2] Starting frontend dev server...
start "Frontend Dev" cmd /k "cd /d %~dp0client && npm run dev"

echo.
echo Both servers are starting in separate windows.
echo   Backend:  http://localhost:5000
echo   Frontend: http://localhost:5173
echo.
echo Close this window anytime. The servers will keep running.
pause
