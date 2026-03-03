@echo off
:: ClimateAI — AWS Deploy Script (Windows)
:: Usage: scripts\deploy.bat [--skip-setup] [--skip-frontend]

setlocal enabledelayedexpansion

set REGION=ap-south-1
set LAMBDA_NAME=climateai-backend
set SKIP_SETUP=0
set SKIP_FRONTEND=0

for %%a in (%*) do (
  if "%%a"=="--skip-setup"    set SKIP_SETUP=1
  if "%%a"=="--skip-frontend" set SKIP_FRONTEND=1
)

echo.
echo ==========================================
echo   ClimateAI -- AWS Deploy
echo   Region: %REGION%
echo ==========================================
echo.

:: 1. AWS Infrastructure
if %SKIP_SETUP%==0 (
  echo Setting up AWS infrastructure...
  cd backend
  call npm install --silent
  call npm run setup:dynamo
  call npm run setup:s3
  call npm run setup:sns
  cd ..
  echo   Done: Infrastructure ready
)

:: 2. Build and deploy Lambda
echo.
echo Building Lambda...
cd backend\lambda
call npm install --silent
call npm run build
echo   Done: Built to dist\index.js

echo.
echo Packaging Lambda...
cd dist
powershell Compress-Archive -Path index.js -DestinationPath ..\lambda.zip -Force
cd ..
echo   Done: lambda.zip created

echo.
echo Deploying Lambda to AWS...
aws lambda update-function-code ^
  --function-name %LAMBDA_NAME% ^
  --zip-file fileb://lambda.zip ^
  --region %REGION% ^
  --output text --query FunctionName
del lambda.zip 2>nul
cd ..\..
echo   Done: Lambda deployed

:: 3. Build frontend
if %SKIP_FRONTEND%==0 (
  echo.
  echo Building frontend...
  call npm run build
  echo   Done: Built to dist\

  if defined FRONTEND_BUCKET (
    echo.
    echo Syncing to S3: %FRONTEND_BUCKET%...
    aws s3 sync dist\ s3://%FRONTEND_BUCKET%/ --delete
    echo   Done: Frontend deployed to S3
  ) else (
    echo   NOTE: FRONTEND_BUCKET not set -- skipping S3 sync
    echo         Push to Git for Amplify auto-deploy.
  )
)

echo.
echo ==========================================
echo   Deploy complete!
echo ==========================================
echo.
echo Next steps:
echo   1. Set VITE_AWS_API_URL in .env to your API Gateway URL
echo   2. Set VITE_GEMINI_API_KEY in .env if using Gemini AI
echo   3. Run: npm run dev
