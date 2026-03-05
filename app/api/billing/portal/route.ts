import { NextResponse } from "next/server";
import { getAuthContext } from "@/lib/auth";
import { db } from "@/lib/db";
import { organizations } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { createBillingPortalSession } from "@/lib/stripe";

// POST /api/billing/portal - Create a Stripe billing portal session
export async function POST() {
  try {
    const ctx = await getAuthContext();
    if (!ctx) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [org] = await db
      .select({ stripeCustomerId: organizations.stripeCustomerId })
      .from(organizations)
      .where(eq(organizations.id, ctx.orgId))
      .limit(1);

    if (!org) {
      return NextResponse.json(
        { error: "Organization not found" },
        { status: 404 }
      );
    }

    if (!org.stripeCustomerId) {
      return NextResponse.json(
        { error: "No billing account found. Please subscribe to a plan first." },
        { status: 400 }
      );
    }

    const returnUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? "https://tryclean.ai"}/dashboard/billing`;

    const session = await createBillingPortalSession(
      org.stripeCustomerId,
      returnUrl
    );

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Failed to create billing portal session:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
