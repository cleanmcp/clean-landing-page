import { NextResponse } from "next/server";
import { getAuthContext } from "@/lib/auth";
import { db } from "@/lib/db";
import { organizations, orgMembers, cloudRepos, apiKeys } from "@/lib/db/schema";
import { eq, and, isNull, sql } from "drizzle-orm";
import { getCloudTierLimits } from "@/lib/tier-limits";

export async function GET() {
  try {
    const ctx = await getAuthContext();
    if (!ctx) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [org] = await db
      .select({ tier: organizations.tier })
      .from(organizations)
      .where(eq(organizations.id, ctx.orgId))
      .limit(1);

    const tier = org?.tier ?? "free";
    const limits = getCloudTierLimits(tier);

    // Count repos
    const [repoCount] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(cloudRepos)
      .where(eq(cloudRepos.orgId, ctx.orgId));

    // Count seats
    const [seatCount] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(orgMembers)
      .where(eq(orgMembers.orgId, ctx.orgId));

    // Count active API keys
    const [keyCount] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(apiKeys)
      .where(and(eq(apiKeys.orgId, ctx.orgId), isNull(apiKeys.revokedAt)));

    const toLimit = (v: number) => (v === Infinity ? null : v);

    return NextResponse.json({
      tier,
      repos: { used: repoCount?.count ?? 0, limit: toLimit(limits.repos) },
      seats: { used: seatCount?.count ?? 0, limit: toLimit(limits.members) },
      apiKeys: { used: keyCount?.count ?? 0, limit: toLimit(limits.apiKeys) },
      searches: { used: null, limit: toLimit(limits.searchesPerDay) },
      storage: { used: null, limit: toLimit(limits.storageMb) },
    });
  } catch (error) {
    console.error("Failed to fetch usage:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
