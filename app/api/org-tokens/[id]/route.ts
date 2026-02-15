import { NextRequest, NextResponse } from "next/server";
import { getAuthContext } from "@/lib/auth";
import { db } from "@/lib/db";
import { orgTokens, orgMembers } from "@/lib/db/schema";
import { audit } from "@/lib/audit";
import { eq, and, isNull } from "drizzle-orm";

// DELETE /api/org-tokens/[id] — revoke an org token
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const ctx = await getAuthContext();
    if (!ctx) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check role — must be OWNER or ADMIN
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

    if (!membership || !["OWNER", "ADMIN"].includes(membership.role)) {
      return NextResponse.json(
        { error: "Only OWNER or ADMIN can revoke org tokens" },
        { status: 403 }
      );
    }

    const { id } = await params;

    // Check token exists and belongs to this org
    const [token] = await db
      .select()
      .from(orgTokens)
      .where(
        and(
          eq(orgTokens.id, id),
          eq(orgTokens.orgId, ctx.orgId),
          isNull(orgTokens.revokedAt)
        )
      )
      .limit(1);

    if (!token) {
      return NextResponse.json(
        { error: "Token not found" },
        { status: 404 }
      );
    }

    // Soft revoke
    await db
      .update(orgTokens)
      .set({ revokedAt: new Date() })
      .where(eq(orgTokens.id, id));

    // Audit log
    audit({
      orgId: ctx.orgId,
      userId: ctx.userId,
      action: "token.revoked",
      resourceType: "org_token",
      resourceId: id,
      metadata: { name: token.name },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to revoke org token:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
