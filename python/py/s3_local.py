# Do not forget to set a unique bucket name!

import boto3
import pandas as pd
from dotenv import load_dotenv

# Load variables from .env file
load_dotenv()

bucket_name = "CHANGE_TO_UNIQUE_NAME" # SET UNIQUE NAME
prefix = "data/"

s3_resource = boto3.resource('s3')
existing_buckets = [bucket.name for bucket in s3_resource.buckets.all()]
s3_client = boto3.client('s3', region_name = "eu-central-1")
if bucket_name not in existing_buckets:
    s3_client.create_bucket(Bucket=bucket_name, CreateBucketConfiguration={'LocationConstraint': 'eu-central-1'})
    print("Created new bucket")
else: 
    print("Bucket already exists")

# Create dummy data to save to s3 and read from it
data = {
    'name': ['Alice', 'Bob', 'Charlie'],
    'age': [25, 30, 35],
    'email': ['alice@example.com', 'bob@example.com', 'charlie@example.com']
}
df = pd.DataFrame(data)

# Store file locally
local_file_path = "dummy_data.csv"
df.to_csv(local_file_path, index=False)
print(f"CSV saved locally at: {local_file_path}")

# Upload to s3
s3_key = prefix + "dummy_data.csv"
s3_client.upload_file(Filename=local_file_path, Bucket=bucket_name, Key=s3_key)
print(f"CSV uploaded to s3://{bucket_name}/{s3_key}")

# Download a file and store it locally
local_file_name = "dummy_data.csv"
s3_client.download_file(Filename=local_file_name, Bucket=bucket_name, Key=s3_key)
print(
    f"Downloaded 's3://{bucket_name}/{s3_key}' and stored file in '{local_file_name}'"
)
