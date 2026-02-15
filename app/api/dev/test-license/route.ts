import { NextResponse } from "next/server";
import { generateLicenseKey } from "@/lib/license";
import { db } from "@/lib/db";
import { organizations, orgTokens } from "@/lib/db/schema";
import { generateOrgToken } from "@/lib/org-tokens";
import { eq, and, isNull } from "drizzle-orm";

// GET /api/dev/test-license?slug=acme-corp&tier=enterprise&months=120
//
// Generates a maxed-out license key, stores it on the org, and
// auto-provisions an org token if one doesn't exist.
// Protected by CLEAN_DEV_MODE env var — returns 404 in production.

export async function GET(request: Request) {
  if (process.env.CLEAN_DEV_MODE !== "true") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const url = new URL(request.url);
  const slug = url.searchParams.get("slug") ?? "test-org";
  const tier = url.searchParams.get("tier") ?? "enterprise";
  const months = parseInt(url.searchParams.get("months") ?? "120", 10);

  // Generate license
  const licenseKey = generateLicenseKey({ customerId: slug, tier, months });

  // Find or create org
  let [org] = await db
    .select()
    .from(organizations)
    .where(eq(organizations.slug, slug))
    .limit(1);

  if (!org) {
    const [created] = await db
      .insert(organizations)
      .values({
        name: slug,
        slug,
        licenseKey,
        tier: tier as "free" | "pro" | "enterprise",
      })
      .returning();
    org = created;
  } else {
    await db
      .update(organizations)
      .set({
        licenseKey,
        tier: tier as "free" | "pro" | "enterprise",
      })
      .where(eq(organizations.id, org.id));
  }

  // Auto-provision org token if missing
  let tokenInfo;
  const [existing] = await db
    .select({ id: orgTokens.id })
    .from(orgTokens)
    .where(and(eq(orgTokens.orgId, org.id), isNull(orgTokens.revokedAt)))
    .limit(1);

  if (existing) {
    tokenInfo = { exists: true, message: "Org token already exists" };
  } else {
    try {
      const { plainToken, tokenHash } = generateOrgToken();
      await db.insert(orgTokens).values({
        orgId: org.id,
        name: "dev-provisioned",
        tokenHash,
      });
      tokenInfo = { orgToken: plainToken };
    } catch (err) {
      tokenInfo = { error: (err as Error).message };
    }
  }

  return NextResponse.json({
    licenseKey,
    tier,
    months,
    slug,
    orgToken: tokenInfo,
    usage: `npx create-clean --license ${licenseKey.slice(0, 30)}...`,
  });
}
