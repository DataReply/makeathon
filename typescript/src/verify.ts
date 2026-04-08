/**
 * Verify Credentials — Check that your .env credentials work
 *
 * This script loads your .env file (via dotenv) and calls AWS STS
 * to verify the credentials are valid. Use this when you've configured
 * credentials via .env (Option C) and can't use `aws sts get-caller-identity`.
 *
 * Run:  npm run verify
 */

import "dotenv/config";
import { STSClient, GetCallerIdentityCommand } from "@aws-sdk/client-sts";

async function main() {
  const region = process.env.AWS_DEFAULT_REGION ?? "eu-central-1";

  console.log("🔍 Checking credentials from .env...\n");

  // Show which credential source is being used (without revealing secrets)
  const keyId = process.env.AWS_ACCESS_KEY_ID;
  const hasSecret = !!process.env.AWS_SECRET_ACCESS_KEY;
  const hasToken = !!process.env.AWS_SESSION_TOKEN;

  if (!keyId) {
    console.error("❌ AWS_ACCESS_KEY_ID is not set.");
    console.error("   Copy .env.example to .env and fill in your credentials.");
    process.exit(1);
  }

  console.log(`  AWS_ACCESS_KEY_ID:     ${keyId.slice(0, 8)}...${keyId.slice(-4)}`);
  console.log(`  AWS_SECRET_ACCESS_KEY: ${hasSecret ? "✅ set" : "❌ missing"}`);
  console.log(`  AWS_SESSION_TOKEN:     ${hasToken ? "✅ set (temporary creds)" : "– not set (long-lived keys)"}`);
  console.log(`  AWS_DEFAULT_REGION:    ${region}\n`);

  const sts = new STSClient({ region });

  try {
    const identity = await sts.send(new GetCallerIdentityCommand({}));

    console.log("✅ Credentials are valid!\n");
    console.log(`  Account: ${identity.Account}`);
    console.log(`  UserId:  ${identity.UserId}`);
    console.log(`  Arn:     ${identity.Arn}`);

    // Hint about the identity type
    if (identity.Arn?.includes("assumed-role")) {
      console.log("\n  → You're using SSO / assumed role credentials.");
    } else if (identity.Arn?.includes(":user/")) {
      console.log("\n  → You're using IAM user credentials (long-lived keys).");
    }
  } catch (err: unknown) {
    const error = err as { name?: string; message?: string };

    console.error("❌ Credential check failed!\n");

    if (error.name === "ExpiredTokenException") {
      console.error("  Your session token has expired.");
      console.error("  → Go to the SSO portal and copy fresh credentials into .env");
    } else if (error.name === "InvalidClientTokenId") {
      console.error("  The access key ID is invalid or doesn't exist.");
      console.error("  → Double-check that you copied it correctly into .env");
    } else if (error.name === "SignatureDoesNotMatch") {
      console.error("  The secret access key doesn't match the access key ID.");
      console.error("  → Make sure you copied both values from the same credential set");
    } else {
      console.error(`  ${error.name}: ${error.message}`);
    }

    process.exit(1);
  }
}

main();