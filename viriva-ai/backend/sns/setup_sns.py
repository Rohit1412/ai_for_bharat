import boto3
import json

sns_client = boto3.client('sns', region_name='us-east-1')

TOPIC_NAME = 'viriva-climate-alerts'

def create_sns_topic():
    """Create SNS topic for climate alerts and notifications."""
    try:
        response = sns_client.create_topic(
            Name=TOPIC_NAME,
            Attributes={
                'DisplayName': 'Viriva Climate Action Alerts',
                'KmsMasterKeyId': 'alias/aws/sns'
            },
            Tags=[
                {'Key': 'Environment', 'Value': 'Production'},
                {'Key': 'Service', 'Value': 'Viriva'}
            ]
        )
        
        topic_arn = response['TopicArn']
        print(f"Created SNS Topic: {topic_arn}")
        return topic_arn
    
    except sns_client.exceptions.TopicLimitExceededException:
        print(f"Topic {TOPIC_NAME} already exists")
        response = sns_client.list_topics()
        for topic in response['Topics']:
            if TOPIC_NAME in topic['TopicArn']:
                return topic['TopicArn']
    
    except Exception as e:
        print(f"Error creating SNS topic: {e}")

def subscribe_email(topic_arn, email):
    """Subscribe an email address to the SNS topic."""
    try:
        response = sns_client.subscribe(
            TopicArn=topic_arn,
            Protocol='email',
            Endpoint=email
        )
        print(f"Subscribed {email} to {topic_arn}")
        return response['SubscriptionArn']
    
    except Exception as e:
        print(f"Error subscribing email: {e}")

def publish_alert(topic_arn, subject, message):
    """Publish an alert message to the SNS topic."""
    try:
        response = sns_client.publish(
            TopicArn=topic_arn,
            Subject=subject,
            Message=message
        )
        print(f"Published alert: {response['MessageId']}")
        return response['MessageId']
    
    except Exception as e:
        print(f"Error publishing alert: {e}")

if __name__ == "__main__":
    topic_arn = create_sns_topic()
    # Example: subscribe_email(topic_arn, 'alerts@example.com')
    # Example: publish_alert(topic_arn, 'Test Alert', 'This is a test alert from Viriva AI')
