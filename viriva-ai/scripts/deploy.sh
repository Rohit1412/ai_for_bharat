#!/bin/bash

set -e

AWS_REGION="ap-south-1"
PROFILE="viriva"

echo "Setting up Viriva AI AWS Backend..."
echo "AWS Region: $AWS_REGION"
echo "AWS Profile: $PROFILE"

# Create DynamoDB Tables
echo -e "\n1. Creating DynamoDB Tables..."
cd backend/dynamodb
python3 create_tables.py
cd ../..

# Create S3 Bucket
echo -e "\n2. Creating S3 Bucket..."
cd backend/s3
python3 setup_s3.py
cd ../..

# Create SNS Topic
echo -e "\n3. Creating SNS Topic..."
cd backend/sns
python3 setup_sns.py
cd ../..

# Install Lambda Dependencies
echo -e "\n4. Installing Lambda Dependencies..."
cd backend/lambdas
pip install -r requirements.txt -t package/
cd ../..

# Deploy with Amplify
echo -e "\n5. Initializing Amplify..."
amplify init --profile $PROFILE

echo -e "\n6. Adding Backend API..."
amplify add api --profile $PROFILE

echo -e "\n7. Adding Authentication..."
amplify add auth --profile $PROFILE

echo -e "\n8. Adding Hosting..."
amplify add hosting --profile $PROFILE

echo -e "\n9. Pushing to AWS..."
amplify push --profile $PROFILE --yes

echo -e "\n10. Building Frontend..."
cd frontend
npm install
npm run build
cd ..

echo -e "\n11. Publishing..."
amplify publish --profile $PROFILE --yes

echo -e "\n✓ Viriva AI deployment complete!"
echo "Your live app is now available at the Amplify console URL"
