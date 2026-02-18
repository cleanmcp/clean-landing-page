import { NextResponse } from "next/server";
import { getAuthContext } from "@/lib/auth";
import { db } from "@/lib/db";
import { auditLogs, apiKeys, users } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";

export interface ActivityItem {
  id: string;
  action: string;
  resourceType: string;
  resourceId: string | null;
  metadata: Record<string, unknown> | null;
  apiKeyId: string | null;
  apiKeyName: string | null;
  createdAt: string;
  user: { name: string | null; email: string | null } | null;
}

// GET /api/dashboard/activity
// Returns the 20 most recent audit log entries for the current org,
// joined with the API key name and user info.
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
        metadata: auditLogs.metadata,
        apiKeyId: auditLogs.apiKeyId,
        apiKeyName: apiKeys.name,
        createdAt: auditLogs.createdAt,
        userName: users.name,
        userEmail: users.email,
      })
      .from(auditLogs)
      .leftJoin(apiKeys, eq(auditLogs.apiKeyId, apiKeys.id))
      .leftJoin(users, eq(auditLogs.userId, users.id))
      .where(eq(auditLogs.orgId, ctx.orgId))
      .orderBy(desc(auditLogs.createdAt))
      .limit(20);

    const activity: ActivityItem[] = logs.map((l) => ({
      id: l.id,
      action: l.action,
      resourceType: l.resourceType,
      resourceId: l.resourceId ?? null,
      metadata: (l.metadata as Record<string, unknown> | null) ?? null,
      apiKeyId: l.apiKeyId ?? null,
      apiKeyName: l.apiKeyName ?? null,
      createdAt: l.createdAt.toISOString(),
      user:
        l.userName || l.userEmail
          ? { name: l.userName ?? null, email: l.userEmail ?? null }
          : null,
    }));

    return NextResponse.json({ activity });
  } catch (error) {
    console.error("Failed to fetch dashboard activity:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
