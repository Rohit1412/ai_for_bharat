@echo off
REM Viriva AI - Windows AWS Setup Script

setlocal enabledelayedexpansion

cls
echo ==========================================
echo Viriva AI - AWS Environment Setup
echo ==========================================

set REGION=us-east-1
set PROFILE=viriva

REM Step 1: Check AWS CLI installation
echo.
echo [1/5] Checking AWS CLI...
aws --version >nul 2>&1
if !errorlevel! neq 0 (
    echo AWS CLI not found. Please install it first.
    echo Download from: https://aws.amazon.com/cli/
    exit /b 1
)
echo ✓ AWS CLI is installed

REM Step 2: Verify AWS credentials
echo.
echo [2/5] Verifying AWS credentials...
for /f "tokens=*" %%i in ('aws sts get-caller-identity --profile %PROFILE% --query Account --output text 2^>nul') do set ACCOUNT_ID=%%i

if "%ACCOUNT_ID%"=="" (
    echo ✗ AWS credentials are not configured
    echo   Run: aws configure --profile %PROFILE%
    exit /b 1
)
echo ✓ AWS credentials are valid
echo   Account ID: %ACCOUNT_ID%

REM Step 3: Check Amplify CLI
echo.
echo [3/5] Checking Amplify CLI...
amplify version >nul 2>&1
if !errorlevel! neq 0 (
    echo ✗ Amplify CLI not found. Installing...
    call npm install -g @aws-amplify/cli
) else (
    echo ✓ Amplify CLI is installed
)

REM Step 4: Check Python and dependencies
echo.
echo [4/5] Checking Python dependencies...
python -m pip install boto3 -q
echo ✓ Python dependencies installed

REM Step 5: Create .env files
echo.
echo [5/5] Creating environment files...
if exist backend\.env (
    del backend\.env
)
copy backend\.env.example backend\.env >nul
powershell -Command "(Get-Content backend\.env) -replace 'YOUR_ACCOUNT_ID', '%ACCOUNT_ID%' | Set-Content backend\.env"
echo ✓ Environment files created

echo.
echo ==========================================
echo Setup Complete!
echo ==========================================
echo.
echo Next steps:
echo 1. Update AWS credentials if needed:
echo    aws configure --profile %PROFILE%
echo.
echo 2. Create AWS resources (DynamoDB, S3, SNS):
echo    python backend/dynamodb/create_tables.py
echo    python backend/s3/setup_s3.py
echo    python backend/sns/setup_sns.py
echo.
echo 3. Initialize and deploy with Amplify:
echo    amplify init --profile %PROFILE%
echo.
echo 4. Monitor progress at AWS Amplify Console
echo ==========================================
