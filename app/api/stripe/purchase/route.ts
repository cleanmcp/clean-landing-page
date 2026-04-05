import { NextRequest, NextResponse } from "next/server";
import { getAuthContext } from "@/lib/auth";
import { db } from "@/lib/db";
import { organizations, users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getStripe } from "@/lib/stripe";

const PLAN_PRICE_MAP: Record<string, string | undefined> = {
  pro: process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID,
  team: process.env.NEXT_PUBLIC_STRIPE_TEAM_PRICE_ID,
};

export async function POST(request: NextRequest) {
  try {
    const ctx = await getAuthContext();
    if (!ctx) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { userId, orgId } = ctx;

    // Read plan from form body
    const formData = await request.formData();
    const plan = formData.get("plan") as string | null;
    const priceId = plan ? PLAN_PRICE_MAP[plan] : undefined;

    if (!priceId) {
      return NextResponse.json(
        { error: "Invalid plan. Use 'pro' or 'team'." },
        { status: 400 }
      );
    }

    const [org] = await db
      .select({ stripeCustomerId: organizations.stripeCustomerId })
      .from(organizations)
      .where(eq(organizations.id, orgId))
      .limit(1);

    if (!org) {
      return NextResponse.json({ error: "Organization not found" }, { status: 404 });
    }

    let stripeCustomerId = org.stripeCustomerId;

    if (!stripeCustomerId) {
      const [user] = await db
        .select({ email: users.email })
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      const customer = await getStripe().customers.create({
        email: user?.email ?? undefined,
        metadata: { userId, orgId },
      });
      stripeCustomerId = customer.id;

      await db
        .update(organizations)
        .set({ stripeCustomerId })
        .where(eq(organizations.id, orgId));
    }

    const origin = request.headers.get("origin") || new URL(request.url).origin;
    const session = await getStripe().checkout.sessions.create({
      customer: stripeCustomerId,
      line_items: [{ price: priceId, quantity: 1 }],
      mode: "subscription",
      metadata: { userId, orgId, plan: plan! },
      subscription_data: {
        metadata: { userId, orgId, plan: plan! },
      },
      success_url: `${origin}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/pricing-plan`,
    });

    if (!session.url) {
      return NextResponse.json({ error: "Failed to create Stripe session" }, { status: 500 });
    }

    return NextResponse.redirect(session.url, 303);
  } catch (err) {
    console.error("Error in /api/stripe/purchase:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
