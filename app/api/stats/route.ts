import { NextResponse } from "next/server";
import { getAuthContext } from "@/lib/auth";
import { db } from "@/lib/db";
import { searchLogs } from "@/lib/db/schema";
import { eq, sql, desc, gte } from "drizzle-orm";

// GET /api/stats - Real metrics from SearchLog
export async function GET() {
  try {
    const ctx = await getAuthContext();
    if (!ctx) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const orgId = ctx.orgId;

    // Run queries in parallel
    const [totalSearchesResult, aggregates, searchesThisWeekResult, topRepos, recentSearches] =
      await Promise.all([
        // Total search count
        db
          .select({ count: sql<number>`count(*)::int` })
          .from(searchLogs)
          .where(eq(searchLogs.orgId, orgId)),

        // Aggregate token savings
        db
          .select({
            totalTokensSaved: sql<number>`coalesce(sum(${searchLogs.tokensSavedEst}), 0)::int`,
            totalCharsSaved: sql<number>`coalesce(sum(${searchLogs.charsSaved}), 0)::int`,
          })
          .from(searchLogs)
          .where(eq(searchLogs.orgId, orgId)),

        // Searches this week
        db
          .select({ count: sql<number>`count(*)::int` })
          .from(searchLogs)
          .where(
            sql`${searchLogs.orgId} = ${orgId} AND ${searchLogs.createdAt} >= ${new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)}`
          ),

        // Top repos (most searched)
        db
          .select({
            repo: searchLogs.repo,
            count: sql<number>`count(*)::int`,
          })
          .from(searchLogs)
          .where(eq(searchLogs.orgId, orgId))
          .groupBy(searchLogs.repo)
          .orderBy(sql`count(*) desc`)
          .limit(5),

        // Recent searches
        db
          .select({
            id: searchLogs.id,
            repo: searchLogs.repo,
            query: searchLogs.query,
            resultCount: searchLogs.resultCount,
            tokensSavedEst: searchLogs.tokensSavedEst,
            durationMs: searchLogs.durationMs,
            createdAt: searchLogs.createdAt,
          })
          .from(searchLogs)
          .where(eq(searchLogs.orgId, orgId))
          .orderBy(desc(searchLogs.createdAt))
          .limit(10),
      ]);

    return NextResponse.json({
      totalSearches: totalSearchesResult[0]?.count ?? 0,
      totalTokensSaved: aggregates[0]?.totalTokensSaved ?? 0,
      totalCharsSaved: aggregates[0]?.totalCharsSaved ?? 0,
      searchesThisWeek: searchesThisWeekResult[0]?.count ?? 0,
      topRepos: topRepos.map((r) => ({
        repo: r.repo,
        count: r.count,
      })),
      recentSearches: recentSearches.map((s) => ({
        id: s.id,
        repo: s.repo,
        query: s.query,
        resultCount: s.resultCount,
        tokensSaved: s.tokensSavedEst,
        durationMs: s.durationMs,
        createdAt: s.createdAt.toISOString(),
      })),
    });
  } catch (error) {
    console.error("Failed to fetch stats:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
