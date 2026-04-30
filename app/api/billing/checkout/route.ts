import { NextRequest, NextResponse } from "next/server";
import { getAuthContext } from "@/lib/auth";
import { currentUser } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { organizations } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { createCheckoutSession } from "@/lib/stripe";
import { AGENT_TIERS, type AgentTierKey } from "@/lib/agent-tiers";

/**
 * POST /api/billing/checkout
 * Body: { plan: "starter" | "pro" }
 *
 * Creates a Stripe Checkout session for an Agent-product subscription.
 * Enterprise has no checkout path — it's handled by sales.
 *
 * Returns `{ url }` for the Stripe-hosted checkout page. Electron opens the
 * URL in the default browser via shell.openExternal.
 */
export async function POST(req: NextRequest) {
  try {
    const ctx = await getAuthContext();
    if (!ctx) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await req.json().catch(() => ({}))) as { plan?: string };
    const plan = body.plan as AgentTierKey | undefined;
    if (!plan || plan === "enterprise" || !AGENT_TIERS[plan]) {
      return NextResponse.json(
        { error: "Invalid plan. Must be 'starter' or 'pro'." },
        { status: 400 },
      );
    }

    const tier = AGENT_TIERS[plan];
    const priceId = tier.priceIdEnv ? process.env[tier.priceIdEnv] : undefined;
    if (!priceId) {
      return NextResponse.json(
        { error: `Price ID not configured for ${plan}` },
        { status: 500 },
      );
    }

    const [org] = await db
      .select()
      .from(organizations)
      .where(eq(organizations.id, ctx.orgId))
      .limit(1);
    if (!org) {
      return NextResponse.json({ error: "Org not found" }, { status: 404 });
    }

    const user = await currentUser();
    const email = user?.emailAddresses?.[0]?.emailAddress ?? "";

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://tryclean.ai";
    const successUrl =
      process.env.AGENT_CHECKOUT_SUCCESS_URL ??
      `${appUrl}/success?product=agent`;
    const cancelUrl =
      process.env.AGENT_CHECKOUT_CANCEL_URL ??
      `${appUrl}/pricing?canceled=1`;

    const session = await createCheckoutSession({
      orgId: org.id,
      orgName: org.name,
      userId: ctx.userId,
      email,
      priceId,
      successUrl,
      cancelUrl,
      quantity: 1,
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("[billing/checkout] failed:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
