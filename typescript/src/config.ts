/**
 * Shared configuration for all examples.
 * Loads values from .env file (if present) or falls back to environment variables.
 *
 * Usage:
 *   import { config } from "./config.js";
 *   console.log(config.region); // "eu-central-1"
 */

import "dotenv/config";

function requireEnv(key: string, fallback?: string): string {
  const value = process.env[key] ?? fallback;
  if (!value) {
    console.error(
      `❌ Missing required environment variable: ${key}\n` +
      `   Copy .env.example to .env and fill in your values, ` +
      `or export it in your shell.`
    );
    process.exit(1);
  }
  return value;
}

export const config = {
  // AWS
  region: requireEnv("AWS_DEFAULT_REGION", "eu-central-1"),

  // Bedrock — inference profile IDs (with region prefix like eu. / us. / global.)
  chatModel: requireEnv(
    "BEDROCK_CHAT_MODEL",
    "eu.anthropic.claude-sonnet-4-6"
  ),
  embeddingModel: requireEnv(
    "BEDROCK_EMBEDDING_MODEL",
    "amazon.titan-embed-text-v2:0"
  ),

  // S3
  s3Bucket: requireEnv("S3_BUCKET", "hackathon-team-XX-data"),

  // S3 Vectors
  vectorBucket: requireEnv("S3_VECTOR_BUCKET", "hackathon-team-XX-vectors"),
  vectorIndex: requireEnv("S3_VECTOR_INDEX", "knowledge-base"),
  vectorDimensions: parseInt(
    requireEnv("S3_VECTOR_DIMENSIONS", "1024"),
    10
  ),
} as const;