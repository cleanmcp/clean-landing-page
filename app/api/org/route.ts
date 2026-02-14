import { NextResponse } from "next/server";
import { getAuthContext } from "@/lib/auth";
import { db } from "@/lib/db";
import { organizations, orgMembers, users, apiKeys } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";

// GET /api/org - Get current user's organization info
export async function GET() {
  try {
    const ctx = await getAuthContext();
    if (!ctx) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get org info
    const [org] = await db
      .select()
      .from(organizations)
      .where(eq(organizations.id, ctx.orgId))
      .limit(1);

    if (!org) {
      return NextResponse.json(
        { error: "Organization not found" },
        { status: 404 }
      );
    }

    // Get members with user info
    const members = await db
      .select({
        userId: orgMembers.userId,
        role: orgMembers.role,
        joinedAt: orgMembers.joinedAt,
        userName: users.name,
        userEmail: users.email,
        userImage: users.image,
      })
      .from(orgMembers)
      .innerJoin(users, eq(orgMembers.userId, users.id))
      .where(eq(orgMembers.orgId, ctx.orgId));

    // Get API key count
    const [keyCount] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(apiKeys)
      .where(eq(apiKeys.orgId, ctx.orgId));

    return NextResponse.json({
      id: org.id,
      name: org.name,
      slug: org.slug,
      createdAt: org.createdAt.toISOString(),
      memberCount: members.length,
      apiKeyCount: keyCount?.count ?? 0,
      members: members.map((m) => ({
        userId: m.userId,
        role: m.role,
        joinedAt: m.joinedAt.toISOString(),
        user: {
          id: m.userId,
          name: m.userName,
          email: m.userEmail,
          image: m.userImage,
        },
      })),
    });
  } catch (error) {
    console.error("Failed to fetch org:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
