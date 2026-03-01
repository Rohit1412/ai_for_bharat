# Viriva AI AWS Backend Deployment Guide

## Prerequisites

Ensure you have the following installed:
- **AWS CLI** (v2.13+) - https://aws.amazon.com/cli/
- **Node.js** (v18+) - https://nodejs.org/
- **Python** (v3.12+) - https://www.python.org/
- **Amplify CLI** - `npm install -g @aws-amplify/cli`

## Credentials Setup

You need:
- **AWS CLI** configured with your AWS credentials
- **IAM User** with permissions for: Lambda, DynamoDB, Bedrock, API Gateway, S3
- **Region**: `ap-south-1` (Mumbai)
- **Budget**: $200 free credits

⚠️ **IMPORTANT**: Never commit AWS credentials to GitHub. Use `aws configure` to store them locally.

---

## Deployment Steps (Windows PowerShell)

### Step 1: Configure AWS Credentials

Open PowerShell and run:

```powershell
aws configure --profile viriva
```

When prompted, enter your AWS credentials:
```
AWS Access Key ID: [YOUR_ACCESS_KEY_ID]
AWS Secret Access Key: [YOUR_SECRET_ACCESS_KEY]
Default region name: ap-south-1
Default output format: json
```

**Get your credentials from AWS IAM Console:**
1. Log in to https://console.aws.amazon.com/
2. Go to IAM > Users > [Your User] > Create Access Key
3. Copy the Access Key ID and Secret Access Key

### Step 2: Verify Credentials

```powershell
aws sts get-caller-identity --profile viriva
```

Expected output:
```json
{
    "UserId": "AIDAI...",
    "Account": "YOUR_ACCOUNT_ID",
    "Arn": "arn:aws:iam::YOUR_ACCOUNT_ID:user/..."
}
```

### Step 3: Create AWS Resources

Navigate to the viriva-ai directory:

```powershell
cd c:\Users\Vivek\Documents\ai_for_bharat\viriva-ai
```

#### Create DynamoDB Tables

```powershell
python backend/dynamodb/create_tables.py
```

Output should show:
```
Created viriva-alerts table
Created viriva-interventions table
Created viriva-action-plans table
All tables created successfully!
```

#### Create S3 Bucket

```powershell
python backend/s3/setup_s3.py
```

Output should show:
```
Created S3 bucket: viriva-climate-data
Enabled versioning
Set lifecycle policy
Uploaded mock climate data
```

#### Create SNS Topic

```powershell
python backend/sns/setup_sns.py
```

Output should show:
```
Created SNS Topic: arn:aws:sns:us-east-1:YOUR_ACCOUNT_ID:viriva-climate-alerts
```

### Step 4: Initialize Amplify

```powershell
amplify init --profile viriva
```

When prompted:
- **Project name**: `viriva-ai`
- **Environment name**: `prod`
- **Default editor**: `code`
- **Choose AWS provider**: Yes
- **Use an AWS profile**: Yes → Select `viriva`

### Step 5: Add Backend Services

#### Add API (REST API with Lambda)

```powershell
amplify add api
```

When prompted:
- **Select service**: `REST`
- **Provide API name**: `virivaapi`
- **Provide resource path**: `/api`
- **Choose Lambda function**: Create a new Lambda function
- **Function name**: `viriva-main`
- **Runtime**: `Python`
- **Add another resource**: No

#### Add Authentication (Cognito)

```powershell
amplify add auth
```

When prompted:
- **Do you want to use the default authentication**: Yes
- **How do you want users to sign in**: Email
- **Do you want to configure advanced settings**: Yes
- **Multifactor authentication**: OPTIONAL
- **For User Pool users**: TOTP
```powershell
amplify add storage
```

When prompted:
- **Select from one of the below**: S3
- **Provide a friendly name**: `virivabucket`
- **Provide bucket name**: `viriva-climate-data` (or unique name)
- **Who should have access**: Authenticated users
- **What kind of access do you want**: read/write

#### Add Hosting

```powershell
amplify add hosting
```

When prompted:
- **Select the plugin module**: Amplify Hosting (managed hosting with Git integration)
- **Choose a type**: Continuous deployment (Git-based)
- OR **Manual deployment** if no Git integration needed

### Step 6: Deploy Everything to AWS

```powershell
amplify push --profile viriva
```

When prompted:
- Confirm all choices: Yes

This will take **5-10 minutes**. You'll see:
```
CREATE COMPLETE    ApiGatewayRestApi [stack_id...]
CREATE COMPLETE    Lambda Function [function_name...]
CREATE COMPLETE    Cognito UserPool [pool_id...]
CREATE COMPLETE    Amplify Hosting [hosting_id...]
```

### Step 7: Get Your Live Endpoint

After deployment completes:

```powershell
amplify status
```

You'll see:
```
API
- virivaapi
  REST API endpoint: https://YOUR_API_ID.execute-api.ap-south-1.amazonaws.com/prod

Hosting
- Amplify Hosting
  Website URL: https://main.dxxxxxxxx.amplifyapp.com
```

**Copy this URL** - it's your live application!

### Step 8: Test Your Backend

Test the API endpoints:

```powershell
# Health Check
curl https://YOUR_API_ID.execute-api.ap-south-1.amazonaws.com/prod/health

# Get Interventions
curl https://YOUR_API_ID.execute-api.ap-south-1.amazonaws.com/prod/api/interventions

# Generate Action Plan (requires authentication in production)
curl -X POST https://YOUR_API_ID.execute-api.ap-south-1.amazonaws.com/prod/api/action-plan/generate `
  -H "Content-Type: application/json" `
  -d '{"intervention_ids": ["int_1", "int_2"], "region": "Raichur"}'

# Chat with Viriva
curl -X POST https://YOUR_API_ID.execute-api.ap-south-1.amazonaws.com/prod/api/chat `
  -H "Content-Type: application/json" `
  -d '{"question": "Best intervention for methane reduction?", "language": "english"}'
```

### Step 9: Update Frontend Configuration

Update `frontend/.env`:

```env
VITE_API_ENDPOINT=https://YOUR_API_ID.execute-api.ap-south-1.amazonaws.com/prod
VITE_REGION=ap-south-1
VITE_COGNITO_USER_POOL_ID=YOUR_USER_POOL_ID
VITE_COGNITO_CLIENT_ID=YOUR_CLIENT_ID
```

### Step 10: Build and Deploy Frontend

```powershell
cd frontend
npm install
npm run build
cd ..

amplify publish --profile viriva
```

Select: `prod` environment

Your app is now **LIVE**! 🚀

---

## Cost Breakdown

| Service | Free Tier | MVP Usage | Estimated Cost |
|---------|-----------|-----------|-----------------|
| **DynamoDB** | 25 GB/month | On-demand (< 1 GB) | $0-1 |
| **Lambda** | 1M requests/month | 100K requests | Free |
| **API Gateway** | 12 months free | 50K calls | Free |
| **S3** | 5 GB/month | 1-2 GB | $0-1 |
| **SNS** | 1K notifications | 100 notifications | Free |
| **Amplify Hosting** | N/A | 1-10 GB served | $1-3 |
| **CloudWatch Logs** | 5 GB/month | 1-2 GB | Free |
| **Cognito** | 50K MAU | 5K users | Free |
| **Total** | - | - | **$2-5/month** |

**You have $200 - well within budget!**

---

## Monitoring & Logs

### View Lambda Logs

```powershell
amplify logs --type lambda
```

### Monitor DynamoDB

```powershell
aws dynamodb describe-table --table-name viriva-alerts --region ap-south-1 --profile viriva
```

### View CloudWatch Metrics

AWS Console → CloudWatch → Dashboards → Select your API

### Check API Gateway Requests

AWS Console → API Gateway → select virivaapi → Stages → Logs

---

## Troubleshooting

### Error: "Bedrock model not available"
**Solution**: Ensure your AWS account has Bedrock access enabled.

```powershell
aws bedrock list-foundation-models --region ap-south-1 --profile viriva
```

If no models are listed, you need to request access in the AWS Console.

### Error: "Insufficient capacity in DynamoDB"
**Solution**: This is rare. Switch to provisioned capacity:

```powershell
aws dynamodb update-table --table-name viriva-alerts `
  --billing-mode PROVISIONED `
  --provisioned-throughput ReadCapacityUnits=5,WriteCapacityUnits=5 `
  --region ap-south-1 --profile viriva
```

### Error: "Lambda timeout"
**Solution**: Increase timeout in the Lambda console:

```powershell
amplify update function
# When prompted, set timeout to 60 seconds
```

### Error: "DynamoDB table already exists"
**Solution**: Delete and recreate:

```powershell
aws dynamodb delete-table --table-name viriva-alerts --region ap-south-1 --profile viriva
python backend/dynamodb/create_tables.py
```

### Error: "Access Denied" for Bedrock
**Solution**: Ensure your IAM user has Bedrock permissions:

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": "bedrock:InvokeModel",
            "Resource": "*"
        }
    ]
}
```

---

## API Endpoints Reference

### Health
- **GET** `/health` - Service status

### Interventions
- **GET** `/api/interventions` - List all interventions

### Action Plans
- **POST** `/api/action-plan/generate` - Generate optimized portfolio
- **GET** `/api/action-plan/{plan_id}/export` - Export plan (JSON/PDF)

### Chat
- **POST** `/api/chat` - Ask Viriva AI (English/Kannada)

### Alerts
- **GET** `/api/alerts?region=Raichur` - Fetch regional alerts
- **POST** `/api/alerts/create` - Create new alert
- **POST** `/api/alerts/notify` - Send SNS notification

### Data
- **POST** `/api/data/validate` - Validate data with confidence scoring

---

## Next Steps

1. ✓ Backend deployed
2. ✓ Frontend live
3. **TODO**: Configure SNS email subscriptions
4. **TODO**: Set up CloudWatch alarms
5. **TODO**: Enable API key for public access (optional)
6. **TODO**: Add custom domain (optional)
7. **TODO**: Set up CI/CD pipeline

---

## Support & Debugging

For any issues:

1. **Check AWS Console** → Amplify → Select your app → Logs
2. **Check Lambda Logs** → AWS Console → Lambda → Functions → Logs
3. **Check DynamoDB** → AWS Console → DynamoDB → Tables → Monitoring
4. **Check API Gateway** → AWS Console → API Gateway → virivaapi → Logs

---

**Deployment Complete! Your Viriva AI MVP is now production-ready and live on AWS.**

Estimated deployment time: **15-20 minutes**
Estimated cost: **$2-5/month** (within $200 budget)

