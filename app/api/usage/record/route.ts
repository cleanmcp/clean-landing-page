import { NextRequest, NextResponse } from "next/server";
import { getAuthContext } from "@/lib/auth";
import { db } from "@/lib/db";
import { subscriptions, usageEvents } from "@/lib/db/schema";
import { eq, and, desc, inArray, sql } from "drizzle-orm";

type Body = {
  billableTokens: number;
  inputTokens?: number;
  outputTokens?: number;
  cacheReadTokens?: number;
  cacheCreationTokens?: number;
  sessionId?: string;
  idempotencyKey: string;
  isByok?: boolean;
};

/**
 * POST /api/usage/record
 *
 * Records a token-usage batch from the Electron client. Idempotent via
 * `idempotencyKey` — the DB unique index on that column prevents double-count
 * if a retry lands after the first write succeeded.
 *
 * For non-BYOK usage, increments the caller's active Agent subscription's
 * `tokens_used_this_period`. BYOK usage is logged for analytics but does not
 * count against any allowance (user pays the model provider directly).
 */
export async function POST(req: NextRequest) {
  try {
    const ctx = await getAuthContext();
    if (!ctx) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await req.json().catch(() => null)) as Body | null;
    if (
      !body ||
      typeof body.billableTokens !== "number" ||
      body.billableTokens < 0 ||
      typeof body.idempotencyKey !== "string" ||
      body.idempotencyKey.length < 8
    ) {
      return NextResponse.json({ error: "Invalid body" }, { status: 400 });
    }

    // Resolve the caller's active Agent subscription (if any).
    const [sub] = await db
      .select({ id: subscriptions.id })
      .from(subscriptions)
      .where(
        and(
          eq(subscriptions.userId, ctx.userId),
          eq(subscriptions.product, "agent"),
          inArray(subscriptions.status, ["active", "trialing", "past_due"]),
        ),
      )
      .orderBy(desc(subscriptions.currentPeriodEnd))
      .limit(1);

    // Insert the usage row. Idempotency key is UNIQUE; onConflictDoNothing
    // means a duplicate delivery is a no-op rather than a 409 — simpler for
    // the client's retry logic.
    const inserted = await db
      .insert(usageEvents)
      .values({
        subscriptionId: sub?.id ?? null,
        userId: ctx.userId,
        sessionId: body.sessionId ?? null,
        idempotencyKey: body.idempotencyKey,
        inputTokens: body.inputTokens ?? null,
        outputTokens: body.outputTokens ?? null,
        cacheReadTokens: body.cacheReadTokens ?? null,
        cacheCreationTokens: body.cacheCreationTokens ?? null,
        billableTokens: Math.round(body.billableTokens),
        isByok: Boolean(body.isByok),
      })
      .onConflictDoNothing()
      .returning({ id: usageEvents.id });

    // Only increment the counter if this is a fresh (non-duplicate) event AND
    // the user is not BYOK — BYOK tokens are logged but unmetered.
    if (inserted.length > 0 && sub && !body.isByok) {
      await db
        .update(subscriptions)
        .set({
          tokensUsedThisPeriod: sql`${subscriptions.tokensUsedThisPeriod} + ${Math.round(body.billableTokens)}`,
          updatedAt: sql`now()`,
        })
        .where(eq(subscriptions.id, sub.id));
    }

    return NextResponse.json({ recorded: inserted.length > 0 });
  } catch (err) {
    console.error("[usage/record] failed:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
