import { NextResponse } from "next/server";
import { getAuthContext } from "@/lib/auth";
import { db } from "@/lib/db";
import { organizations } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getStripe } from "@/lib/stripe";

// GET /api/billing - Return current plan info and Stripe invoices
export async function GET() {
  try {
    const ctx = await getAuthContext();
    if (!ctx) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [org] = await db
      .select({
        tier: organizations.tier,
        licenseExpiresAt: organizations.licenseExpiresAt,
        licenseRevoked: organizations.licenseRevoked,
        stripeCustomerId: organizations.stripeCustomerId,
        stripeSubscriptionId: organizations.stripeSubscriptionId,
        stripePriceId: organizations.stripePriceId,
      })
      .from(organizations)
      .where(eq(organizations.id, ctx.orgId))
      .limit(1);

    if (!org) {
      return NextResponse.json(
        { error: "Organization not found" },
        { status: 404 }
      );
    }

    // Fetch subscription status from Stripe if available
    let subscriptionStatus: string | null = null;
    if (org.stripeSubscriptionId) {
      try {
        const sub = await getStripe().subscriptions.retrieve(
          org.stripeSubscriptionId
        );
        subscriptionStatus = sub.status;
      } catch {
        // Subscription may have been deleted
        subscriptionStatus = null;
      }
    }

    // Fetch recent invoices from Stripe
    let invoices: {
      id: string;
      amount: number;
      status: string;
      date: string;
      pdf: string | null;
    }[] = [];

    if (org.stripeCustomerId) {
      try {
        const stripeInvoices = await getStripe().invoices.list({
          customer: org.stripeCustomerId,
          limit: 12,
        });

        invoices = stripeInvoices.data.map((inv) => ({
          id: inv.id,
          amount: inv.amount_paid,
          status: inv.status ?? "unknown",
          date: new Date((inv.created) * 1000).toISOString().split("T")[0],
          pdf: inv.invoice_pdf ?? null,
        }));
      } catch {
        // Stripe error — return empty invoices rather than failing the whole request
        invoices = [];
      }
    }

    return NextResponse.json({
      tier: org.tier ?? "free",
      licenseExpiresAt: org.licenseExpiresAt
        ? org.licenseExpiresAt.toISOString().split("T")[0]
        : null,
      licenseRevoked: org.licenseRevoked ?? false,
      stripeSubscriptionId: org.stripeSubscriptionId ?? null,
      subscriptionStatus,
      invoices,
    });
  } catch (error) {
    console.error("Failed to fetch billing info:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
