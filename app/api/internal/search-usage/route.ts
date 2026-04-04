import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";
import { db } from "@/lib/db";
import { searchLogs, organizations } from "@/lib/db/schema";
import { sql } from "drizzle-orm";
import { CREDITS_PER_SEARCH } from "@/lib/tier-limits";

const GATEWAY_SECRET = process.env.GATEWAY_INTERNAL_SECRET || "";

function verifySecret(request: NextRequest): boolean {
  if (!GATEWAY_SECRET) return false;
  const auth = request.headers.get("authorization");
  if (!auth?.startsWith("Bearer ")) return false;
  const provided = auth.slice(7);
  if (provided.length !== GATEWAY_SECRET.length) return false;
  try {
    return timingSafeEqual(
      Buffer.from(provided),
      Buffer.from(GATEWAY_SECRET),
    );
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

interface SearchEntry {
  org_id: string;
  api_key_id: string;
  repo: string;
  query: string;
  result_count: number;
  json_chars: number;
  toon_chars: number;
  chars_saved: number;
  tokens_saved_est: number;
  duration_ms: number;
}

function validateEntry(e: unknown): e is SearchEntry {
  if (!e || typeof e !== "object") return false;
  const o = e as Record<string, unknown>;
  return (
    typeof o.org_id === "string" && UUID_RE.test(o.org_id) &&
    typeof o.api_key_id === "string" && UUID_RE.test(o.api_key_id) &&
    typeof o.repo === "string" && o.repo.length > 0 &&
    typeof o.query === "string" &&
    typeof o.result_count === "number" &&
    typeof o.json_chars === "number" &&
    typeof o.toon_chars === "number" &&
    typeof o.chars_saved === "number" &&
    typeof o.tokens_saved_est === "number" &&
    typeof o.duration_ms === "number"
  );
}

// ---------------------------------------------------------------------------
// POST /api/internal/search-usage
//
// Receives batched search log entries from the gateway after each flush.
// Inserts into searchLogs and decrements org credit balances.
//
// Body: { entries: SearchEntry[] }
// Auth: Authorization: Bearer <GATEWAY_INTERNAL_SECRET>
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest) {
  if (!verifySecret(request)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const entries: unknown[] = body.entries;

  if (!Array.isArray(entries) || entries.length === 0) {
    return NextResponse.json(
      { error: "entries array is required and must not be empty" },
      { status: 400 },
    );
  }

  // Validate all entries up front
  const valid: SearchEntry[] = [];
  for (const entry of entries) {
    if (validateEntry(entry)) {
      valid.push(entry);
    }
  }

  if (valid.length === 0) {
    return NextResponse.json(
      { error: "no valid entries" },
      { status: 400 },
    );
  }

  try {
    // Insert search logs
    await db.insert(searchLogs).values(
      valid.map((e) => ({
        orgId: e.org_id,
        apiKeyId: e.api_key_id,
        repo: e.repo,
        query: e.query,
        resultCount: e.result_count,
        jsonChars: e.json_chars,
        toonChars: e.toon_chars,
        charsSaved: e.chars_saved,
        tokensSavedEst: e.tokens_saved_est,
        durationMs: e.duration_ms,
      })),
    );

    // Decrement credit balances per org
    const creditsByOrg = new Map<string, number>();
    for (const e of valid) {
      creditsByOrg.set(e.org_id, (creditsByOrg.get(e.org_id) ?? 0) + CREDITS_PER_SEARCH);
    }

    const creditUpdates = Array.from(creditsByOrg.entries()).map(
      ([orgId, totalCredits]) =>
        db
          .update(organizations)
          .set({
            creditBalance: sql`GREATEST(${organizations.creditBalance} - ${totalCredits}, 0)`,
          })
          .where(sql`${organizations.id} = ${orgId}`),
    );
    await Promise.all(creditUpdates);

    return NextResponse.json({
      inserted: valid.length,
      skipped: entries.length - valid.length,
    });
  } catch (err) {
    console.error("[search-usage] Failed to process entries:", err);
    return NextResponse.json(
      { error: "internal_error" },
      { status: 500 },
    );
  }
}
