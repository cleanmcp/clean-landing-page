import { NextRequest, NextResponse } from "next/server";
import { getAuthContext } from "@/lib/auth";
import { db } from "@/lib/db";
import { searchLogs } from "@/lib/db/schema";
import { eq, sql, and, gte } from "drizzle-orm";

export interface TokenSavingsStats {
  totalSearches: number;
  totalJsonChars: number;
  totalToonChars: number;
  totalCharsSaved: number;
  totalTokensSaved: number;
  // These may be null if the columns don't exist yet or have no data
  totalSourceFileChars: number | null;
  totalSnippetChars: number | null;
  period: "7d" | "30d" | "all";
}

function getPeriodCutoff(period: string): Date | null {
  const now = Date.now();
  if (period === "7d") return new Date(now - 7 * 24 * 60 * 60 * 1000);
  if (period === "30d") return new Date(now - 30 * 24 * 60 * 60 * 1000);
  return null; // "all" — no cutoff
}

// GET /api/dashboard/stats?period=7d|30d|all
// Returns aggregated token savings stats for the current org over the given period.
// Gracefully handles the case where source_file_chars / snippet_chars columns
// don't exist yet (they may be added to the DB after this code ships).
export async function GET(request: NextRequest) {
  try {
    const ctx = await getAuthContext();
    if (!ctx) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const rawPeriod = searchParams.get("period") ?? "30d";
    const period = (["7d", "30d", "all"].includes(rawPeriod) ? rawPeriod : "30d") as
      | "7d"
      | "30d"
      | "all";

    const cutoff = getPeriodCutoff(period);

    const whereClause =
      cutoff !== null
        ? and(eq(searchLogs.orgId, ctx.orgId), gte(searchLogs.createdAt, cutoff))
        : eq(searchLogs.orgId, ctx.orgId);

    // We wrap source_file_chars and snippet_chars in a try-catch-like SQL coalesce
    // so that if they're NULL (old rows) we still get valid aggregates.
    // If the columns don't exist at all in the DB, the query will throw and we
    // fall back to returning nulls for those two fields.
    let result: {
      totalSearches: number;
      totalJsonChars: number;
      totalToonChars: number;
      totalCharsSaved: number;
      totalTokensSaved: number;
      totalSourceFileChars: number | null;
      totalSnippetChars: number | null;
    };

    try {
      const [row] = await db
        .select({
          totalSearches: sql<number>`count(*)::int`,
          totalJsonChars: sql<number>`coalesce(sum(${searchLogs.jsonChars}), 0)::int`,
          totalToonChars: sql<number>`coalesce(sum(${searchLogs.toonChars}), 0)::int`,
          totalCharsSaved: sql<number>`coalesce(sum(${searchLogs.charsSaved}), 0)::int`,
          totalTokensSaved: sql<number>`coalesce(sum(${searchLogs.tokensSavedEst}), 0)::int`,
          // These two columns may not exist yet. If they do exist but are NULL, SUM returns NULL.
          // We cast the raw SQL so Drizzle doesn't try to reference schema columns that may be missing.
          totalSourceFileChars: sql<number | null>`sum(source_file_chars)`,
          totalSnippetChars: sql<number | null>`sum(snippet_chars)`,
        })
        .from(searchLogs)
        .where(whereClause);

      result = {
        totalSearches: row?.totalSearches ?? 0,
        totalJsonChars: row?.totalJsonChars ?? 0,
        totalToonChars: row?.totalToonChars ?? 0,
        totalCharsSaved: row?.totalCharsSaved ?? 0,
        totalTokensSaved: row?.totalTokensSaved ?? 0,
        totalSourceFileChars:
          row?.totalSourceFileChars != null ? Number(row.totalSourceFileChars) : null,
        totalSnippetChars:
          row?.totalSnippetChars != null ? Number(row.totalSnippetChars) : null,
      };
    } catch (queryErr) {
      // The source_file_chars / snippet_chars columns don't exist yet.
      // Run a simpler query without them.
      console.warn(
        "dashboard/stats: source_file_chars or snippet_chars not available, falling back",
        queryErr
      );

      const [row] = await db
        .select({
          totalSearches: sql<number>`count(*)::int`,
          totalJsonChars: sql<number>`coalesce(sum(${searchLogs.jsonChars}), 0)::int`,
          totalToonChars: sql<number>`coalesce(sum(${searchLogs.toonChars}), 0)::int`,
          totalCharsSaved: sql<number>`coalesce(sum(${searchLogs.charsSaved}), 0)::int`,
          totalTokensSaved: sql<number>`coalesce(sum(${searchLogs.tokensSavedEst}), 0)::int`,
        })
        .from(searchLogs)
        .where(whereClause);

      result = {
        totalSearches: row?.totalSearches ?? 0,
        totalJsonChars: row?.totalJsonChars ?? 0,
        totalToonChars: row?.totalToonChars ?? 0,
        totalCharsSaved: row?.totalCharsSaved ?? 0,
        totalTokensSaved: row?.totalTokensSaved ?? 0,
        totalSourceFileChars: null,
        totalSnippetChars: null,
      };
    }

    const stats: TokenSavingsStats = { ...result, period };
    return NextResponse.json(stats);
  } catch (error) {
    console.error("Failed to fetch dashboard stats:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
