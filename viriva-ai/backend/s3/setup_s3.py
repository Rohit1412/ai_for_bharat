import boto3
import json
from datetime import datetime

s3_client = boto3.client('s3', region_name='us-east-1')

BUCKET_NAME = 'viriva-climate-data'

def create_s3_bucket():
    """Create S3 bucket for storing action plans, data exports, and PDFs."""
    try:
        s3_client.create_bucket(Bucket=BUCKET_NAME)
        print(f"Created S3 bucket: {BUCKET_NAME}")
        
        # Enable versioning
        s3_client.put_bucket_versioning(
            Bucket=BUCKET_NAME,
            VersioningConfiguration={'Status': 'Enabled'}
        )
        print("Enabled versioning")
        
        # Set lifecycle policy (delete old exports after 90 days)
        lifecycle_policy = {
            'Rules': [
                {
                    'Id': 'DeleteOldExports',
                    'Status': 'Enabled',
                    'Prefix': 'exports/',
                    'Expiration': {'Days': 90}
                }
            ]
        }
        
        s3_client.put_bucket_lifecycle_configuration(
            Bucket=BUCKET_NAME,
            LifecycleConfiguration=lifecycle_policy
        )
        print("Set lifecycle policy")
        
    except s3_client.exceptions.BucketAlreadyOwnedByYou:
        print(f"Bucket {BUCKET_NAME} already exists and is owned by you")
    except Exception as e:
        print(f"Error creating S3 bucket: {e}")

def upload_mock_data():
    """Upload mock climate data for demonstration."""
    try:
        mock_data = {
            "regions": {
                "raichur": {
                    "paddy_hectares": 285000,
                    "annual_methane_tons": 12750,
                    "water_stress_index": 78,
                    "solar_potential_kwh_m2": 5.8
                },
                "chikkaballapur": {
                    "paddy_hectares": 165000,
                    "annual_methane_tons": 7360,
                    "water_stress_index": 72,
                    "solar_potential_kwh_m2": 5.6
                }
            }
        }
        
        s3_client.put_object(
            Bucket=BUCKET_NAME,
            Key='data/karnataka-climate-data.json',
            Body=json.dumps(mock_data),
            ContentType='application/json'
        )
        print("Uploaded mock climate data")
    
    except Exception as e:
        print(f"Error uploading mock data: {e}")

if __name__ == "__main__":
    create_s3_bucket()
    upload_mock_data()
