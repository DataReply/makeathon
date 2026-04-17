# 🟦 TypeScript Examples

AWS Bedrock, S3, and S3 Vectors examples using the AWS SDK for JavaScript v3.

## Prerequisites

- [Node.js](https://nodejs.org/) v20+ (LTS recommended)
- AWS credentials (via access keys)
- **AWS CLI v2** — [Install instructions](https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html#getting-started-install-instructions)

Quick check:
```bash
node --version    # should be v20+
aws --version     # should be aws-cli/2.x.x
```

## Setup

### 1. Install dependencies
```bash
cd typescript 
npm install
```

## 2. Configure credentials

There are **three approaches**. Option A or B configure credentials **system-wide** (AWS CLI + SDK + everything). Option C only works for the TypeScript examples in this repo.

| | Scope | Persists? | AWS CLI works? | npm scripts work? |
|---|---|---|---|---|
| **A — `aws configure`** | System-wide | ✅ Survives terminal restart | ✅ | ✅ |
| **B — Environment variables** | Current terminal only | ❌ Gone when you close terminal | ✅ | ✅ |
| **C — `.env` file** | This project only | ✅ On disk | ❌ | ✅ |

> **A or B replaces C** — if you set credentials via `aws configure` or env vars, the `.env` file is not mandatory.
> **C does NOT replace A or B** — the `.env` file is only loaded by `dotenv` at runtime inside the TypeScript examples. The AWS CLI and other tools won't see it.

---

### Option A — `aws configure` (simplest, works everywhere)

This stores your credentials in `~/.aws/credentials` so they persist across terminal sessions. Works the same on Windows, macOS, and Linux.

```bash
aws configure
```

It will prompt you for four values:
```
AWS Access Key ID [None]: AKIA...
AWS Secret Access Key [None]: xxxxxx
Default region name [None]: eu-central-1
Default output format [None]: None
```

---

### Option B — Environment variables (per terminal session)

These only last for the current terminal session. Useful if you don't want to persist credentials on disk.

**macOS / Linux (bash/zsh):**
```bash
export AWS_ACCESS_KEY_ID="ASIA..."
export AWS_SECRET_ACCESS_KEY="..."
export AWS_DEFAULT_REGION="eu-central-1"
```

**Windows — PowerShell:**
```powershell
$env:AWS_ACCESS_KEY_ID="ASIA..."
$env:AWS_SECRET_ACCESS_KEY="..."
$env:AWS_DEFAULT_REGION="eu-central-1"
```

---

### Option C — `.env` file (for the TypeScript examples only)

The TypeScript examples load credentials from a `.env` file via `dotenv`. This doesn't affect the AWS CLI, but it works for `npm run bedrock`, `npm run rag`, etc.

```bash
cp .env.example .env
# Edit .env and fill in your credentials
```

> This is the easiest option if you're **only** running the TypeScript examples and don't need the AWS CLI.

---

### Verify your credentials

**For Option A or B** — use the AWS CLI:
```bash
aws sts get-caller-identity
```
Expected output:
```json
{
    "UserId": "AIDAV4HZ4WJ2PY7EXAMPLE",
    "Account": "123456789012",
    "Arn": "arn:aws:iam::123456789012:user/team-01-user"
}
```

**For Option C** — the AWS CLI won't see `.env` credentials, so use this script instead:
```bash
npm run verify
```
This runs a small script that loads your `.env` file and calls `sts:GetCallerIdentity` using the same credentials your TypeScript examples will use.

---

## Run Examples

### Repo Structure

```text
typescript/
├── README.md                # ← you're HERE :)
├── package.json             # dependencies & npm scripts (npm run bedrock, npm run rag, etc.)
├── tsconfig.json            # TypeScript compiler config (strict mode enabled)
├── .env.example             # template for credentials & config — copy to .env and fill in
├── .gitignore               # keeps .env and node_modules/ out of git
│
│
└── src/
    ├── config.ts            # loads .env, validates required vars, exports a typed config object
    │                        #   → all other files import { config } from "./config.js"
    │                        #   → single place to change region, model IDs, bucket names
    │
    ├── bedrock.ts           # invoke Claude on Bedrock (simple + streaming)
    │                        #   → uses raw AWS SDK: InvokeModelCommand
    │                        #   → good starting point to understand how Bedrock calls work
    │
    ├── s3.ts                # upload, download, and list objects in S3
    │                        #   → uses raw AWS SDK: PutObjectCommand, GetObjectCommand
    │                        #   → useful for storing data, model outputs, team artifacts
    │
    ├── rag.ts               # full RAG pipeline with S3 Vectors (raw AWS SDK)
    │                        #   → creates vector bucket + index, embeds docs, stores vectors
    │                        #   → runs semantic search, feeds context to Claude for answers
    │                        #   → gives you full control over every step
    │
    └── langchain-rag.ts     # same RAG pipeline but using LangChain
                             #   → uses ChatBedrockConverse + BedrockEmbeddings + MemoryVectorStore
                             #   → less code, built-in streaming/batching, composable chains
                             #   → good if you want to prototype faster
```

### Setup Your Environment Variables

Before running any example, you need to configure your credentials and settings.

**1. Copy the template:**
```bash
cp .env.example .env
```

**2. Open `.env` and fill in your values:**

```dotenv
# Required for all examples:

AWS_ACCESS_KEY_ID=            # starts with ASIA... (from SSO) or AKIA... (long-lived)
AWS_SECRET_ACCESS_KEY=        # the secret that pairs with your key ID
AWS_DEFAULT_REGION=eu-central-1

# Required for bedrock examples:
BEDROCK_CHAT_MODEL=eu.anthropic.claude-sonnet-4-6       # Claude — used for text generation
BEDROCK_EMBEDDING_MODEL=amazon.titan-embed-text-v2:0    # Titan — used to convert text into vectors

# Required for s3 examples:
S3_BUCKET=hackathon-team-XX-data        # regular object storage (files, JSON, CSVs...)

# Required for rag examples:
S3_VECTOR_BUCKET=hackathon-team-XX-vectors   # vector bucket (separate from regular S3)
S3_VECTOR_INDEX=knowledge-base               # name of the vector index inside the bucket
S3_VECTOR_DIMENSIONS=1024                    # must match the embedding model's output (Titan v2 = 1024)
```

**How it works:** The `config.ts` file loads these variables using `dotenv` and exports them as a typed object. Every example imports `config`, so you configure once, and all scripts pick it up automatically. If a required variable is missing, the script will fail fast with a clear error telling you which one.

> 💡 **You don't need to fill in everything right away.** If you only want to run `npm run bedrock`, you just need the AWS credentials and `BEDROCK_CHAT_MODEL`.

---


### Bedrock — Model Invocation
Invoke Claude on Bedrock with simple and streaming modes.

```bash
npm run bedrock
```

**What it does:**
- Sends a prompt to LLM (Nova in this case) via `InvokeModelCommand`
- Streams a response via `InvokeModelWithResponseStreamCommand`

**Expected output:**
```
Using model: eu.amazon.nova-pro-v1:0
Region:      eu-central-1

=== Simple invocation ===
A hackathon is an event where participants collaborate intensively...

=== Streaming invocation ===
1. An AI-powered personal finance advisor...
2. A real-time translation tool...
3. An automated accessibility checker...
```

To know more about Bedrock client SDK, see [Bedrock Javascript V3 SDK Documentation](https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/client/bedrock/)

### S3 — Object Storage
Upload and download objects from S3.



> **Prerequisite:** Create an S3 bucket in the [AWS Console](https://s3.console.aws.amazon.com/s3/buckets) then set its name in your `.env`:
> ```dotenv
> S3_BUCKET=hackathon-team-data (or whatever name you prefer)
> ```
> To create a bucket via AWS CLI:
> ```bash
> aws s3 mb s3://hackathon-team-data --region eu-central-1
> ```
> Be aware that S3 Bucket names need to be unique across all AWS accounts, therefore if you get error when creating a bucket, this might be a reason. Try to set a S3 bucket name specific enough.
> Edit `S3_BUCKET` in `.env` to point to your team's bucket.

```bash
npm run s3
```

**What it does:**
- Uploads a JSON object to your team's S3 bucket
- Downloads and prints it back

**Expected output:**
```
✅ Uploaded results/output.json
✅ Downloaded: {"score":42}
```

To know more about S3 client SDK, see [S3 Javascript V3 SDK Documentation](https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/client/s3/)


### RAG — Retrieval Augmented Generation with S3 Vectors
Full RAG pipeline: embed documents → store in S3 Vectors → semantic search → answer with Claude.

```bash
npm run rag
```

**What it does:**
1. Creates a vector bucket and index (skips if they already exist)
2. Embeds sample documents using Amazon Titan Embeddings v2
3. Stores vectors in S3 Vectors via `PutVectorsCommand`
4. Runs a semantic search with `QueryVectorsCommand`
5. Feeds retrieved context to Claude to generate an answer

**Expected output:**
```
ℹ️  Vector bucket already exists: hackathon-team-01-vectors
ℹ️  Index already exists: knowledge-base
✅ Ingested 4 documents

=== RAG Query ===
Question: How can I run code without managing servers on AWS?

Retrieved context:
  [1] AWS Lambda is a serverless compute service...
  [2] Amazon Bedrock is a fully managed service...

Answer:
Based on the context, AWS Lambda allows you to run code without managing servers...

=== Semantic Search ===
- [0.1234] doc-s3
- [0.2345] doc-bedrock
- [0.3456] doc-serverless
```

To know more about S3 Vectors client SDK, see [S3 Vectors Javascript V3 SDK Documentation](https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/client/s3vectors/)

### LangChain — RAG with Chains & Streaming
Uses `@langchain/aws` with `ChatBedrockConverse` and `BedrockEmbeddings` to build a RAG chain the "LangChain way".

```bash
npm run langchain
```

**What it does:**
1. Simple invocation via `ChatBedrockConverse` (uses the Converse API — supports tool calling)
2. Streaming response (token by token)
3. Full RAG chain: `question → embed → retrieve → prompt → Claude → answer`
4. Streaming RAG (same chain, but streamed)

**Expected output:**
```
Chat model: eu.amazon.nova-pro-v1:0
Embed model: amazon.titan-embed-text-v2:0
Region:      eu-central-1

=== Simple LangChain Invocation ===
RAG (Retrieval Augmented Generation) is a technique that...

=== Streaming Response ===
1. Amazon Bedrock - access foundation models via API...

=== RAG Chain ===
Question: How can I run code without managing servers on AWS?

Retrieved documents:
  - [compute] AWS Lambda is a serverless compute service...
  - [ai] Amazon Bedrock is a fully managed service...

Answer:
Based on the context, AWS Lambda allows you to run code...

=== Streaming RAG ===
Question: What is Amazon Bedrock and what can I use it for?

Answer:
Amazon Bedrock is a fully managed service that provides...
```

**Why LangChain?**

LangChain abstracts the "embed → retrieve → prompt → generate" loop into composable pieces. Instead of manually calling `InvokeModelCommand`, formatting prompts, and parsing responses, you build a **chain** that handles it all:

```typescript
// Without LangChain (manual SDK calls):
const embedding = await bedrock.send(new InvokeModelCommand({ ... }));
const results = await s3v.send(new QueryVectorsCommand({ ... }));
const answer = await bedrock.send(new InvokeModelCommand({ ... }));

// With LangChain (composable chain):
const chain = retriever.pipe(formatDocs).pipe(prompt).pipe(llm).pipe(parser);
const answer = await chain.invoke("my question");
```

Both approaches work — use whichever fits your team's style. The raw SDK gives you full control; LangChain gives you faster prototyping and built-in streaming/batching.

---

## How It Works — For Node.js / Express Developers

If you normally build backends with Express, here's how the AWS SDK fits in. There is **no special server or framework** — you just import the SDK clients, call them like any async function, and return the results from your routes.

### The mental model

```
Your Express app                      AWS
┌─────────────────┐                ┌──────────────┐
│  POST /ask       │  ──SDK call──▶│  Bedrock      │ (Claude)
│  POST /search    │  ──SDK call──▶│  S3 Vectors   │ (vector search)
│  GET  /files/:id │  ──SDK call──▶│  S3           │ (file storage)
└─────────────────┘                └──────────────┘
```

The AWS SDK clients (`BedrockRuntimeClient`, `S3VectorsClient`, `S3Client`) work exactly like an HTTP client (e.g., `axios`) — you create an instance, call `client.send(command)`, and `await` the result. No sockets, no WebSocket, no special protocol. It's just HTTPS under the hood, signed with your AWS credentials.

### Example: Express + Bedrock + S3 Vectors

Below is a minimal Express server that exposes two endpoints — one for asking questions (RAG), one for ingesting documents. You can adapt this as the starting point for your hackathon backend.

```typescript
// server.ts
import express from "express";
import {
  BedrockRuntimeClient,
  InvokeModelCommand,
} from "@aws-sdk/client-bedrock-runtime";
import {
  S3VectorsClient,
  PutVectorsCommand,
  QueryVectorsCommand,
} from "@aws-sdk/client-s3vectors";
import "dotenv/config";

const app = express();
app.use(express.json());

// ─── Create SDK clients once (reuse across requests) ───
const bedrock = new BedrockRuntimeClient({ region: "eu-central-1" });
const s3v = new S3VectorsClient({ region: "eu-central-1" });

const CHAT_MODEL = process.env.BEDROCK_CHAT_MODEL ?? "eu.anthropic.claude-sonnet-4-6";
const EMBED_MODEL = process.env.BEDROCK_EMBEDDING_MODEL ?? "amazon.titan-embed-text-v2:0";
const VECTOR_BUCKET = process.env.S3_VECTOR_BUCKET ?? "hackathon-team-XX-vectors";
const VECTOR_INDEX = process.env.S3_VECTOR_INDEX ?? "knowledge-base";

// ─── Helper: generate an embedding ───
async function embed(text: string): Promise<number[]> {
  const res = await bedrock.send(new InvokeModelCommand({
    modelId: EMBED_MODEL,
    contentType: "application/json",
    accept: "application/json",
    body: JSON.stringify({ inputText: text }),
  }));
  const body = JSON.parse(new TextDecoder().decode(res.body));
  return body.embedding;
}

// ─── POST /ask — RAG: search + generate ───
app.post("/ask", async (req, res) => {
  try {
    const { question } = req.body;
    if (!question) return res.status(400).json({ error: "question is required" });

    // 1. Embed the question
    const queryVector = await embed(question);

    // 2. Search S3 Vectors
    const searchResult = await s3v.send(new QueryVectorsCommand({
      vectorBucketName: VECTOR_BUCKET,
      indexName: VECTOR_INDEX,
      queryVector: { float32: queryVector },
      topK: 3,
      returnMetadata: true,
    }));

    const context = (searchResult.vectors ?? [])
      .map((v: any, i: number) => `[${i + 1}] ${v.metadata?.source_text ?? ""}`)
      .join("\n\n");

    // 3. Generate answer with Claude
    const payload = {
      anthropic_version: "bedrock-2023-05-31",
      max_tokens: 1024,
      system: `Answer based ONLY on this context:\n${context}`,
      messages: [{ role: "user", content: question }],
    };

    const llmResult = await bedrock.send(new InvokeModelCommand({
      modelId: CHAT_MODEL,
      contentType: "application/json",
      accept: "application/json",
      body: JSON.stringify(payload),
    }));

    const answer = JSON.parse(new TextDecoder().decode(llmResult.body));
    res.json({ answer: answer.content[0].text, sources: searchResult.vectors });

  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// ─── POST /ingest — Store documents as vectors ───
app.post("/ingest", async (req, res) => {
  try {
    const { documents } = req.body;
    // documents: [{ key: "doc-1", text: "...", metadata: { ... } }]

    const vectors = [];
    for (const doc of documents) {
      const embedding = await embed(doc.text);
      vectors.push({
        key: doc.key,
        data: { float32: embedding },
        metadata: { source_text: doc.text, ...doc.metadata },
      });
    }

    await s3v.send(new PutVectorsCommand({
      vectorBucketName: VECTOR_BUCKET,
      indexName: VECTOR_INDEX,
      vectors,
    }));

    res.json({ ingested: vectors.length });

  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.listen(3000, () => console.log("🚀 Server running on http://localhost:3000"));
```

**Install extra deps for the server:**
```bash
npm install express
npm install -D @types/express
```

**Run it:**
```bash
npx tsx server.ts
```

**Test it:**
```bash
# Ingest documents
curl -X POST http://localhost:3000/ingest \
  -H "Content-Type: application/json" \
  -d '{"documents": [{"key": "doc-1", "text": "Lambda runs code without servers", "metadata": {"category": "compute"}}]}'

# Ask a question
curl -X POST http://localhost:3000/ask \
  -H "Content-Type: application/json" \
  -d '{"question": "How do I run code without servers?"}'
```

### Key takeaways for Express developers

1. **The SDK is just a library.** Import it, create a client, call `.send()`. Same pattern as calling any external API.
2. **Create clients once** at the top of your app, not inside each request handler. The SDK manages connection pooling for you.
3. **Credentials come from environment variables.** The SDK automatically reads `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY` — you don't pass them to the client constructor.
4. **Model IDs are now inference profile IDs.** Use `eu.anthropic.claude-sonnet-4-6` (not the old `anthropic.claude-3-5-sonnet-...` format). The `eu.` prefix ensures data stays in EU regions.
5. **Embeddings + vector search replaces your typical database query.** Instead of `SELECT * FROM docs WHERE ...`, you embed the query text and ask S3 Vectors for the nearest vectors.

---

## Troubleshooting

| Problem | Solution |
|---|---|
| `ExpiredTokenException` | SSO session expired. Re-copy credentials from the portal |
| `on-demand throughput isn't supported` | You're using a raw model ID. Add `eu.` / `us.` / `global.` prefix (see Inference Profiles section above) |
| `AccessDeniedException` on Bedrock | Model not enabled. Ask organizers to enable it in Bedrock console → Model access |
| `ResourceNotFoundException` on S3 Vectors | Run `npm run rag` — it creates the bucket and index automatically |
| `ValidationException: dimension mismatch` | Titan v2 uses 1024 dimensions by default. Make sure your index matches |
| `MODULE_NOT_FOUND` | Run `npm install` first |
| `ERR_UNKNOWN_FILE_EXTENSION .ts` | Use `npm run <script>` (uses `tsx`), not `node` directly |