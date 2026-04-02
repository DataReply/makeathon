import os

import boto3
from dotenv import load_dotenv

# Load variables from .evn file
load_dotenv()

bucket_name = "makeathontest"
prefix = "data/"

# Instantiate the boto3 client
s3 = boto3.client(
    service_name="s3",
    region_name="eu-central-1",
)

# Construct unique S3 key (file path in the bucket)
remote_file_name = "dummy_data.csv"
s3_key = prefix + remote_file_name

# Download a file and store it locally
local_file_name = "dummy_data.csv"
s3.download_file(Filename=local_file_name, Bucket=bucket_name, Key=s3_key)
print(
    f"Downloaded 's3://{bucket_name}/{s3_key}' and stored file in '{local_file_name}'"
)
