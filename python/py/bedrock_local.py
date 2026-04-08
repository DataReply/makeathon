import os

import boto3
from dotenv import load_dotenv

# Load variables from .evn file
load_dotenv()

# Use access keys to authenticate to AWS
brt = boto3.client(
    service_name="bedrock-runtime",
    region_name="eu-central-1",
)

# Set the model ID, e.g., Anthropic Clause Haiku 4.5.
model_id = "eu.anthropic.claude-haiku-4-5-20251001-v1:0"

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
    inferenceConfig={"maxTokens": 512, "temperature": 0.5},
)

# Extract and print the response text.
response_text = response["output"]["message"]["content"][0]["text"]
print("Model Response:", response_text)
