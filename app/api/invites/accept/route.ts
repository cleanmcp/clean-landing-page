import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import {
  invites,
  organizations,
  orgMembers,
  users,
} from "@/lib/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { ensureClerkOrg, getClerkClientInstance } from "@/lib/clerk-org";

// POST /api/invites/accept - Accept an invite
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { token } = await request.json();
    if (!token) {
      return NextResponse.json(
        { error: "Token is required" },
        { status: 400 }
      );
    }

    // Fetch the invite
    const [invite] = await db
      .select()
      .from(invites)
      .where(eq(invites.token, token))
      .limit(1);

    if (!invite) {
      return NextResponse.json(
        { error: "Invite not found" },
        { status: 404 }
      );
    }

    // Validate invite
    if (invite.revokedAt) {
      return NextResponse.json(
        { error: "This invite has been revoked." },
        { status: 410 }
      );
    }
    if (invite.expiresAt && invite.expiresAt < new Date()) {
      return NextResponse.json(
        { error: "This invite has expired." },
        { status: 410 }
      );
    }

    // Check if already a member
    const [existingMembership] = await db
      .select()
      .from(orgMembers)
      .where(
        and(
          eq(orgMembers.orgId, invite.orgId),
          eq(orgMembers.userId, userId)
        )
      )
      .limit(1);

    if (existingMembership) {
      // Get org slug for redirect
      const [org] = await db
        .select({ slug: organizations.slug })
        .from(organizations)
        .where(eq(organizations.id, invite.orgId))
        .limit(1);

      return NextResponse.json({
        success: true,
        orgSlug: org?.slug,
        message: "You are already a member of this organization.",
      });
    }

    // Atomically increment useCount with max_uses check
    if (invite.maxUses !== null) {
      const [updated] = await db
        .update(invites)
        .set({ useCount: sql`${invites.useCount} + 1` })
        .where(
          and(
            eq(invites.id, invite.id),
            sql`${invites.useCount} < ${invite.maxUses}`
          )
        )
        .returning({ useCount: invites.useCount });

      if (!updated) {
        return NextResponse.json(
          { error: "This invite has reached its maximum uses." },
          { status: 410 }
        );
      }
    } else {
      await db
        .update(invites)
        .set({ useCount: sql`${invites.useCount} + 1` })
        .where(eq(invites.id, invite.id));
    }

    // Ensure user exists in our users table with onboarding complete
    // (invited users skip onboarding since they're joining an existing org)
    await db
      .insert(users)
      .values({ id: userId, onboardingStep: 2 })
      .onConflictDoUpdate({
        target: users.id,
        set: { onboardingStep: 2 },
      });

    // Add to org_members
    await db.insert(orgMembers).values({
      orgId: invite.orgId,
      userId,
      role: invite.role,
    });

    // Add to Clerk Organization
    try {
      // Look up the org's Clerk ID; if there's no Clerk org yet, we need the
      // *org owner* (not the invitee) as the creator so ownership is correct.
      const [orgOwner] = await db
        .select({ userId: orgMembers.userId })
        .from(orgMembers)
        .where(
          and(
            eq(orgMembers.orgId, invite.orgId),
            eq(orgMembers.role, "OWNER")
          )
        )
        .limit(1);

      const creatorId = orgOwner?.userId ?? userId;
      const clerkOrgId = await ensureClerkOrg(invite.orgId, creatorId);

      const clerkRoleMap = {
        OWNER: "org:admin",
        ADMIN: "org:admin",
        MEMBER: "org:member",
      } as const;

      const clerkClient = getClerkClientInstance();

      // If the Clerk org was just created with the owner as creator, make sure
      // the accepting user is added as a member (skip if they are the creator).
      if (creatorId !== userId) {
        await clerkClient.organizations.createOrganizationMembership({
          organizationId: clerkOrgId,
          userId,
          role: clerkRoleMap[invite.role],
        });
      }
    } catch (err: unknown) {
      // If the user is already a member, that's fine — don't treat it as an error.
      const errStr = String(err);
      const isAlreadyMember =
        errStr.includes("already") ||
        errStr.includes("duplicate") ||
        errStr.includes("is already");
      if (!isAlreadyMember) {
        // Surface a clear message for the 403 / Organizations-not-enabled case
        console.error("[invite-accept] Failed to sync Clerk org membership:", errStr);
      }
    }

    // Get org slug for redirect
    const [org] = await db
      .select({ slug: organizations.slug })
      .from(organizations)
      .where(eq(organizations.id, invite.orgId))
      .limit(1);

    // Set the active_org cookie so the dashboard shows the invited org
    const res = NextResponse.json({
      success: true,
      orgId: invite.orgId,
      orgSlug: org?.slug,
    });
    res.cookies.set("active_org", invite.orgId, {
      path: "/",
      httpOnly: false,
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 365, // 1 year
    });
    return res;
  } catch (error) {
    console.error("POST /api/invites/accept failed:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
