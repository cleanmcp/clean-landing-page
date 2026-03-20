import { readFileSync } from "fs";
import { resolve } from "path";
import { neon } from "@neondatabase/serverless";

const envPath = resolve(__dirname, "../.env.local");
try {
  const envContent = readFileSync(envPath, "utf-8");
  for (const line of envContent.split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const i = t.indexOf("=");
    if (i === -1) continue;
    const k = t.slice(0, i).trim(), v = t.slice(i + 1).trim();
    if (!process.env[k]) process.env[k] = v;
  }
} catch {}

const sql = neon(process.env.DATABASE_URL!);

async function main() {
  const before = await sql`SELECT count(*)::int as c FROM search_logs WHERE repo LIKE 'acme/%'`;
  console.log(`Found ${before[0].c} rows matching repo LIKE 'acme/%'`);

  await sql`DELETE FROM search_logs WHERE repo LIKE 'acme/%'`;

  const after = await sql`SELECT count(*)::int as c FROM search_logs WHERE repo LIKE 'acme/%'`;
  console.log(`Deleted ${before[0].c - after[0].c} rows. Remaining: ${after[0].c}`);
}

main().catch((err) => { console.error(err); process.exit(1); });
