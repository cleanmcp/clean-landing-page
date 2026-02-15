import { NextRequest, NextResponse } from "next/server";
import { getAuthContext } from "@/lib/auth";
import { db } from "@/lib/db";
import { orgTokens, orgMembers } from "@/lib/db/schema";
import { generateOrgToken } from "@/lib/org-tokens";
import { audit } from "@/lib/audit";
import { eq, and, desc } from "drizzle-orm";

// GET /api/org-tokens — list tokens for the user's org
export async function GET() {
  try {
    const ctx = await getAuthContext();
    if (!ctx) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const tokens = await db
      .select({
        id: orgTokens.id,
        name: orgTokens.name,
        lastSeenAt: orgTokens.lastSeenAt,
        revokedAt: orgTokens.revokedAt,
        createdAt: orgTokens.createdAt,
      })
      .from(orgTokens)
      .where(eq(orgTokens.orgId, ctx.orgId))
      .orderBy(desc(orgTokens.createdAt));

    return NextResponse.json({
      tokens: tokens.map((t) => ({
        id: t.id,
        name: t.name,
        lastSeenAt: t.lastSeenAt?.toISOString() ?? null,
        revokedAt: t.revokedAt?.toISOString() ?? null,
        createdAt: t.createdAt.toISOString(),
      })),
    });
  } catch (error) {
    console.error("Failed to list org tokens:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/org-tokens — generate a new org token (OWNER/ADMIN only)
export async function POST(request: NextRequest) {
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
        { error: "Only OWNER or ADMIN can create org tokens" },
        { status: 403 }
      );
    }

    const rawBody = await request.text();
    if (rawBody.length > 10000) {
      return NextResponse.json(
        { error: "Request too large" },
        { status: 413 }
      );
    }
    const body = JSON.parse(rawBody);
    const name = body.name || "default";

    // Generate token
    const { plainToken, tokenHash } = generateOrgToken();

    // Store in database
    const [token] = await db
      .insert(orgTokens)
      .values({
        orgId: ctx.orgId,
        name,
        tokenHash,
      })
      .returning({ id: orgTokens.id });

    // Audit log
    audit({
      orgId: ctx.orgId,
      userId: ctx.userId,
      action: "token.created",
      resourceType: "org_token",
      resourceId: token.id,
      metadata: { name },
    });

    // Return the plain token (only time it's shown)
    return NextResponse.json({ token: plainToken, id: token.id });
  } catch (error) {
    console.error("Failed to create org token:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
