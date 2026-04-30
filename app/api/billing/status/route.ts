import { NextResponse } from "next/server";
import { getAuthContext } from "@/lib/auth";
import { db } from "@/lib/db";
import { subscriptions } from "@/lib/db/schema";
import { eq, and, desc, inArray } from "drizzle-orm";
import { AGENT_TIERS, type AgentTierKey } from "@/lib/agent-tiers";

/**
 * GET /api/billing/status
 *
 * Returns the caller's Agent-product subscription state. Cloud subscriptions
 * are intentionally ignored — this endpoint exists to gate the Electron app,
 * which requires its own Agent subscription regardless of any cloud plan.
 *
 * Response shape is designed to be consumed directly by the Electron
 * BillingGate: `state` is the primary dispatch; agent-tier metadata is
 * included for paywall/upgrade UI.
 */
export async function GET() {
  try {
    const ctx = await getAuthContext();
    if (!ctx) {
      return NextResponse.json(
        { state: "unauthenticated" },
        { status: 401 },
      );
    }

    const rows = await db
      .select()
      .from(subscriptions)
      .where(
        and(
          eq(subscriptions.userId, ctx.userId),
          eq(subscriptions.product, "agent"),
          inArray(subscriptions.status, [
            "active",
            "trialing",
            "past_due",
          ]),
        ),
      )
      .orderBy(desc(subscriptions.currentPeriodEnd))
      .limit(1);

    const sub = rows[0];
    if (!sub) {
      return NextResponse.json({ state: "none" });
    }

    const tierKey = (sub.tierKey ?? "starter") as AgentTierKey;
    const tierMeta = AGENT_TIERS[tierKey] ?? AGENT_TIERS.starter;
    const tokensUsed = sub.tokensUsedThisPeriod ?? 0;
    const tokensLimit = sub.tokensLimit ?? tierMeta.tokensPerMonth;
    const unlimited = tokensLimit === -1;
    const remaining = unlimited
      ? Number.POSITIVE_INFINITY
      : Math.max(0, tokensLimit - tokensUsed);

    return NextResponse.json({
      state: sub.status === "past_due" ? "past_due" : "active",
      tier: tierKey,
      tierLabel: tierMeta.label,
      priceUsd: tierMeta.priceUsd,
      tokensUsed,
      tokensLimit,
      remaining: unlimited ? -1 : remaining,
      currentPeriodEnd: sub.currentPeriodEnd.toISOString(),
      cancelAtPeriodEnd: sub.cancelAtPeriodEnd,
    });
  } catch (err) {
    console.error("[billing/status] failed:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
