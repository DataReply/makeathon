/**
 * RAG Example — Retrieval Augmented Generation with S3 Vectors
 *
 * Full pipeline:
 *   1. Create a vector bucket & index (idempotent — safe to re-run)
 *   2. Generate embeddings with Amazon Titan Text Embeddings v2
 *   3. Store vectors in S3 Vectors (PutVectorsCommand)
 *   4. Semantic search (QueryVectorsCommand)
 *   5. Generate an answer with Claude using retrieved context
 *
 * NOTE: The chat model must be an inference profile ID (e.g. eu.anthropic.claude-sonnet-4-6).
 *       The embedding model (amazon.titan-embed-text-v2:0) still uses the regular model ID.
 *
 * Run:  npm run rag
 */

import {
  S3VectorsClient,
  CreateVectorBucketCommand,
  CreateIndexCommand,
  PutVectorsCommand,
  QueryVectorsCommand,
} from "@aws-sdk/client-s3vectors";
import {
  BedrockRuntimeClient,
  ConverseCommand,
  InvokeModelCommand,
} from "@aws-sdk/client-bedrock-runtime";
import { config } from "./config.js";

const s3v = new S3VectorsClient({ region: config.region });
const bedrock = new BedrockRuntimeClient({ region: config.region });

// ─── Types ──────────────────────────────────────────────────────────────────

interface Document {
  key: string;
  text: string;
  metadata?: Record<string, string>;
}

interface VectorResult {
  key?: string;
  distance?: number;
  metadata?: Record<string, unknown>;
}

// ─── Step 1: Setup vector store (idempotent) ────────────────────────────────

async function setupVectorStore(): Promise<void> {
  // Create vector bucket
  try {
    await s3v.send(
      new CreateVectorBucketCommand({
        vectorBucketName: config.vectorBucket,
      })
    );
    console.log(`✅ Created vector bucket: ${config.vectorBucket}`);
  } catch (e: unknown) {
    const err = e as { name?: string };
    if (
      err.name === "BucketAlreadyExists" ||
      err.name === "ConflictException"
    ) {
      console.log(`ℹ️  Vector bucket already exists: ${config.vectorBucket}`);
    } else {
      throw e;
    }
  }

  // Create index
  try {
    await s3v.send(
      new CreateIndexCommand({
        vectorBucketName: config.vectorBucket,
        indexName: config.vectorIndex,
        dataType: "float32",
        dimension: config.vectorDimensions,
        distanceMetric: "cosine",
      })
    );
    console.log(`✅ Created index: ${config.vectorIndex}`);
  } catch (e: unknown) {
    const err = e as { name?: string };
    if (err.name === "ConflictException") {
      console.log(`ℹ️  Index already exists: ${config.vectorIndex}`);
    } else {
      throw e;
    }
  }
}

// ─── Step 2: Generate embeddings via Bedrock ────────────────────────────────

async function embed(text: string): Promise<number[]> {
  const response = await bedrock.send(
    new InvokeModelCommand({
      modelId: config.embeddingModel,
      contentType: "application/json",
      accept: "application/json",
      body: JSON.stringify({ inputText: text }),
    })
  );

  const body = JSON.parse(new TextDecoder().decode(response.body));
  return body.embedding as number[];
}

// ─── Step 3: Ingest documents ───────────────────────────────────────────────

async function ingestDocuments(docs: Document[]): Promise<void> {
  const vectors = [];

  for (const doc of docs) {
    const embedding = await embed(doc.text);
    vectors.push({
      key: doc.key,
      data: { float32: embedding },
      metadata: {
        source_text: doc.text,
        ...(doc.metadata ?? {}),
      },
    });
  }

  await s3v.send(
    new PutVectorsCommand({
      vectorBucketName: config.vectorBucket,
      indexName: config.vectorIndex,
      vectors,
    })
  );

  console.log(`✅ Ingested ${vectors.length} documents`);
}

// ─── Step 4: Semantic search ────────────────────────────────────────────────

async function search(
  query: string,
  topK = 3
): Promise<VectorResult[]> {
  const queryEmbedding = await embed(query);

  const response = await s3v.send(
    new QueryVectorsCommand({
      vectorBucketName: config.vectorBucket,
      indexName: config.vectorIndex,
      queryVector: { float32: queryEmbedding },
      topK,
      returnDistance: true,
      returnMetadata: true,
    })
  );

  return (response.vectors ?? []) as VectorResult[];
}

// ─── Step 5: RAG — Search + Generate ────────────────────────────────────────

async function rag(question: string): Promise<string> {
  // Retrieve
  const results = await search(question, 3);

  const context = results
    .map(
      (r, i) =>
        `[${i + 1}] ${(r.metadata?.source_text as string) ?? "(no text)"}`
    )
    .join("\n\n");

  console.log(`\nRetrieved context:`);
  results.forEach((r, i) => {
    const preview = (r.metadata?.source_text as string)?.slice(0, 80) ?? "";
    console.log(`  [${i + 1}] ${preview}...`);
  });

  // Generate
  const command = new ConverseCommand({
    modelId: config.chatModel,
    system: [
      {
        text: [
          "You are a helpful assistant.",
          "Answer the user's question based ONLY on the following context.",
          "If the context doesn't contain the answer, say so.\n",
          `Context:\n${context}`,
        ].join(" "),
      },
    ],
    messages: [{ role: "user", content: [{ text: question }] }],
    inferenceConfig: {
      maxTokens: 1024,
    },
  });

  const response = await bedrock.send(command);
  const textBlock = response.output?.message?.content?.find(
    (block) => "text" in block
  );
  return textBlock?.text ?? "(no response)";
}

// ─── Main: Demo ─────────────────────────────────────────────────────────────

async function main() {
  console.log(`Vector bucket: ${config.vectorBucket}`);
  console.log(`Vector index:  ${config.vectorIndex}`);
  console.log(`Chat model:    ${config.chatModel}`);
  console.log(`Embed model:   ${config.embeddingModel}`);
  console.log(`Region:        ${config.region}\n`);

  // 1. Setup (idempotent — safe to re-run)
  await setupVectorStore();

  // 2. Ingest sample documents
  await ingestDocuments([
    {
      key: "doc-serverless",
      text: "AWS Lambda is a serverless compute service that runs your code in response to events. You pay only for the compute time you consume. Lambda supports Node.js, Python, Java, Go, and more.",
      metadata: { category: "compute" },
    },
    {
      key: "doc-s3",
      text: "Amazon S3 is an object storage service offering scalability, data availability, security, and performance. S3 Vectors is a new feature that adds native vector storage and similarity search to S3.",
      metadata: { category: "storage" },
    },
    {
      key: "doc-bedrock",
      text: "Amazon Bedrock is a fully managed service that offers foundation models from AI companies like Anthropic, Meta, and Amazon via a single API. You can use it for text generation, embeddings, and image generation.",
      metadata: { category: "ai" },
    },
    {
      key: "doc-iam",
      text: "AWS IAM lets you manage access to AWS services and resources securely. You can create users, groups, roles, and policies to control who can do what in your AWS account.",
      metadata: { category: "security" },
    },
  ]);

  // 3. RAG query
  console.log("\n=== RAG Query ===");
  const question = "How can I run code without managing servers on AWS?";
  console.log(`Question: ${question}`);
  const answer = await rag(question);
  console.log(`\nAnswer:\n${answer}`);

  // 4. Pure semantic search (different query to show it returns different results)
  console.log("\n=== Semantic Search ===");
  const searchQuery = "vector database for AI";
  console.log(`Query: "${searchQuery}"\n`);
  console.log("Results (lower distance = more similar):");
  const results = await search(searchQuery);
  for (const r of results) {
    const preview = (r.metadata?.source_text as string)?.slice(0, 60) ?? "";
    console.log(`  ${r.distance?.toFixed(4) ?? "?"} | ${r.key} — ${preview}...`);
  }
}

main().catch((err) => {
  console.error("❌ Error:", err.message ?? err);
  process.exit(1);
});