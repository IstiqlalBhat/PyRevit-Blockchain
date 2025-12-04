@echo off
REM ═══════════════════════════════════════════════════════════════════
REM  ONE-CLICK DEPLOYMENT SCRIPT
REM  Deploys smart contract and configures everything automatically
REM ═══════════════════════════════════════════════════════════════════

echo.
echo ========================================
echo  EMBODIED CARBON LEDGER - DEPLOYMENT
echo ========================================
echo.

REM Check if Node.js is installed
where node >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Node.js is not installed!
    echo Please install from: https://nodejs.org/
    pause
    exit /b 1
)

REM Check if Ganache is likely running
echo Checking Ganache connection...
curl -s -X POST --data "{\"jsonrpc\":\"2.0\",\"method\":\"net_version\",\"params\":[],\"id\":1}" http://127.0.0.1:7545 >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo WARNING: Ganache does not appear to be running!
    echo Please start Ganache on port 7545 before deploying.
    echo Download from: https://trufflesuite.com/ganache/
    echo.
    echo Press any key to continue anyway, or Ctrl+C to cancel...
    pause >nul
)

REM Navigate to project directory
cd /d "%~dp0project"

REM Install dependencies if needed
if not exist "node_modules" (
    echo Installing dependencies...
    call npm install
    if %ERRORLEVEL% NEQ 0 (
        echo ERROR: Failed to install dependencies
        pause
        exit /b 1
    )
)

REM Run deployment
echo.
echo Starting deployment...
echo.
call npm run deploy

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo Deployment failed! Check the error messages above.
    pause
    exit /b 1
)

echo.
echo ========================================
echo  DEPLOYMENT SUCCESSFUL!
echo ========================================
echo.
echo You can now:
echo   1. Start the frontend: npm run dev (in project folder)
echo   2. Use Revit to submit data to blockchain
echo.
pause

