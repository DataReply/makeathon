import os

import boto3
from dotenv import load_dotenv

# Load variables from .evn file
load_dotenv()

# Load access keys
AWS_ACCESS_KEY_ID = os.getenv("AWS_ACCESS_KEY_ID")
AWS_SECRET_ACCESS_KEY = os.getenv("AWS_SECRET_ACCESS_KEY")

# Use access keys to authenticate to AWS
brt = boto3.client(
    service_name="bedrock-runtime",
    aws_access_key_id=AWS_ACCESS_KEY_ID, # only needed if running locally
    aws_secret_access_key=AWS_SECRET_ACCESS_KEY, # only needed if running locally
    region_name="eu-central-1",
)

# Set the model ID, e.g., Anthropic Clause 3.5 Sonnet.
model_id = "eu.meta.llama3-2-1b-instruct-v1:0"

# Start a conversation with the user message.
user_message = "Describe the purpose of a 'hello world' program in one line."
conversation = [
    {
        "role": "user",
        "content": [{"text": user_message}],
    }
]

# Send the message to the model, using a basic inference configuration.
response = brt.converse(
    modelId=model_id,
    messages=conversation,
    inferenceConfig={"maxTokens": 512, "temperature": 0.5, "topP": 0.9},
)

# Extract and print the response text.
response_text = response["output"]["message"]["content"][0]["text"]
print("Model Response:", response_text)
