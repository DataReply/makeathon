/**
 * S3 Example — Upload and download objects from Amazon S3
 *
 * Demonstrates:
 *   1. Upload a JSON object (PutObjectCommand)
 *   2. Download and read it back (GetObjectCommand)
 *   3. List objects in a prefix (ListObjectsV2Command)
 *
 * Run:  npm run s3
 */

import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  ListObjectsV2Command,
} from "@aws-sdk/client-s3";
import { config } from "./config.js";

const s3 = new S3Client({ region: config.region });

// ─── Upload ─────────────────────────────────────────────────────────────────

async function upload(key: string, data: unknown): Promise<void> {
  await s3.send(
    new PutObjectCommand({
      Bucket: config.s3Bucket,
      Key: key,
      Body: JSON.stringify(data, null, 2),
      ContentType: "application/json",
    })
  );
  console.log(`✅ Uploaded ${key} to ${config.s3Bucket}`);
}

// ─── Download ───────────────────────────────────────────────────────────────

async function download(key: string): Promise<string> {
  const response = await s3.send(
    new GetObjectCommand({
      Bucket: config.s3Bucket,
      Key: key,
    })
  );

  const text = (await response.Body?.transformToString()) ?? "";
  console.log(`✅ Downloaded ${key}: ${text}`);
  return text;
}

// ─── List objects ───────────────────────────────────────────────────────────

async function listObjects(prefix: string): Promise<void> {
  const response = await s3.send(
    new ListObjectsV2Command({
      Bucket: config.s3Bucket,
      Prefix: prefix,
    })
  );

  const keys = response.Contents?.map((obj) => obj.Key) ?? [];
  console.log(`📂 Objects in s3://${config.s3Bucket}/${prefix}:`);
  for (const key of keys) {
    console.log(`   - ${key}`);
  }

  if (keys.length === 0) {
    console.log("   (empty)");
  }
}

// ─── Main ───────────────────────────────────────────────────────────────────

async function main() {
  console.log(`Bucket: ${config.s3Bucket}`);
  console.log(`Region: ${config.region}\n`);

  // Upload
  await upload("results/output.json", {
    score: 42,
    team: "team-01",
    timestamp: new Date().toISOString(),
  });

  // Download
  await download("results/output.json");

  // List
  await listObjects("results/");
}

main().catch((err) => {
  console.error("❌ Error:", err.message ?? err);
  process.exit(1);
});