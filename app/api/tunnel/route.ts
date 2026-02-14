import { NextRequest, NextResponse } from "next/server";
import { getAuthContext } from "@/lib/auth";
import { db } from "@/lib/db";
import { tunnels } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import {
  createTunnel,
  deleteTunnel,
  getTunnelStatus,
  rotateTunnel,
} from "@/lib/cloudflare-tunnel";

// GET /api/tunnel?orgId=xxx — get tunnel info + live status
export async function GET(request: NextRequest) {
  try {
    const ctx = await getAuthContext();
    if (!ctx) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Look up tunnel from DB
    const [tunnel] = await db
      .select()
      .from(tunnels)
      .where(eq(tunnels.orgId, ctx.orgId))
      .limit(1);

    if (!tunnel) {
      return NextResponse.json({ tunnel: null });
    }

    // Fetch live status from Cloudflare
    let connected = false;
    try {
      const status = await getTunnelStatus(tunnel.cloudflareTunnelId);
      connected = (status.connections?.length ?? 0) > 0;
    } catch {
      // CF API might be unreachable, return what we have
    }

    return NextResponse.json({
      tunnel: {
        hostname: tunnel.hostname,
        url: `https://${tunnel.hostname}`,
        token: tunnel.token,
        tunnelId: tunnel.cloudflareTunnelId,
        dnsRecordId: tunnel.dnsRecordId,
        connected,
        createdAt: tunnel.createdAt.toISOString(),
      },
    });
  } catch (error) {
    console.error("Failed to get tunnel:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/tunnel — create a tunnel for an org
export async function POST(request: NextRequest) {
  try {
    const ctx = await getAuthContext();
    if (!ctx) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { orgSlug } = body;

    if (!orgSlug || typeof orgSlug !== "string") {
      return NextResponse.json(
        { error: "orgSlug is required" },
        { status: 400 }
      );
    }

    // Validate slug format
    if (!/^[a-z0-9-]+$/.test(orgSlug)) {
      return NextResponse.json(
        {
          error:
            "Invalid org slug — lowercase letters, numbers, and hyphens only",
        },
        { status: 400 }
      );
    }

    // Check DB that tunnel doesn't already exist for this org
    const [existing] = await db
      .select({ id: tunnels.id })
      .from(tunnels)
      .where(eq(tunnels.orgId, ctx.orgId))
      .limit(1);

    if (existing) {
      return NextResponse.json(
        { error: "Tunnel already exists for this organization" },
        { status: 409 }
      );
    }

    // Create tunnel via Cloudflare API
    const result = await createTunnel(orgSlug);

    // Save to DB
    await db.insert(tunnels).values({
      orgId: ctx.orgId,
      cloudflareTunnelId: result.tunnelId,
      hostname: result.hostname,
      dnsRecordId: result.dnsRecordId,
      token: result.token,
    });

    return NextResponse.json({
      tunnel: {
        hostname: result.hostname,
        url: `https://${result.hostname}`,
        token: result.token,
        tunnelId: result.tunnelId,
        dnsRecordId: result.dnsRecordId,
      },
    });
  } catch (error) {
    console.error("Failed to create tunnel:", error);
    const message =
      error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// DELETE /api/tunnel — delete an org's tunnel
export async function DELETE(request: NextRequest) {
  try {
    const ctx = await getAuthContext();
    if (!ctx) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { tunnelId, dnsRecordId } = body;

    if (!tunnelId || !dnsRecordId) {
      return NextResponse.json(
        { error: "tunnelId and dnsRecordId are required" },
        { status: 400 }
      );
    }

    // Delete from Cloudflare
    await deleteTunnel(tunnelId, dnsRecordId);

    // Delete from DB
    await db.delete(tunnels).where(eq(tunnels.orgId, ctx.orgId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete tunnel:", error);
    const message =
      error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// PATCH /api/tunnel — rotate tunnel token
export async function PATCH(request: NextRequest) {
  try {
    const ctx = await getAuthContext();
    if (!ctx) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { orgSlug, tunnelId, dnsRecordId } = body;

    if (!orgSlug || !tunnelId || !dnsRecordId) {
      return NextResponse.json(
        { error: "orgSlug, tunnelId, and dnsRecordId are required" },
        { status: 400 }
      );
    }

    // Rotate: delete old, create new (same hostname)
    const result = await rotateTunnel(orgSlug, tunnelId, dnsRecordId);

    // Update DB with new tunnelId, dnsRecordId, token
    await db
      .update(tunnels)
      .set({
        cloudflareTunnelId: result.tunnelId,
        dnsRecordId: result.dnsRecordId,
        token: result.token,
        hostname: result.hostname,
        updatedAt: new Date(),
      })
      .where(eq(tunnels.orgId, ctx.orgId));

    return NextResponse.json({
      tunnel: {
        hostname: result.hostname,
        url: `https://${result.hostname}`,
        token: result.token,
        tunnelId: result.tunnelId,
        dnsRecordId: result.dnsRecordId,
      },
    });
  } catch (error) {
    console.error("Failed to rotate tunnel:", error);
    const message =
      error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
