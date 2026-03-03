#!/usr/bin/env bash
# ClimateAI — Full AWS Deploy Script
# Usage: bash scripts/deploy.sh [--skip-setup] [--skip-frontend]
#
# Prerequisites:
#   - AWS CLI configured (aws configure)
#   - Node.js 20+
#   - An S3 bucket for frontend hosting OR AWS Amplify app created

set -euo pipefail

REGION="${AWS_REGION:-ap-south-1}"
LAMBDA_NAME="climateai-backend"
FRONTEND_BUCKET="${FRONTEND_BUCKET:-}"   # set to your S3 bucket or leave empty for Amplify
SKIP_SETUP=false
SKIP_FRONTEND=false

for arg in "$@"; do
  case $arg in
    --skip-setup)    SKIP_SETUP=true ;;
    --skip-frontend) SKIP_FRONTEND=true ;;
  esac
done

echo ""
echo "╔══════════════════════════════════════════╗"
echo "║   ClimateAI — AWS Deploy                 ║"
echo "║   Region: ${REGION}                      ║"
echo "╚══════════════════════════════════════════╝"
echo ""

# ── 1. AWS Infrastructure Setup ─────────────────────────────────────────────
if [ "$SKIP_SETUP" = false ]; then
  echo "▶ Setting up AWS infrastructure..."
  cd backend
  npm install --silent
  npm run setup:dynamo
  npm run setup:s3
  npm run setup:sns
  cd ..
  echo "  ✓ Infrastructure ready"
fi

# ── 2. Build & Deploy Lambda ─────────────────────────────────────────────────
echo ""
echo "▶ Building Lambda (TypeScript → Node.js bundle)..."
cd backend/lambda
npm install --silent
npm run build
echo "  ✓ Lambda built → dist/index.js"

echo ""
echo "▶ Packaging Lambda..."
cd dist
zip -q -r ../lambda.zip index.js
cd ..
echo "  ✓ lambda.zip created"

echo ""
echo "▶ Deploying Lambda to AWS..."
aws lambda update-function-code \
  --function-name "$LAMBDA_NAME" \
  --zip-file fileb://lambda.zip \
  --region "$REGION" \
  --output text --query 'FunctionName' \
  || echo "  ⚠ Lambda deploy failed — create it first with: aws lambda create-function ..."

rm -f lambda.zip
cd ../..
echo "  ✓ Lambda deployed"

# ── 3. Build & Deploy Frontend ────────────────────────────────────────────────
if [ "$SKIP_FRONTEND" = false ]; then
  echo ""
  echo "▶ Building frontend..."
  npm run build
  echo "  ✓ Frontend built → dist/"

  if [ -n "$FRONTEND_BUCKET" ]; then
    echo ""
    echo "▶ Syncing frontend to S3 bucket: $FRONTEND_BUCKET..."
    aws s3 sync dist/ "s3://$FRONTEND_BUCKET/" \
      --delete \
      --cache-control "max-age=31536000,public" \
      --exclude "index.html"
    aws s3 cp dist/index.html "s3://$FRONTEND_BUCKET/index.html" \
      --cache-control "no-cache,no-store,must-revalidate"
    echo "  ✓ Frontend deployed to S3"
  else
    echo "  ℹ  FRONTEND_BUCKET not set — skipping S3 sync"
    echo "     If using Amplify, push to Git and Amplify will auto-deploy."
  fi
fi

echo ""
echo "╔══════════════════════════════════════════╗"
echo "║   Deploy complete!                       ║"
echo "╚══════════════════════════════════════════╝"
echo ""
echo "Next steps:"
echo "  1. Set VITE_AWS_API_URL in .env to your API Gateway URL"
echo "  2. Set VITE_GEMINI_API_KEY in .env if using Gemini AI"
echo "  3. Run 'npm run dev' to start the frontend locally"
