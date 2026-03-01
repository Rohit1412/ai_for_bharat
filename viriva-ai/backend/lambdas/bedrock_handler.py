import json
import boto3
import uuid
from datetime import datetime
import re

bedrock = boto3.client('bedrock-runtime', region_name='ap-south-1')
dynamodb = boto3.resource('dynamodb', region_name='ap-south-1')
interventions_table = dynamodb.Table('viriva-interventions')
chat_table = dynamodb.Table('viriva-chat-history')

# Karnataka rural development context
KARNATAKA_CONTEXT = """
Karnataka Rural Development Focus Areas:
1. Groundwater Management and Irrigation
2. Renewable Energy (Solar, Biogas)
3. Sustainable Agriculture and Crop Yield
4. Livestock and Dairy Development
5. Rural Roads and Connectivity
6. Health and Education Infrastructure
7. Waste Management and Environmental Sustainability

Mock Data: Districts of focus - Belgaum, Bijapur, Gulbarga, Raichur, Kolar, Chikballapur,
Tumkur, Chitradurga, Davangere, Haveri, Uttara Kannada, Shimoga, Udupi, Kodagu, Hassan, Mandya
"""

def invoke_bedrock(prompt, system_message=None):
    """Call Claude 3.5 Sonnet via Bedrock"""
    messages = [{"role": "user", "content": prompt}]
    
    response = bedrock.invoke_model(
        modelId='anthropic.claude-3-5-sonnet-20241022',
        contentType='application/json',
        accept='application/json',
        body=json.dumps({
            "anthropic_version": "bedrock-2023-06-01",
            "max_tokens": 2048,
            "system": system_message or "You are Viriva, an AI assistant for rural development in Karnataka, India.",
            "messages": messages
        })
    )
    
    result = json.loads(response['body'].read())
    return result['content'][0]['text']

def generate_action_plan(challenge_description):
    """Generate ranked portfolio of actions using Bedrock"""
    prompt = f"""
    {KARNATAKA_CONTEXT}
    
    Rural Development Challenge: {challenge_description}
    
    Generate a ranked action plan with 5 interventions. For each action, provide:
    1. Name
    2. Impact Score (1-10)
    3. Cost-Benefit Ratio
    4. Timeline (months)
    5. Key Stakeholders
    6. Success Metrics
    7. Trade-offs
    
    Format as JSON array.
    """
    
    response = invoke_bedrock(
        prompt,
        "You are an expert in rural development. Generate practical, evidence-based action plans for Karnataka districts."
    )
    
    # Parse and structure response
    try:
        # Find JSON in response
        json_match = re.search(r'\[.*\]', response, re.DOTALL)
        if json_match:
            actions = json.loads(json_match.group())
        else:
            actions = [{"name": "Action", "description": response, "impact": 7}]
    except:
        actions = [{"name": "Action", "description": response, "impact": 7}]
    
    return actions

def chat_with_viriva(user_message, chat_id=None):
    """Handle AI chat with RAG over mock Karnataka data"""
    if not chat_id:
        chat_id = str(uuid.uuid4())
    
    prompt = f"""
    {KARNATAKA_CONTEXT}
    
    User Question: {user_message}
    
    Provide answer in both English and Kannada.
    Format as JSON: {{"english": "...", "kannada": "..."}}
    """
    
    response = invoke_bedrock(
        prompt,
        "You are Viriva, an AI assistant for rural development in Karnataka. Answer questions about sustainable development, agriculture, renewable energy, and rural infrastructure. Provide answers in both English and Kannada."
    )
    
    # Store in DynamoDB
    timestamp = int(datetime.now().timestamp() * 1000)
    chat_table.put_item(Item={
        'chat_id': chat_id,
        'timestamp': timestamp,
        'user_message': user_message,
        'response': response,
        'created_at': datetime.now().isoformat()
    })
    
    return {"chat_id": chat_id, "response": response}

def lambda_handler(event, context):
    """Lambda handler for API Gateway"""
    path = event.get('path', '')
    method = event.get('httpMethod', 'GET')
    body = json.loads(event.get('body', '{}'))
    
    try:
        if path == '/api/action-plan' and method == 'POST':
            challenge = body.get('challenge', '')
            actions = generate_action_plan(challenge)
            
            # Save to DynamoDB
            for i, action in enumerate(actions):
                intervention_id = str(uuid.uuid4())
                interventions_table.put_item(Item={
                    'intervention_id': intervention_id,
                    'action': action,
                    'challenge': challenge,
                    'created_at': datetime.now().isoformat(),
                    'rank': i + 1
                })
            
            return {
                'statusCode': 200,
                'body': json.dumps({
                    'status': 'success',
                    'actions': actions
                }),
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                }
            }
        
        elif path == '/api/chat' and method == 'POST':
            user_message = body.get('message', '')
            chat_result = chat_with_viriva(user_message)
            
            return {
                'statusCode': 200,
                'body': json.dumps(chat_result),
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                }
            }
        
        else:
            return {
                'statusCode': 400,
                'body': json.dumps({'error': 'Invalid endpoint'}),
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'}
            }
    
    except Exception as e:
        return {
            'statusCode': 500,
            'body': json.dumps({'error': str(e)}),
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'}
        }
