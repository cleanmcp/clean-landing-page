import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { invites, orgMembers, organizations } from "@/lib/db/schema";
import { eq, and, isNull, sql } from "drizzle-orm";
import { getCloudTierLimits } from "@/lib/tier-limits";

/**
 * POST /api/invites/accept — Accept an invite and join the org.
 * Body: { token: string }
 *
 * Enforces seat limits at acceptance time (not just creation time).
 */
export async function POST(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const token = body.token;

  if (!token || typeof token !== "string") {
    return NextResponse.json({ error: "Missing invite token" }, { status: 400 });
  }

  // Find the invite
  const [invite] = await db
    .select()
    .from(invites)
    .where(and(eq(invites.token, token), isNull(invites.revokedAt)))
    .limit(1);

  if (!invite) {
    return NextResponse.json({ error: "Invalid or revoked invite" }, { status: 404 });
  }

  // Check expiration
  if (invite.expiresAt && invite.expiresAt < new Date()) {
    return NextResponse.json({ error: "Invite has expired" }, { status: 410 });
  }

  // Check max uses
  if (invite.maxUses !== null && invite.useCount >= invite.maxUses) {
    return NextResponse.json({ error: "Invite has reached its usage limit" }, { status: 410 });
  }

  // Check if user is already a member
  const [existing] = await db
    .select({ userId: orgMembers.userId })
    .from(orgMembers)
    .where(and(eq(orgMembers.orgId, invite.orgId), eq(orgMembers.userId, userId)))
    .limit(1);

  if (existing) {
    return NextResponse.json({ error: "already_member", orgId: invite.orgId });
  }

  // Enforce seat limit
  const [org] = await db
    .select({ tier: organizations.tier, name: organizations.name })
    .from(organizations)
    .where(eq(organizations.id, invite.orgId))
    .limit(1);

  if (!org) {
    return NextResponse.json({ error: "Organization not found" }, { status: 404 });
  }

  const limits = getCloudTierLimits(org.tier ?? "free");

  const [{ count: memberCount }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(orgMembers)
    .where(eq(orgMembers.orgId, invite.orgId));

  if (Number(memberCount) >= limits.members) {
    return NextResponse.json(
      {
        error: "seat_limit_reached",
        message: `This organization has reached its team member limit (${memberCount}/${limits.members}). Ask the owner to upgrade.`,
      },
      { status: 403 }
    );
  }

  // Add user to org
  await db
    .insert(orgMembers)
    .values({
      orgId: invite.orgId,
      userId,
      role: invite.role,
    })
    .onConflictDoNothing();

  // Increment use count
  await db
    .update(invites)
    .set({ useCount: sql`${invites.useCount} + 1` })
    .where(eq(invites.id, invite.id));

  return NextResponse.json({
    success: true,
    orgId: invite.orgId,
    orgName: org.name,
    role: invite.role,
  });
}
