@echo off
echo ============================================
echo    MuTraPro System - Quick Start Script
echo ============================================
echo.

echo [1/3] Starting Docker containers...
docker-compose up -d

if %errorlevel% neq 0 (
    echo.
    echo ERROR: Failed to start Docker containers!
    echo Please check if Docker is running.
    pause
    exit /b 1
)

echo.
echo [2/3] Waiting for services to be ready...
timeout /t 10 /nobreak >nul

echo.
echo [3/3] Checking services status...
docker-compose ps

echo.
echo ============================================
echo    Services started successfully!
echo ============================================
echo.
echo Next steps:
echo 1. Open a new terminal
echo 2. Run: cd web-app
echo 3. Run: npm install (first time only)
echo 4. Run: npm start
echo.
echo API Gateway: http://localhost:3000/health
echo Web App: http://localhost:3000 (after npm start)
echo.
pause

