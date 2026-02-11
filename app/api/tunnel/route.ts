import { NextRequest, NextResponse } from "next/server";
import {
  createTunnel,
  deleteTunnel,
  getTunnelStatus,
  rotateTunnel,
} from "@/lib/cloudflare-tunnel";

/**
 * Tunnel management API.
 *
 * TODO: Wire up to org auth + DB when org dashboard is built.
 * For now, these endpoints call CF API directly.
 * Your teammate needs to:
 *   1. Add auth middleware (verify the request comes from a logged-in org admin)
 *   2. Add DB reads/writes (store tunnel records per org)
 *   3. Replace the hardcoded placeholders below
 */

// GET /api/tunnel?orgId=xxx — get tunnel info + live status
export async function GET(request: NextRequest) {
  try {
    // TODO: Replace with auth check — get orgId from session
    const orgId = request.nextUrl.searchParams.get("orgId");
    if (!orgId) {
      return NextResponse.json({ error: "orgId required" }, { status: 400 });
    }

    // TODO: Replace with DB lookup
    // const tunnel = await db.tunnel.findUnique({ where: { orgId } });
    // if (!tunnel) return NextResponse.json({ tunnel: null });

    // For now, return null (no DB yet)
    // When DB is wired up, fetch live status:
    // const status = await getTunnelStatus(tunnel.cloudflareTunnelId);
    // const connected = (status.connections?.length ?? 0) > 0;

    return NextResponse.json({ tunnel: null });
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
    // TODO: Replace with auth check — verify org admin
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
        { error: "Invalid org slug — lowercase letters, numbers, and hyphens only" },
        { status: 400 }
      );
    }

    // TODO: Check DB that tunnel doesn't already exist for this org
    // const existing = await db.tunnel.findUnique({ where: { orgId } });
    // if (existing) return NextResponse.json({ error: "Tunnel already exists" }, { status: 409 });

    // Create tunnel via Cloudflare API — this is the real deal
    const result = await createTunnel(orgSlug);

    // TODO: Save to DB
    // await db.tunnel.create({
    //   data: {
    //     orgId,
    //     cloudflareTunnelId: result.tunnelId,
    //     hostname: result.hostname,
    //     dnsRecordId: result.dnsRecordId,
    //     token: result.token,
    //   },
    // });

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
    // TODO: Replace with auth check
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

    // TODO: Delete from DB
    // await db.tunnel.delete({ where: { orgId } });

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
    // TODO: Replace with auth check
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

    // TODO: Update DB with new tunnelId, dnsRecordId, token

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
