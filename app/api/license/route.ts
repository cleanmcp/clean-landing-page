import { NextRequest, NextResponse } from "next/server";
import { getAuthContext } from "@/lib/auth";
import { generateLicenseKey } from "@/lib/license";
import { db } from "@/lib/db";
import { organizations, orgMembers, tunnels } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { createTunnel } from "@/lib/cloudflare-tunnel";

// POST /api/license — generate license + auto-create tunnel
export async function POST(request: NextRequest) {
  try {
    // 1. Auth check (Clerk session required)
    const ctx = await getAuthContext();
    if (!ctx) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Verify OWNER role
    const [membership] = await db
      .select({ role: orgMembers.role })
      .from(orgMembers)
      .where(
        and(
          eq(orgMembers.orgId, ctx.orgId),
          eq(orgMembers.userId, ctx.userId)
        )
      )
      .limit(1);

    if (!membership || membership.role !== "OWNER") {
      return NextResponse.json(
        { error: "Only organization owners can generate licenses" },
        { status: 403 }
      );
    }

    // 3. Parse request body
    const body = await request.json();
    const tier = body.tier ?? "pro";
    const months = body.months ?? 12;

    if (!["free", "pro", "enterprise"].includes(tier)) {
      return NextResponse.json(
        { error: "Invalid tier — must be free, pro, or enterprise" },
        { status: 400 }
      );
    }

    // 4. Look up org
    const [org] = await db
      .select({
        id: organizations.id,
        slug: organizations.slug,
        licenseKey: organizations.licenseKey,
      })
      .from(organizations)
      .where(eq(organizations.id, ctx.orgId))
      .limit(1);

    if (!org) {
      return NextResponse.json(
        { error: "Organization not found" },
        { status: 404 }
      );
    }

    // 5. Generate license JWT
    const licenseKey = generateLicenseKey({
      customerId: org.slug,
      tier,
      months,
    });

    // 6. Compute expiry and store on org
    const licenseExpiresAt = new Date();
    licenseExpiresAt.setDate(licenseExpiresAt.getDate() + months * 30);

    await db
      .update(organizations)
      .set({
        licenseKey,
        tier: tier as "free" | "pro" | "enterprise",
        licenseExpiresAt,
      })
      .where(eq(organizations.id, ctx.orgId));

    // 7. Auto-create tunnel if one doesn't exist
    let tunnelInfo;
    const [existingTunnel] = await db
      .select()
      .from(tunnels)
      .where(eq(tunnels.orgId, ctx.orgId))
      .limit(1);

    if (existingTunnel) {
      tunnelInfo = {
        hostname: existingTunnel.hostname,
        url: `https://${existingTunnel.hostname}`,
        token: existingTunnel.token,
        tunnelId: existingTunnel.cloudflareTunnelId,
      };
    } else {
      const result = await createTunnel(org.slug);

      await db.insert(tunnels).values({
        orgId: ctx.orgId,
        cloudflareTunnelId: result.tunnelId,
        hostname: result.hostname,
        dnsRecordId: result.dnsRecordId,
        token: result.token,
      });

      tunnelInfo = {
        hostname: result.hostname,
        url: `https://${result.hostname}`,
        token: result.token,
        tunnelId: result.tunnelId,
      };
    }

    return NextResponse.json({
      licenseKey,
      tunnel: tunnelInfo,
    });
  } catch (error) {
    console.error("License generation failed:", error);
    const message =
      error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
