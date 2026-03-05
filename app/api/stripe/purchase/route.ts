import { NextRequest, NextResponse } from "next/server";
import { getAuthContext } from "@/lib/auth";
import { db } from "@/lib/db";
import { organizations, users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { stripe } from "@/lib/stripe";

export async function POST(request: NextRequest) {
  try {
    // 1. Auth check (Clerk session required)
    const ctx = await getAuthContext();
    if (!ctx) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { userId, orgId } = ctx;

    // 2. Look up org to get or create Stripe customer
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
      // Look up user email for customer creation
      const [user] = await db
        .select({ email: users.email })
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      const customer = await stripe.customers.create({
        email: user?.email ?? undefined,
        metadata: { userId, orgId },
      });
      stripeCustomerId = customer.id;

      await db
        .update(organizations)
        .set({ stripeCustomerId })
        .where(eq(organizations.id, orgId));
    }

    // 3. Create Checkout Session with customer and metadata
    const origin = request.headers.get("origin") || new URL(request.url).origin;
    const session = await stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      line_items: [
        {
          price: "price_1T6IjXBWaGrUIdMvnsUHzpnY",
          quantity: 1,
        },
      ],
      mode: "subscription",
      metadata: { userId, orgId },
      subscription_data: {
        metadata: { userId, orgId },
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
