import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { getAuthContext } from "@/lib/auth";
import { db } from "@/lib/db";
import { invites, orgMembers, organizations } from "@/lib/db/schema";
import { eq, and, isNull } from "drizzle-orm";
import { getCloudTierLimits } from "@/lib/tier-limits";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

/**
 * GET /api/invites — List active (non-revoked, non-expired) invites for the org.
 */
export async function GET() {
  const ctx = await getAuthContext();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (ctx.role !== "OWNER" && ctx.role !== "ADMIN") {
    return NextResponse.json({ error: "Only owners and admins can view invites" }, { status: 403 });
  }

  const rows = await db
    .select()
    .from(invites)
    .where(and(eq(invites.orgId, ctx.orgId), isNull(invites.revokedAt)));

  const now = new Date();
  const active = rows
    .filter((r) => !r.expiresAt || r.expiresAt > now)
    .map((r) => ({
      id: r.id,
      token: r.token,
      inviteUrl: `${APP_URL}/invite/${r.token}`,
      role: r.role,
      email: r.email,
      maxUses: r.maxUses,
      useCount: r.useCount,
      expiresAt: r.expiresAt?.toISOString() ?? null,
      createdAt: r.createdAt.toISOString(),
    }));

  return NextResponse.json({ invites: active });
}

/**
 * POST /api/invites — Create a new invite link.
 */
export async function POST(request: NextRequest) {
  const ctx = await getAuthContext();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (ctx.role !== "OWNER" && ctx.role !== "ADMIN") {
    return NextResponse.json({ error: "Only owners and admins can create invites" }, { status: 403 });
  }

  // Check member limit
  const [org] = await db
    .select({ tier: organizations.tier })
    .from(organizations)
    .where(eq(organizations.id, ctx.orgId))
    .limit(1);

  const limits = getCloudTierLimits(org?.tier ?? "free");
  const memberCount = await db
    .select({ userId: orgMembers.userId })
    .from(orgMembers)
    .where(eq(orgMembers.orgId, ctx.orgId));

  if (memberCount.length >= limits.members) {
    return NextResponse.json(
      { error: "upgrade_required", message: `Team member limit reached (${memberCount.length}/${limits.members}). Upgrade to add more.` },
      { status: 403 }
    );
  }

  const body = await request.json();
  const role = body.role === "ADMIN" && ctx.role === "OWNER" ? "ADMIN" : "MEMBER";
  const expiresInDays: number | null = body.expiresInDays ?? 7;

  const token = randomBytes(24).toString("base64url");
  const expiresAt = expiresInDays
    ? new Date(Date.now() + expiresInDays * 86400000)
    : null;

  const [inv] = await db
    .insert(invites)
    .values({
      orgId: ctx.orgId,
      createdById: ctx.userId,
      token,
      role,
      expiresAt,
    })
    .returning();

  return NextResponse.json({
    invite: {
      id: inv.id,
      token: inv.token,
      inviteUrl: `${APP_URL}/invite/${inv.token}`,
      role: inv.role,
      expiresAt: inv.expiresAt?.toISOString() ?? null,
    },
  });
}

/**
 * DELETE /api/invites — Revoke an invite.
 */
export async function DELETE(request: NextRequest) {
  const ctx = await getAuthContext();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (ctx.role !== "OWNER" && ctx.role !== "ADMIN") {
    return NextResponse.json({ error: "Only owners and admins can revoke invites" }, { status: 403 });
  }

  const body = await request.json();
  if (!body.id) return NextResponse.json({ error: "Missing invite id" }, { status: 400 });

  await db
    .update(invites)
    .set({ revokedAt: new Date() })
    .where(and(eq(invites.id, body.id), eq(invites.orgId, ctx.orgId)));

  return NextResponse.json({ status: "revoked" });
}
