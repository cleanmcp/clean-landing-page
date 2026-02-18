import { NextResponse } from "next/server";
import { getAuthContext } from "@/lib/auth";
import { db } from "@/lib/db";
import { auditLogs, users } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";

export async function GET() {
  try {
    const ctx = await getAuthContext();
    if (!ctx) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const logs = await db
      .select({
        id: auditLogs.id,
        action: auditLogs.action,
        resourceType: auditLogs.resourceType,
        resourceId: auditLogs.resourceId,
        createdAt: auditLogs.createdAt,
        userName: users.name,
        userEmail: users.email,
      })
      .from(auditLogs)
      .leftJoin(users, eq(auditLogs.userId, users.id))
      .where(eq(auditLogs.orgId, ctx.orgId))
      .orderBy(desc(auditLogs.createdAt))
      .limit(20);

    const activity = logs.map((l) => ({
      id: l.id,
      action: l.action,
      resourceType: l.resourceType,
      resourceId: l.resourceId,
      createdAt: l.createdAt.toISOString(),
      user: l.userName || l.userEmail
        ? { name: l.userName, email: l.userEmail }
        : null,
    }));

    return NextResponse.json({ activity });
  } catch (error) {
    console.error("Failed to fetch activity:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
