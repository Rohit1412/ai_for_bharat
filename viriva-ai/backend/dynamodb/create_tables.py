import boto3
import json

dynamodb = boto3.client('dynamodb', region_name='us-east-1')

# Table: viriva-alerts
alerts_table_schema = {
    'TableName': 'viriva-alerts',
    'KeySchema': [
        {'AttributeName': 'region', 'KeyType': 'HASH'},
        {'AttributeName': 'timestamp', 'KeyType': 'RANGE'}
    ],
    'AttributeDefinitions': [
        {'AttributeName': 'region', 'AttributeType': 'S'},
        {'AttributeName': 'timestamp', 'AttributeType': 'N'}
    ],
    'BillingMode': 'PAY_PER_REQUEST',
    'Tags': [
        {'Key': 'Environment', 'Value': 'Production'},
        {'Key': 'Service', 'Value': 'Viriva'}
    ]
}

# Table: viriva-interventions
interventions_table_schema = {
    'TableName': 'viriva-interventions',
    'KeySchema': [
        {'AttributeName': 'intervention_id', 'KeyType': 'HASH'}
    ],
    'AttributeDefinitions': [
        {'AttributeName': 'intervention_id', 'AttributeType': 'S'}
    ],
    'BillingMode': 'PAY_PER_REQUEST',
    'Tags': [
        {'Key': 'Environment', 'Value': 'Production'},
        {'Key': 'Service', 'Value': 'Viriva'}
    ]
}

# Table: viriva-action-plans
action_plans_table_schema = {
    'TableName': 'viriva-action-plans',
    'KeySchema': [
        {'AttributeName': 'plan_id', 'KeyType': 'HASH'},
        {'AttributeName': 'created_at', 'KeyType': 'RANGE'}
    ],
    'AttributeDefinitions': [
        {'AttributeName': 'plan_id', 'AttributeType': 'S'},
        {'AttributeName': 'created_at', 'AttributeType': 'N'}
    ],
    'BillingMode': 'PAY_PER_REQUEST',
    'GlobalSecondaryIndexes': [
        {
            'IndexName': 'region-created_at-index',
            'KeySchema': [
                {'AttributeName': 'region', 'KeyType': 'HASH'},
                {'AttributeName': 'created_at', 'KeyType': 'RANGE'}
            ],
            'Projection': {'ProjectionType': 'ALL'}
        }
    ],
    'Tags': [
        {'Key': 'Environment', 'Value': 'Production'},
        {'Key': 'Service', 'Value': 'Viriva'}
    ]
}

def create_tables():
    """Create all DynamoDB tables for Viriva AI backend."""
    try:
        # Create alerts table
        dynamodb.create_table(**alerts_table_schema)
        print("Created viriva-alerts table")
        
        # Create interventions table
        dynamodb.create_table(**interventions_table_schema)
        print("Created viriva-interventions table")
        
        # Create action-plans table
        dynamodb.create_table(**action_plans_table_schema)
        print("Created viriva-action-plans table")
        
        print("All tables created successfully!")
    
    except dynamodb.exceptions.ResourceInUseException:
        print("Tables already exist")
    except Exception as e:
        print(f"Error creating tables: {e}")

if __name__ == "__main__":
    create_tables()
