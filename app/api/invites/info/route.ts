import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { invites, organizations } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

// GET /api/invites/info?token=xxx - Public endpoint for invite info
export async function GET(request: NextRequest) {
  try {
    const token = request.nextUrl.searchParams.get("token");
    if (!token) {
      return NextResponse.json(
        { error: "Token is required" },
        { status: 400 }
      );
    }

    const [invite] = await db
      .select({
        id: invites.id,
        role: invites.role,
        email: invites.email,
        maxUses: invites.maxUses,
        useCount: invites.useCount,
        expiresAt: invites.expiresAt,
        revokedAt: invites.revokedAt,
        orgName: organizations.name,
        orgSlug: organizations.slug,
      })
      .from(invites)
      .innerJoin(organizations, eq(invites.orgId, organizations.id))
      .where(eq(invites.token, token))
      .limit(1);

    if (!invite) {
      return NextResponse.json(
        { error: "Invite not found", valid: false },
        { status: 404 }
      );
    }

    // Check validity
    let valid = true;
    let reason: string | null = null;

    if (invite.revokedAt) {
      valid = false;
      reason = "This invite has been revoked.";
    } else if (invite.expiresAt && invite.expiresAt < new Date()) {
      valid = false;
      reason = "This invite has expired.";
    } else if (
      invite.maxUses !== null &&
      invite.useCount >= invite.maxUses
    ) {
      valid = false;
      reason = "This invite has reached its maximum uses.";
    }

    return NextResponse.json({
      valid,
      reason,
      orgName: invite.orgName,
      orgSlug: invite.orgSlug,
      role: invite.role,
    });
  } catch (error) {
    console.error("GET /api/invites/info failed:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
