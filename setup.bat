@echo off
REM ═══════════════════════════════════════════════════════════════════
REM  COMPLETE SETUP SCRIPT
REM  Sets up environment files and optionally deploys
REM ═══════════════════════════════════════════════════════════════════

echo.
echo ========================================
echo  EMBODIED CARBON LEDGER - SETUP
echo ========================================
echo.

set PROJECT_DIR=%~dp0

REM Create scripts/.env from template
echo Creating configuration files...
echo.

REM Create scripts/.env
if not exist "%PROJECT_DIR%scripts\.env" (
    if exist "%PROJECT_DIR%scripts\env.template" (
        copy "%PROJECT_DIR%scripts\env.template" "%PROJECT_DIR%scripts\.env" >nul
        echo Created: scripts\.env
    ) else (
        echo Creating scripts\.env with defaults...
        (
            echo # Web3 Bridge Script Configuration
            echo ETHEREUM_PROVIDER_URL=http://127.0.0.1:7545
            echo CONTRACT_ADDRESS=
            echo SENDER_ADDRESS=
            echo PRIVATE_KEY=
            echo CONTRACT_ABI_PATH=contract_abi.json
            echo GAS_PRICE_GWEI=10
        ) > "%PROJECT_DIR%scripts\.env"
        echo Created: scripts\.env
    )
) else (
    echo Exists: scripts\.env (not overwritten^)
)

REM Create project/.env
if not exist "%PROJECT_DIR%project\.env" (
    if exist "%PROJECT_DIR%project\env.template" (
        copy "%PROJECT_DIR%project\env.template" "%PROJECT_DIR%project\.env" >nul
        echo Created: project\.env
    ) else (
        echo Creating project\.env with defaults...
        (
            echo # Frontend Environment Configuration
            echo VITE_CONTRACT_ADDRESS=
            echo VITE_NETWORK_ID=5777
            echo VITE_ETHEREUM_PROVIDER_URL=http://127.0.0.1:7545
        ) > "%PROJECT_DIR%project\.env"
        echo Created: project\.env
    )
) else (
    echo Exists: project\.env (not overwritten^)
)

REM Create output directory
if not exist "%PROJECT_DIR%output" (
    mkdir "%PROJECT_DIR%output"
    echo Created: output directory
)

echo.
echo ========================================
echo  CONFIGURATION REQUIRED
echo ========================================
echo.
echo Before deploying, you need to configure your Ganache account:
echo.
echo 1. Open Ganache and copy:
echo    - An account address (click the key icon to see private key)
echo    - The private key for that account
echo.
echo 2. Edit: scripts\.env
echo    Set SENDER_ADDRESS and PRIVATE_KEY
echo.
echo 3. (Optional) For frontend deployment script:
echo    Edit: project\.env
echo    Set DEPLOYER_PRIVATE_KEY
echo.
echo ========================================
echo.

set /p CONTINUE="Do you want to open the .env file now? (Y/N): "
if /i "%CONTINUE%"=="Y" (
    notepad "%PROJECT_DIR%scripts\.env"
)

echo.
set /p DEPLOY="Do you want to run deployment now? (Y/N): "
if /i "%DEPLOY%"=="Y" (
    call "%PROJECT_DIR%deploy.bat"
) else (
    echo.
    echo When ready, run: deploy.bat
    echo.
)

pause

