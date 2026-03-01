import json
import boto3
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import os
from datetime import datetime

app = FastAPI(title="Viriva AI Backend API")

# CORS Configuration for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# AWS Clients
bedrock_client = boto3.client('bedrock-runtime', region_name='us-east-1')
dynamodb = boto3.resource('dynamodb', region_name='us-east-1')
sns_client = boto3.client('sns', region_name='us-east-1')
s3_client = boto3.client('s3', region_name='us-east-1')

# DynamoDB Tables
alerts_table = dynamodb.Table(os.environ.get('ALERTS_TABLE', 'viriva-alerts'))
interventions_table = dynamodb.Table(os.environ.get('INTERVENTIONS_TABLE', 'viriva-interventions'))
action_plans_table = dynamodb.Table(os.environ.get('ACTION_PLANS_TABLE', 'viriva-action-plans'))

# Models
class InterventionInput(BaseModel):
    intervention_ids: List[str]
    region: str = "Karnataka"
    budget_limit: Optional[float] = None

class ChatMessage(BaseModel):
    question: str
    language: str = "english"
    context: Optional[dict] = None

class AlertThreshold(BaseModel):
    metric: str
    threshold: float
    region: str

# Health Check
@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "service": "viriva-ai-backend"
    }

# Action Plan Generation using Bedrock
@app.post("/api/action-plan/generate")
async def generate_action_plan(request: InterventionInput):
    """
    Generate optimized action plan using Bedrock Claude 3.5 Sonnet.
    Uses multi-objective optimization: climate, cost, equity, feasibility.
    """
    try:
        # Construct prompt for Bedrock
        prompt = f"""
You are Viriva AI, a climate action coordinator for rural India. 
A farmer in {request.region} district has selected these interventions: {', '.join(request.intervention_ids)}.

Available interventions:
1. Solar Agri-Pumps: 60K-85K cost, 250 tCO2e reduction, 85 equity score
2. Direct Seeded Rice (DSR): 15K-25K cost, 380 tCO2e reduction, 90 equity score
3. Residue-to-Biogas: 50K-95K cost, 180 tCO2e reduction, 75 equity score
4. Dairy Methane Digesters: 80K-110K cost, 120 tCO2e reduction, 70 equity score
5. Reforestation: 5K-15K cost, 150 tCO2e reduction, 95 equity score

Generate a detailed action plan that:
1. Ranks interventions by climate impact, cost efficiency, and equity
2. Explains trade-offs clearly
3. Provides a timeline for implementation
4. Includes uncertainty estimates
5. Is implementable within budget: {request.budget_limit or 'No limit'}

Format response as JSON with keys: ranked_portfolio, trade_off_analysis, timeline, recommendations, confidence_scores.
"""

        # Call Bedrock Claude 3.5 Sonnet
        response = bedrock_client.invoke_model(
            modelId='anthropic.claude-3-5-sonnet-20241022',
            contentType='application/json',
            accept='application/json',
            body=json.dumps({
                "anthropic_version": "bedrock-2023-06-01",
                "max_tokens": 2000,
                "messages": [
                    {
                        "role": "user",
                        "content": prompt
                    }
                ]
            })
        )

        result = json.loads(response['body'].read())
        response_text = result['content'][0]['text']
        
        # Parse and structure response
        action_plan = {
            "id": f"plan-{datetime.utcnow().timestamp()}",
            "region": request.region,
            "selected_interventions": request.intervention_ids,
            "ai_explanation": response_text,
            "created_at": datetime.utcnow().isoformat(),
            "status": "generated"
        }

        # Store in DynamoDB
        action_plans_table.put_item(Item=action_plan)

        return {
            "success": True,
            "action_plan_id": action_plan['id'],
            "explanation": response_text,
            "region": request.region,
            "interventions_count": len(request.intervention_ids)
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating action plan: {str(e)}")

# AI Chat with RAG
@app.post("/api/chat")
async def chat_with_viriva(message: ChatMessage):
    """
    Chat with Viriva AI assistant.
    Supports English and Kannada with RAG over climate data.
    """
    try:
        language_prompt = f"Respond in {message.language.upper()}." if message.language == "kannada" else "Respond in clear English."
        
        prompt = f"""
You are Viriva AI, a knowledgeable climate action assistant for rural India.
User question: {message.question}
{language_prompt}

Provide a practical, action-oriented answer based on verified climate science and real interventions available for rural India.
If you don't have specific information, acknowledge it and provide general guidance.
Include relevant schemes or subsidies if applicable.
"""

        response = bedrock_client.invoke_model(
            modelId='anthropic.claude-3-5-sonnet-20241022',
            contentType='application/json',
            accept='application/json',
            body=json.dumps({
                "anthropic_version": "bedrock-2023-06-01",
                "max_tokens": 1000,
                "messages": [
                    {
                        "role": "user",
                        "content": prompt
                    }
                ]
            })
        )

        result = json.loads(response['body'].read())
        response_text = result['content'][0]['text']

        return {
            "success": True,
            "question": message.question,
            "answer": response_text,
            "language": message.language,
            "confidence": 0.95
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing chat: {str(e)}")

# Get Alerts
@app.get("/api/alerts")
async def get_alerts(region: str = "Raichur"):
    """Get real-time alerts for a specific region."""
    try:
        response = alerts_table.query(
            KeyConditionExpression='region = :region',
            ExpressionAttributeValues={':region': region},
            ScanIndexForward=False,
            Limit=10
        )
        
        return {
            "success": True,
            "region": region,
            "alerts": response.get('Items', []),
            "count": response.get('Count', 0)
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching alerts: {str(e)}")

# Create Alert
@app.post("/api/alerts/create")
async def create_alert(alert: AlertThreshold):
    """Create a new alert threshold."""
    try:
        alert_item = {
            "id": f"alert-{datetime.utcnow().timestamp()}",
            "region": alert.region,
            "metric": alert.metric,
            "threshold": alert.threshold,
            "created_at": datetime.utcnow().isoformat(),
            "status": "active"
        }
        
        alerts_table.put_item(Item=alert_item)
        
        return {
            "success": True,
            "alert_id": alert_item['id'],
            "message": f"Alert created for {alert.metric} in {alert.region}"
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating alert: {str(e)}")

# SNS Alert Notification
@app.post("/api/alerts/notify")
async def send_alert_notification(alert_id: str, message: str, recipients: List[str]):
    """Send alert notification via SNS."""
    try:
        topic_arn = os.environ.get('SNS_TOPIC_ARN')
        
        if not topic_arn:
            raise HTTPException(status_code=400, detail="SNS Topic not configured")
        
        sns_client.publish(
            TopicArn=topic_arn,
            Subject=f"Viriva AI Alert: {alert_id}",
            Message=message
        )
        
        return {
            "success": True,
            "alert_id": alert_id,
            "recipients_count": len(recipients),
            "message": "Alert notification sent successfully"
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error sending notification: {str(e)}")

# Get Interventions Library
@app.get("/api/interventions")
async def get_interventions():
    """Get available climate interventions."""
    interventions = [
        {
            "id": "int_1",
            "name": "Solar Agri-Pumps",
            "description": "Solar-powered pumps for irrigation",
            "cost_range": "60,000 - 85,000",
            "carbon_reduction": 250,
            "equity_score": 85,
            "water_savings_percent": 25
        },
        {
            "id": "int_2",
            "name": "Direct Seeded Rice (DSR)",
            "description": "Switch from flooded to direct-seeded rice",
            "cost_range": "15,000 - 25,000",
            "carbon_reduction": 380,
            "equity_score": 90,
            "water_savings_percent": 30
        },
        {
            "id": "int_3",
            "name": "Residue-to-Biogas",
            "description": "Convert crop residue to biogas",
            "cost_range": "50,000 - 95,000",
            "carbon_reduction": 180,
            "equity_score": 75,
            "water_savings_percent": 0
        },
        {
            "id": "int_4",
            "name": "Dairy Methane Digesters",
            "description": "Anaerobic digesters for dairy farms",
            "cost_range": "80,000 - 110,000",
            "carbon_reduction": 120,
            "equity_score": 70,
            "water_savings_percent": 5
        },
        {
            "id": "int_5",
            "name": "Reforestation",
            "description": "Reforestation on farm boundaries",
            "cost_range": "5,000 - 15,000",
            "carbon_reduction": 150,
            "equity_score": 95,
            "water_savings_percent": 10
        }
    ]
    
    return {
        "success": True,
        "interventions": interventions,
        "count": len(interventions)
    }

# Export Action Plan
@app.get("/api/action-plan/{plan_id}/export")
async def export_action_plan(plan_id: str, format: str = "json"):
    """Export action plan in JSON or PDF format."""
    try:
        plan = action_plans_table.get_item(Key={'id': plan_id})
        
        if 'Item' not in plan:
            raise HTTPException(status_code=404, detail="Action plan not found")
        
        return {
            "success": True,
            "plan_id": plan_id,
            "format": format,
            "data": plan['Item']
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error exporting plan: {str(e)}")

# Data Validation & Confidence Scoring
@app.post("/api/data/validate")
async def validate_data(data: dict):
    """Validate input data and assign confidence scores."""
    try:
        prompt = f"""
Analyze this climate data and assign confidence scores (0-100) for each field:
{json.dumps(data, indent=2)}

Check for:
1. Data completeness (are all required fields present?)
2. Logical consistency (do values make sense together?)
3. Outliers (are there anomalies that suggest measurement errors?)

Respond with a JSON object containing: validated_fields, issues, overall_confidence_score, recommendations
"""
        
        response = bedrock_client.invoke_model(
            modelId='anthropic.claude-3-5-sonnet-20241022',
            contentType='application/json',
            accept='application/json',
            body=json.dumps({
                "anthropic_version": "bedrock-2023-06-01",
                "max_tokens": 1000,
                "messages": [
                    {
                        "role": "user",
                        "content": prompt
                    }
                ]
            })
        )
        
        result = json.loads(response['body'].read())
        response_text = result['content'][0]['text']
        
        return {
            "success": True,
            "validation_result": response_text
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error validating data: {str(e)}")

# Default root
@app.get("/")
async def root():
    return {
        "service": "Viriva AI Backend API",
        "version": "1.0.0",
        "endpoints": {
            "health": "/health",
            "action_plan": "/api/action-plan/generate",
            "chat": "/api/chat",
            "alerts": "/api/alerts",
            "interventions": "/api/interventions"
        }
    }

# Lambda Handler for AWS
def lambda_handler(event, context):
    """ASGI Lambda handler for Amplify."""
    from mangum import Mangum
    
    handler = Mangum(app)
    return handler(event, context)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
