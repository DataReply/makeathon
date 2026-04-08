# makeathon
AWS examples for a makeathon

# Quickstart Guide
🚀 Check out this document [Quick Start Guide](./Makeathon%20AWS%20Quickstart%20Guide.pdf)
1. Login
2. Roles & Permissions
3. Access Keys
4. Sagemaker AI Platform & Jupyter Notebooks
5. S3 Storage

---

# 🟦 TypeScript Examples

All TypeScript examples (Bedrock, S3, S3 Vectors, LangChain, RAG) are in the [`typescript/`](./typescript/) folder with their own setup, docs, and README.

👉 **[Go to TypeScript README](./typescript/README.md)**

Quick overview of what's inside:

| Script | File | What it does |
|---|---|---|
| `npm run verify` | [`src/verify.ts`](./typescript/src/verify.ts) | Check your credentials work |
| `npm run bedrock` | [`src/bedrock.ts`](./typescript/src/bedrock.ts) | Invoke any Bedrock model (simple + streaming) |
| `npm run s3` | [`src/s3.ts`](./typescript/src/s3.ts) | Upload / download / list S3 objects |
| `npm run rag` | [`src/rag.ts`](./typescript/src/rag.ts) | Full RAG pipeline with S3 Vectors (raw SDK) |
| `npm run langchain` | [`src/langchain-rag.ts`](./typescript/src/langchain-rag.ts) | RAG with LangChain + Bedrock |

---

# 🐍 Python Examples (SageMaker Notebooks)

## S3 Access
Checkout the [S3_Example.ipynb](./S3_Example.ipynb) notebook. →
You can run this on [AWS Sagemaker Notebooks](https://docs.aws.amazon.com/sagemaker/latest/dg/nbi.html)

## Bedrock Access
Checkout the [Bedrock_Example.ipynb](./Bedrock_Example.ipynb) notebook. →
You can run this on [AWS Sagemaker Notebooks](https://docs.aws.amazon.com/sagemaker/latest/dg/nbi.html)

---

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

> **ATTENTION!** When selecting a model in Bedrock it's now required their **inference profile IDs** instead of raw model IDs.
>
> Example:
>   - Before: `amazon.nova-pro-v1:0`
>   - Now: `eu.amazon.nova-pro-v1:0`
>
> Find all available inference profile IDs here: [Supported Regions and models for inference profiles](https://docs.aws.amazon.com/bedrock/latest/userguide/inference-profiles-support.html) (always choose EU when available, otherwise global).
> When generating code with AI you might need to change this manually, as it's a recent change in AWS ;)

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

---

# 💡 Tips

## Connect LangChain docs to your AI coding assistant

If you're using an AI coding assistant (Cursor, Windsurf, Claude Code, GitHub Copilot, etc.), you can give it **direct access to the latest LangChain documentation** via their MCP server. This means your assistant will give you accurate, up-to-date LangChain code instead of hallucinating outdated APIs.

**MCP Server URL:**
```
https://docs.langchain.com/mcp
```

**Claude Code:**
```bash
claude mcp add --transport http docs-langchain https://docs.langchain.com/mcp
```

**Cursor / Windsurf** — add to your MCP settings (`.cursor/mcp.json` or equivalent):
```json
{
  "mcpServers": {
    "langchain-docs": {
      "type": "http",
      "url": "https://docs.langchain.com/mcp"
    }
  }
}
```

Once connected, your assistant can search LangChain, LangGraph, and LangSmith docs in real time. More details: [docs.langchain.com/use-these-docs](https://docs.langchain.com/use-these-docs)

## Other useful tips

- **Always use `eu.` inference profile IDs** for Bedrock models to keep data in EU regions
- **S3 bucket names must be lowercase** — only letters, numbers, and hyphens, globally unique
- **SSO credentials expire after ~1 hour** — re-copy from the portal when you get `ExpiredTokenException`