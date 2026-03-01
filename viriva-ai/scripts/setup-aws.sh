#!/bin/bash

# Viriva AI - AWS Setup Script
# This script configures your AWS environment for the Viriva AI backend

set -e

echo "=========================================="
echo "Viriva AI - AWS Environment Setup"
echo "=========================================="

REGION="ap-south-1"
PROFILE="viriva"

# Step 1: Check AWS CLI installation
echo -e "\n[1/5] Checking AWS CLI..."
if ! command -v aws &> /dev/null; then
    echo "AWS CLI not found. Please install it first."
    exit 1
fi
echo "✓ AWS CLI is installed"

# Step 2: Verify AWS credentials
echo -e "\n[2/5] Verifying AWS credentials..."
if aws sts get-caller-identity --profile $PROFILE &> /dev/null; then
    echo "✓ AWS credentials are valid"
    ACCOUNT_ID=$(aws sts get-caller-identity --profile $PROFILE --query Account --output text)
    echo "   Account ID: $ACCOUNT_ID"
else
    echo "✗ AWS credentials are not configured"
    echo "   Run: aws configure --profile $PROFILE"
    exit 1
fi

# Step 3: Check Amplify CLI
echo -e "\n[3/5] Checking Amplify CLI..."
if ! command -v amplify &> /dev/null; then
    echo "✗ Amplify CLI not found. Installing..."
    npm install -g @aws-amplify/cli
else
    echo "✓ Amplify CLI is installed"
fi

# Step 4: Check Python and dependencies
echo -e "\n[4/5] Checking Python dependencies..."
python3 -m pip install boto3 --quiet
echo "✓ Python dependencies installed"

# Step 5: Create .env files
echo -e "\n[5/5] Creating environment files..."
cp backend/.env.example backend/.env
sed -i "s/YOUR_ACCOUNT_ID/$ACCOUNT_ID/g" backend/.env
cp frontend/.env.example frontend/.env || true
echo "✓ Environment files created"

echo -e "\n=========================================="
echo "Setup Complete!"
echo "=========================================="
echo ""
echo "Next steps:"
echo "1. Update AWS credentials if needed:"
echo "   aws configure --profile $PROFILE"
echo ""
echo "2. Run the deployment script:"
echo "   bash scripts/deploy.sh"
echo ""
echo "3. Monitor progress at:"
echo "   AWS Amplify Console"
echo "=========================================="
