/**
 * Bedrock Example — Invoke models on Amazon Bedrock
 *
 * Demonstrates:
 *   1. Simple (non-streaming) invocation via the Converse API
 *   2. Streaming invocation (token by token) via ConverseStream
 *
 * The Converse API provides a UNIFIED format that works with ANY Bedrock model
 * (Claude, Nova, Llama, Mistral, etc.) — no need to learn each model's native format.
 *
 * NOTE: Bedrock requires inference profile IDs (e.g. eu.anthropic.claude-sonnet-4-6)
 *       instead of raw model IDs. The prefix (eu./us./global.) controls data routing.
 *       See .env.example for details. See here to get all available Bedrock models:
 *       https://docs.aws.amazon.com/bedrock/latest/userguide/inference-profiles-support.html
 *
 * Run:  npm run bedrock
 */

import {
  BedrockRuntimeClient,
  ConverseCommand,
  ConverseStreamCommand,
} from "@aws-sdk/client-bedrock-runtime";
import { config } from "./config.js";

const client = new BedrockRuntimeClient({ region: config.region });

// ─── Simple invocation (Converse API) ───────────────────────────────────────
// Works with ANY Bedrock model — Claude, Nova, Llama, Mistral, etc.

async function invokeModel(prompt: string): Promise<string> {
  const command = new ConverseCommand({
    modelId: config.chatModel,
    messages: [
      {
        role: "user",
        content: [{ text: prompt }],
      },
    ],
    inferenceConfig: {
      maxTokens: 1024,
      temperature: 0.7,
    },
  });

  const response = await client.send(command);
  // Extract text from the response
  const textBlock = response.output?.message?.content?.find(
    (block) => "text" in block
  );
  return textBlock?.text ?? "(no response)";
}

// ─── Streaming invocation (ConverseStream API) ─────────────────────────────
// Same unified format, but tokens arrive one by one

async function invokeModelStream(prompt: string): Promise<void> {
  const command = new ConverseStreamCommand({
    modelId: config.chatModel,
    messages: [
      {
        role: "user",
        content: [{ text: prompt }],
      },
    ],
    inferenceConfig: {
      maxTokens: 1024,
      temperature: 0.7,
    },
  });

  const response = await client.send(command);

  if (response.stream) {
    for await (const event of response.stream) {
      // Each event can be a different type — we only care about text deltas
      if (event.contentBlockDelta?.delta?.text) {
        process.stdout.write(event.contentBlockDelta.delta.text);
      }
    }
    console.log(); // trailing newline
  }
}

// ─── With a system prompt ───────────────────────────────────────────────────

async function invokeWithSystem(
  systemPrompt: string,
  userPrompt: string
): Promise<string> {
  const command = new ConverseCommand({
    modelId: config.chatModel,
    system: [{ text: systemPrompt }],
    messages: [
      {
        role: "user",
        content: [{ text: userPrompt }],
      },
    ],
    inferenceConfig: {
      maxTokens: 1024,
    },
  });

  const response = await client.send(command);
  const textBlock = response.output?.message?.content?.find(
    (block) => "text" in block
  );
  return textBlock?.text ?? "(no response)";
}

// ─── Main ───────────────────────────────────────────────────────────────────

async function main() {
  console.log(`Using model: ${config.chatModel}`);
  console.log(`Region:      ${config.region}\n`);

  console.log("=== Simple invocation ===");
  const result = await invokeModel(
    "Explain what a hackathon is in 2 sentences."
  );
  console.log(result);

  console.log("\n=== With system prompt ===");
  const guided = await invokeWithSystem(
    "You are a helpful hackathon mentor. Be concise and encouraging.",
    "What should our team focus on in the first hour?"
  );
  console.log(guided);

  console.log("\n=== Streaming invocation ===");
  await invokeModelStream(
    "Give me 3 creative hackathon project ideas for AI."
  );
}

main().catch((err) => {
  console.error("❌ Error:", err.message ?? err);
  process.exit(1);
});