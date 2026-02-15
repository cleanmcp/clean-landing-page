import { NextRequest, NextResponse } from "next/server";
import { getAuthContext } from "@/lib/auth";
import { db } from "@/lib/db";
import { orgMembers, organizations } from "@/lib/db/schema";
import type { OrgRole } from "@/lib/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { getClerkClientInstance } from "@/lib/clerk-org";

// PATCH /api/org/members - Change a member's role
export async function PATCH(request: NextRequest) {
  try {
    const ctx = await getAuthContext();
    if (!ctx) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { targetUserId, role } = (await request.json()) as {
      targetUserId: string;
      role: OrgRole;
    };

    if (!targetUserId || !role) {
      return NextResponse.json(
        { error: "targetUserId and role are required" },
        { status: 400 }
      );
    }

    if (!["OWNER", "ADMIN", "MEMBER"].includes(role)) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 });
    }

    // Cannot change own role
    if (targetUserId === ctx.userId) {
      return NextResponse.json(
        { error: "Cannot change your own role" },
        { status: 400 }
      );
    }

    // Permission checks
    if (ctx.role === "MEMBER") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    if (ctx.role === "ADMIN" && role !== "MEMBER") {
      return NextResponse.json(
        { error: "Admins can only assign the MEMBER role" },
        { status: 403 }
      );
    }

    // Update in NeonDB
    await db
      .update(orgMembers)
      .set({ role })
      .where(
        and(
          eq(orgMembers.orgId, ctx.orgId),
          eq(orgMembers.userId, targetUserId)
        )
      );

    // Sync to Clerk (best-effort)
    try {
      const [org] = await db
        .select({ clerkOrgId: organizations.clerkOrgId })
        .from(organizations)
        .where(eq(organizations.id, ctx.orgId))
        .limit(1);

      if (org?.clerkOrgId) {
        const clerkRoleMap = {
          OWNER: "org:admin",
          ADMIN: "org:admin",
          MEMBER: "org:member",
        } as const;

        await getClerkClientInstance().organizations.updateOrganizationMembership({
          organizationId: org.clerkOrgId,
          userId: targetUserId,
          role: clerkRoleMap[role],
        });
      }
    } catch (err) {
      console.error("Failed to sync role to Clerk (non-blocking):", err);
    }

    return NextResponse.json({ success: true, role });
  } catch (error) {
    console.error("PATCH /api/org/members failed:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE /api/org/members - Remove a member (or self = leave)
export async function DELETE(request: NextRequest) {
  try {
    const ctx = await getAuthContext();
    if (!ctx) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { targetUserId } = (await request.json()) as {
      targetUserId: string;
    };

    if (!targetUserId) {
      return NextResponse.json(
        { error: "targetUserId is required" },
        { status: 400 }
      );
    }

    const isSelf = targetUserId === ctx.userId;

    // Only OWNER/ADMIN can remove others
    if (!isSelf && ctx.role === "MEMBER") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Cannot remove the last OWNER
    if (isSelf && ctx.role === "OWNER") {
      const [ownerCount] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(orgMembers)
        .where(
          and(
            eq(orgMembers.orgId, ctx.orgId),
            eq(orgMembers.role, "OWNER")
          )
        );

      if ((ownerCount?.count ?? 0) <= 1) {
        return NextResponse.json(
          { error: "Cannot remove the last owner. Transfer ownership first." },
          { status: 400 }
        );
      }
    }

    // Remove from NeonDB
    await db
      .delete(orgMembers)
      .where(
        and(
          eq(orgMembers.orgId, ctx.orgId),
          eq(orgMembers.userId, targetUserId)
        )
      );

    // Remove from Clerk (best-effort)
    try {
      const [org] = await db
        .select({ clerkOrgId: organizations.clerkOrgId })
        .from(organizations)
        .where(eq(organizations.id, ctx.orgId))
        .limit(1);

      if (org?.clerkOrgId) {
        await getClerkClientInstance().organizations.deleteOrganizationMembership({
          organizationId: org.clerkOrgId,
          userId: targetUserId,
        });
      }
    } catch (err) {
      console.error(
        "Failed to remove user from Clerk org (non-blocking):",
        err
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/org/members failed:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
