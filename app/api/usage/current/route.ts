import { NextResponse } from "next/server";
import { getAuthContext } from "@/lib/auth";
import { db } from "@/lib/db";
import { subscriptions } from "@/lib/db/schema";
import { eq, and, desc, inArray } from "drizzle-orm";

/**
 * GET /api/usage/current
 *
 * Pre-send quota probe for the Electron main process. Returns a minimal shape
 * so the client can cheaply decide whether to send the next message.
 *
 * `remaining: -1` means unlimited (enterprise, or no enforcement because the
 * user has no Agent subscription row at all — the BillingGate handles the
 * gate; this endpoint is purely about the token counter).
 */
export async function GET() {
  try {
    const ctx = await getAuthContext();
    if (!ctx) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [sub] = await db
      .select({
        tokensUsedThisPeriod: subscriptions.tokensUsedThisPeriod,
        tokensLimit: subscriptions.tokensLimit,
        currentPeriodEnd: subscriptions.currentPeriodEnd,
        status: subscriptions.status,
      })
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

    if (!sub) {
      // No active agent sub — the caller's BillingGate should have blocked
      // sends already, but return a deterministic shape anyway.
      return NextResponse.json({
        tokensUsed: 0,
        tokensLimit: 0,
        remaining: 0,
        hasSubscription: false,
      });
    }

    const tokensLimit = sub.tokensLimit ?? 0;
    const tokensUsed = sub.tokensUsedThisPeriod ?? 0;
    const unlimited = tokensLimit === -1;
    const remaining = unlimited
      ? -1
      : Math.max(0, tokensLimit - tokensUsed);

    return NextResponse.json({
      tokensUsed,
      tokensLimit,
      remaining,
      hasSubscription: true,
      currentPeriodEnd: sub.currentPeriodEnd.toISOString(),
    });
  } catch (err) {
    console.error("[usage/current] failed:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
