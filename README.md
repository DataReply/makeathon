# makeathon
AWS examples for a makeathon

# Quickstart Guide
🚀 Check out this document [Quick Start Guide](./Makeathon%20AWS%20Quickstart%20Guide.pdf)
1. Login
2. Roles & Permissions
3. Access Keys
4. Sagemaker AI Platform & Jupyter Notebooks
5. S3 Storage


# S3 Access
Checkout the [S3_Example.ipynb](./S3_Example.ipynb) notebook. ->
You can run this on [AWS Sagemaker Notebooks](https://docs.aws.amazon.com/sagemaker/latest/dg/nbi.html)


# Bedrock Access
Checkout the [Bedrock_Example.ipynb](./Bedrock_Example.ipynb) notebook. ->
You can run this on [AWS Sagemaker Notebooks](https://docs.aws.amazon.com/sagemaker/latest/dg/nbi.html)

# Local Examples
Make sure you never store access keys in a public location!

## Prerequisites
### Create a virtual python environment
1. Create a virtual python environment `python3 -m venv .venv`
2. Activate the virtual environment `source .venv/bin/activate`
3. Install the required libraries `pip install -r requirements.txt`

Source: https://docs.python.org/3/library/venv.html

### Create AWS Access key
1. Create an AWS Access key [Link](https://docs.aws.amazon.com/IAM/latest/UserGuide/access-key-self-managed.html)
2. Create a copy of the `.env.example` file and name it `.env`
3. Store the `Key ID` and the `Key Secret` in the `.env` file

**WARNING** Make sure you NEVER add these keys to a public repository!

## Bedrock Local

1. Make sure the environment is activated `source .venv/bin/activate`
2. Execute `python bedrock_local.py`

The output should look like this:
```
(.venv) user@host$ python bedrock_local.py

>>> Model Response: A 'hello world' program demonstrates the basic syntax of a programming language by outputting a simple greeting.
```

## S3 Local
1. Make sure the environment is activated `source .venv/bin/activate`
2. Change the group name in the file `s3_local.py` to a valid group name
3. Execute `python s3_local.py`

The output should look like this:
```
(.venv) user@host$ python s3_local.py
Downloaded 's3://makeathontest/data/dummy_data.csv' and stored file in 'dummy_data.csv'

(.venv) user@host$ ls
dummy_data.csv
```
