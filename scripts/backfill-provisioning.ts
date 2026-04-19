/**
 * One-shot backfill for orgs that slipped through broken provisioning.
 *
 * Before fix/provisioning-and-dashboard, `/api/stripe/free` was never called
 * on signup, leaving ~90% of orgs with licenseKey=NULL + creditBalance=0 +
 * creditPeriodStart=NULL. New signups are self-healed via getAuthContext now,
 * but existing users don't re-authenticate frequently enough to recover.
 *
 * This script calls the same idempotent `provisionFreeTier()` helper for every
 * affected org. Reuses existing license if present; only seeds credits when
 * credit_period_start is null, so it never resets a partially-consumed balance.
 *
 * Usage:
 *   npx tsx scripts/backfill-provisioning.ts              # dry run
 *   npx tsx scripts/backfill-provisioning.ts --apply      # actually update
 *
 * Reads DATABASE_URL and CLEAN_LICENSE_PRIVATE_KEY from .env.local.
 */

import "dotenv/config";
import { readFileSync } from "fs";
import { resolve } from "path";

// Load .env.local (same pattern as existing scripts)
const envLocalPath = resolve(__dirname, "../.env.local");
try {
  const envContent = readFileSync(envLocalPath, "utf-8");
  for (const line of envContent.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx === -1) continue;
    const key = trimmed.substring(0, eqIdx).trim();
    let value = trimmed.substring(eqIdx + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = value;
  }
} catch (err) {
  console.warn("Could not load .env.local:", (err as Error).message);
}

import { db } from "../lib/db";
import { organizations } from "../lib/db/schema";
import { isNull, or, eq } from "drizzle-orm";
import { provisionFreeTier } from "../lib/provision";

const APPLY = process.argv.includes("--apply");

async function main() {
  console.log(APPLY ? "=== APPLY MODE ===" : "=== DRY RUN (pass --apply to execute) ===");

  const affected = await db
    .select({
      id: organizations.id,
      slug: organizations.slug,
      tier: organizations.tier,
      licenseKey: organizations.licenseKey,
      creditBalance: organizations.creditBalance,
      creditPeriodStart: organizations.creditPeriodStart,
    })
    .from(organizations)
    .where(
      or(
        isNull(organizations.licenseKey),
        isNull(organizations.creditPeriodStart),
      ),
    );

  // Group by tier for reporting
  const byTier: Record<string, number> = {};
  for (const o of affected) byTier[o.tier ?? "null"] = (byTier[o.tier ?? "null"] ?? 0) + 1;
  console.log(`Found ${affected.length} orgs needing backfill:`, byTier);

  // For non-free tiers, we won't touch them here — paid tiers should be
  // re-provisioned via the Stripe webhook path (one-time customer.subscription.updated),
  // not by granting free-tier credits. Log them so a human can decide.
  const freeOrNull = affected.filter((o) => o.tier == null || o.tier === "free");
  const paid = affected.filter((o) => o.tier && o.tier !== "free");

  console.log(`  free/null tier (will provision): ${freeOrNull.length}`);
  console.log(`  paid tier (SKIPPED — needs Stripe resync):`, paid.map((o) => `${o.slug}(${o.tier})`));

  if (!APPLY) {
    console.log("\nDry run. Re-run with --apply to actually provision.");
    process.exit(0);
  }

  let ok = 0,
    fail = 0;
  for (const org of freeOrNull) {
    try {
      const { licenseKey } = await provisionFreeTier(org.id);
      ok++;
      console.log(`  ✓ ${org.slug} — license ${licenseKey.slice(0, 20)}…`);
    } catch (err) {
      fail++;
      console.error(`  ✗ ${org.slug} — ${(err as Error).message}`);
    }
  }

  console.log(`\nDone. Provisioned ${ok} / failed ${fail}.`);

  if (paid.length > 0) {
    console.log(
      `\n⚠️  ${paid.length} paid orgs were skipped. Run Stripe resync or manually provision — do NOT treat them as free.`,
    );
    for (const o of paid) console.log(`   - ${o.slug} (tier=${o.tier}, id=${o.id})`);
  }
}

main().catch((err) => {
  console.error("FATAL:", err);
  process.exit(1);
});
