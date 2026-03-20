/**
 * Seed script: inserts 30 days of fake search_logs data.
 *
 * Usage:
 *   npx tsx scripts/seed-search-logs.ts
 *
 * Reads DATABASE_URL from .env.local
 */

import "dotenv/config";
import { readFileSync } from "fs";
import { resolve } from "path";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { organizations, searchLogs } from "../lib/db/schema";

// Load .env.local manually since dotenv/config only reads .env
const envLocalPath = resolve(__dirname, "../.env.local");
try {
  const envContent = readFileSync(envLocalPath, "utf-8");
  for (const line of envContent.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const value = trimmed.slice(eqIdx + 1).trim();
    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
} catch {
  // .env.local may not exist; rely on DATABASE_URL being set elsewhere
}

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("DATABASE_URL is not set. Check .env.local");
  process.exit(1);
}

const sql = neon(DATABASE_URL);
const db = drizzle(sql);

const REPOS = [
  "acme/backend",
  "acme/frontend",
  "acme/docs",
  "acme/infra",
  "acme/mobile-app",
];

const QUERIES = [
  "authentication flow",
  "payment processing",
  "user permissions",
  "database migration",
  "error handling middleware",
  "rate limiting",
  "caching strategy",
  "API response format",
  "webhook handler",
  "file upload",
  "search indexing",
  "logging setup",
  "env configuration",
  "deploy pipeline",
  "test utilities",
];

function randInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

async function main() {
  // Find the first org to use as our org_id
  const orgs = await db.select({ id: organizations.id }).from(organizations).limit(1);
  if (orgs.length === 0) {
    console.error("No organizations found in the database. Create one first.");
    process.exit(1);
  }
  const orgId = orgs[0].id;
  console.log(`Using org: ${orgId}`);

  const rows: (typeof searchLogs.$inferInsert)[] = [];
  const now = Date.now();

  for (let daysAgo = 29; daysAgo >= 0; daysAgo--) {
    const entriesPerDay = randInt(3, 8);

    for (let j = 0; j < entriesPerDay; j++) {
      // Random time within this day
      const dayStart = now - daysAgo * 86_400_000;
      const offsetMs = randInt(0, 86_400_000 - 1);
      const createdAt = new Date(dayStart - (now % 86_400_000) + offsetMs);

      const jsonChars = randInt(5_000, 50_000);
      // toon_chars = 30-50% of json_chars (the compressed version)
      const ratio = 0.3 + Math.random() * 0.2;
      const toonChars = Math.round(jsonChars * ratio);
      const charsSaved = jsonChars - toonChars;
      // Rough token estimate: ~4 chars per token
      const tokensSavedEst = Math.round(charsSaved / 4);
      const resultCount = randInt(1, 25);
      const durationMs = randInt(80, 600);

      rows.push({
        orgId,
        apiKeyId: null,
        repo: pickRandom(REPOS),
        query: pickRandom(QUERIES),
        resultCount,
        jsonChars,
        toonChars,
        charsSaved,
        tokensSavedEst,
        durationMs,
        createdAt,
      });
    }
  }

  // Insert in batches of 50
  const BATCH = 50;
  let inserted = 0;
  for (let i = 0; i < rows.length; i += BATCH) {
    const batch = rows.slice(i, i + BATCH);
    await db.insert(searchLogs).values(batch);
    inserted += batch.length;
  }

  console.log(`Inserted ${inserted} search_log entries across 30 days.`);
}

main().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
