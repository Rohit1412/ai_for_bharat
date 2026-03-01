@echo off
REM Viriva AI - Windows Deployment Script
REM Prerequisites: AWS CLI, Node.js 18+, Python 3.12+, Amplify CLI

setlocal enabledelayedexpansion

cls
echo ==========================================
echo Viriva AI - Complete Deployment
echo ==========================================
echo.

set REGION=us-east-1
set PROFILE=viriva

REM Create DynamoDB Tables
echo [1/9] Creating DynamoDB Tables...
cd backend\dynamodb
python create_tables.py
if !errorlevel! neq 0 (
    echo Error creating DynamoDB tables
    exit /b 1
)
cd ..\..
echo ✓ DynamoDB tables created

REM Create S3 Bucket
echo.
echo [2/9] Creating S3 Bucket...
cd backend\s3
python setup_s3.py
if !errorlevel! neq 0 (
    echo Error creating S3 bucket
    exit /b 1
)
cd ..\..
echo ✓ S3 bucket created

REM Create SNS Topic
echo.
echo [3/9] Creating SNS Topic...
cd backend\sns
python setup_sns.py
if !errorlevel! neq 0 (
    echo Error creating SNS topic
    exit /b 1
)
cd ..\..
echo ✓ SNS topic created

REM Install Lambda Dependencies
echo.
echo [4/9] Installing Lambda Dependencies...
cd backend\lambdas
pip install -r requirements.txt -t package\
if !errorlevel! neq 0 (
    echo Error installing Lambda dependencies
    exit /b 1
)
cd ..\..
echo ✓ Lambda dependencies installed

REM Amplify Init
echo.
echo [5/9] Initializing Amplify Backend...
echo Using profile: %PROFILE%
echo Region: %REGION%
call amplify init --profile %PROFILE%
if !errorlevel! neq 0 (
    echo Error initializing Amplify
    exit /b 1
)
echo ✓ Amplify initialized

REM Add API
echo.
echo [6/9] Adding API Gateway + Lambda...
call amplify add api --profile %PROFILE%
echo ✓ API configured

REM Add Auth
echo.
echo [7/9] Adding Cognito Authentication...
call amplify add auth --profile %PROFILE%
echo ✓ Authentication configured

REM Add Hosting
echo.
echo [8/9] Adding Amplify Hosting...
call amplify add hosting --profile %PROFILE%
echo ✓ Hosting configured

REM Push to AWS
echo.
echo [9/9] Deploying to AWS...
call amplify push --profile %PROFILE% --yes
if !errorlevel! neq 0 (
    echo Error deploying to AWS
    exit /b 1
)
echo ✓ Deployment complete

REM Build and publish frontend
echo.
echo Building and publishing frontend...
cd frontend
call npm install
call npm run build
cd ..
call amplify publish --profile %PROFILE% --yes

echo.
echo ==========================================
echo Deployment Complete!
echo ==========================================
echo.
echo Your Viriva AI app is now live!
echo Check AWS Amplify console for the live URL.
echo.
echo API Endpoints:
echo - Health: GET /health
echo - Interventions: GET /api/interventions
echo - Action Plan: POST /api/action-plan/generate
echo - Chat: POST /api/chat
echo.
echo Total Deployment Time: ~15-20 minutes
echo Estimated Monthly Cost: $5-10 (within $200 budget)
echo ==========================================
