import { NextResponse } from "next/server";
import { generateLicenseKey } from "@/lib/license";
import { db } from "@/lib/db";
import { organizations, tunnels } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { createTunnel } from "@/lib/cloudflare-tunnel";

// GET /api/dev/test-license?slug=acme-corp&tier=enterprise&months=120
//
// Generates a maxed-out license key, stores it on the org, and
// auto-provisions a tunnel if one doesn't exist.
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

  // Auto-provision tunnel if missing
  let tunnelInfo;
  const [existing] = await db
    .select()
    .from(tunnels)
    .where(eq(tunnels.orgId, org.id))
    .limit(1);

  if (existing) {
    tunnelInfo = {
      hostname: existing.hostname,
      url: `https://${existing.hostname}`,
      token: existing.token,
    };
  } else {
    try {
      const result = await createTunnel(slug);
      await db.insert(tunnels).values({
        orgId: org.id,
        cloudflareTunnelId: result.tunnelId,
        hostname: result.hostname,
        dnsRecordId: result.dnsRecordId,
        token: result.token,
      });
      tunnelInfo = {
        hostname: result.hostname,
        url: `https://${result.hostname}`,
        token: result.token,
      };
    } catch (err) {
      tunnelInfo = { error: (err as Error).message };
    }
  }

  return NextResponse.json({
    licenseKey,
    tier,
    months,
    slug,
    tunnel: tunnelInfo,
    usage: `npx create-clean --license ${licenseKey.slice(0, 30)}...`,
  });
}
