/**
 * LangChain + Bedrock RAG Example
 *
 * Uses the official @langchain/aws package with:
 *   - ChatBedrockConverse  → Claude chat (Converse API, supports tool calling)
 *   - BedrockEmbeddings    → Titan embeddings
 *   - MemoryVectorStore    → in-memory vector store (swap for S3 Vectors / FAISS in production)
 *
 * This shows how LangChain abstracts the AWS SDK calls into a clean chain:
 *   question → embed → retrieve → prompt → Claude → answer
 *
 * NOTE: The model ID must be an inference profile ID (e.g. eu.anthropic.claude-sonnet-4-6).
 *
 * Run:  npm run langchain
 */

import { ChatBedrockConverse } from "@langchain/aws";
import { BedrockEmbeddings } from "@langchain/aws";
import { MemoryVectorStore } from "@langchain/classic/vectorstores/memory";
import { Document } from "@langchain/core/documents";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import {
  RunnablePassthrough,
  RunnableSequence,
} from "@langchain/core/runnables";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { config } from "./config.js";

// ─── 1. Initialize models ──────────────────────────────────────────────────

const llm = new ChatBedrockConverse({
  model: config.chatModel, // e.g. "eu.anthropic.claude-sonnet-4-6"
  region: config.region,
  maxTokens: 1024,
  temperature: 0.3,
  // Credentials are picked up automatically from env vars:
  //   AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_SESSION_TOKEN
});

const embeddings = new BedrockEmbeddings({
  model: config.embeddingModel, // "amazon.titan-embed-text-v2:0"
  region: config.region,
});

// ─── 2. Create a vector store with sample documents ─────────────────────────

const docs = [
  new Document({
    pageContent:
      "AWS Lambda is a serverless compute service that runs your code in response to events. You pay only for the compute time you consume. Lambda supports Node.js, Python, Java, Go, and more.",
    metadata: { source: "aws-docs", category: "compute" },
  }),
  new Document({
    pageContent:
      "Amazon S3 is an object storage service. S3 Vectors is a new feature that adds native vector storage and similarity search directly to S3, reducing costs by up to 90% compared to dedicated vector databases.",
    metadata: { source: "aws-blog", category: "storage" },
  }),
  new Document({
    pageContent:
      "Amazon Bedrock is a fully managed service that offers foundation models from AI companies like Anthropic, Meta, and Amazon via a single API. You can use it for text generation, embeddings, and image generation.",
    metadata: { source: "aws-docs", category: "ai" },
  }),
  new Document({
    pageContent:
      "AWS IAM lets you manage access to AWS services and resources securely. You can create users, groups, roles, and policies to control who can do what in your AWS account.",
    metadata: { source: "aws-docs", category: "security" },
  }),
  new Document({
    pageContent:
      "Amazon SageMaker is a fully managed machine learning platform. You can build, train, and deploy ML models quickly. SageMaker Notebooks provide Jupyter environments with pre-installed libraries.",
    metadata: { source: "aws-docs", category: "ml" },
  }),
];

// ─── 3. Build the RAG chain ─────────────────────────────────────────────────

async function buildRagChain() {
  // Create an in-memory vector store from the documents
  // (In production, swap this for S3 Vectors or FAISS)
  const vectorStore = await MemoryVectorStore.fromDocuments(docs, embeddings);

  // Create a retriever that returns the top 3 most similar documents
  const retriever = vectorStore.asRetriever({ k: 3 });

  // Define the prompt template
  const prompt = ChatPromptTemplate.fromTemplate(`
You are a helpful assistant for a hackathon team working with AWS.
Answer the question based ONLY on the following context.
If the context doesn't contain the answer, say you don't have enough information.

Context:
{context}

Question: {question}
`);

  // Helper to format retrieved docs into a single string
  function formatDocs(retrievedDocs: Document[]): string {
    return retrievedDocs
      .map((doc, i) => `[${i + 1}] ${doc.pageContent}`)
      .join("\n\n");
  }

  // Build the chain: question → retrieve + passthrough → prompt → llm → parse
  const chain = RunnableSequence.from([
    {
      context: retriever.pipe(formatDocs),
      question: new RunnablePassthrough(),
    },
    prompt,
    llm,
    new StringOutputParser(),
  ]);

  return { chain, retriever };
}

// ─── 4. Demo: simple invocation ─────────────────────────────────────────────

async function demoSimpleInvocation() {
  console.log("=== Simple LangChain Invocation ===\n");

  const response = await llm.invoke([
    ["system", "You are a helpful hackathon mentor. Be concise."],
    ["human", "What is RAG and why is it useful?"],
  ]);

  console.log(response.content);
  console.log(`\nTokens: ${JSON.stringify(response.usage_metadata)}\n`);
}

// ─── 5. Demo: streaming ─────────────────────────────────────────────────────

async function demoStreaming() {
  console.log("=== Streaming Response ===\n");

  const stream = await llm.stream([
    ["system", "You are a helpful assistant. Keep answers short."],
    ["human", "List 3 AWS services useful for AI projects."],
  ]);

  for await (const chunk of stream) {
    process.stdout.write(String(chunk.content));
  }
  console.log("\n");
}

// ─── 6. Demo: RAG chain ─────────────────────────────────────────────────────

async function demoRag() {
  console.log("=== RAG Chain ===\n");

  const { chain, retriever } = await buildRagChain();

  const question = "How can I run code without managing servers on AWS?";
  console.log(`Question: ${question}\n`);

  // Show what was retrieved
  const retrieved = await retriever.invoke(question);
  console.log("Retrieved documents:");
  for (const doc of retrieved) {
    console.log(`  - [${doc.metadata.category}] ${doc.pageContent.slice(0, 80)}...`);
  }

  // Run the full chain
  console.log("\nAnswer:");
  const answer = await chain.invoke(question);
  console.log(answer);
}

// ─── 7. Demo: streaming RAG ─────────────────────────────────────────────────

async function demoStreamingRag() {
  console.log("\n=== Streaming RAG ===\n");

  const { chain } = await buildRagChain();

  const question = "What is Amazon Bedrock and what can I use it for?";
  console.log(`Question: ${question}\n`);

  console.log("Answer:");
  const stream = await chain.stream(question);
  for await (const chunk of stream) {
    process.stdout.write(chunk);
  }
  console.log("\n");
}

// ─── Main ───────────────────────────────────────────────────────────────────

async function main() {
  console.log(`Chat model: ${config.chatModel}`);
  console.log(`Embed model: ${config.embeddingModel}`);
  console.log(`Region:      ${config.region}\n`);

  await demoSimpleInvocation();
  await demoStreaming();
  await demoRag();
  await demoStreamingRag();
}

main().catch((err) => {
  console.error("❌ Error:", err.message ?? err);
  process.exit(1);
});