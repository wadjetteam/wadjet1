@echo off
cd /d "%~dp0"

echo ===========================================
echo   WADJET GRC - Starting All Services
echo ===========================================
echo.

:: Kill any existing node processes
taskkill /f /im node.exe >nul 2>&1
timeout /t 3 /nobreak >nul

:: Start API Server in a new window
echo [1/2] Starting API Server on port 5001...
start "WADJET API" cmd /c "set PORT=5001 && pnpm --filter @workspace/api-server run dev"
timeout /t 8 /nobreak >nul

:: Start Frontend in this window
echo [2/2] Starting Frontend on port 5173...
set PORT=5173
set BASE_PATH=/
pnpm --filter @workspace/wadjet-grc run dev

:: When frontend stops, kill the API too
taskkill /f /im node.exe >nul 2>&1
echo.
echo Services stopped.
pause
