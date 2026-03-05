import { stripe } from "@/lib/stripe";
import { db } from "@/lib/db";
import { organizations } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { generateLicenseKey } from "@/lib/license";
import Stripe from "stripe";

export async function POST(req: Request) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature");

  if (!sig || !process.env.STRIPE_WEBHOOK_SECRET) {
    return Response.json({ error: "Missing signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error("Stripe webhook verification failed:", err);
    return Response.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const orgId = session.metadata?.orgId;

    if (!orgId) {
      console.error("No orgId in checkout session metadata");
      return Response.json({ error: "Missing orgId" }, { status: 400 });
    }

    // Determine tier from price
    const tier = await getTierFromSession(session);

    // Generate license
    const licenseKey = generateLicenseKey({
      customerId: orgId,
      tier,
      months: 12,
    });

    // Update org with Stripe info + license
    await db
      .update(organizations)
      .set({
        stripeCustomerId: session.customer as string,
        stripeSubscriptionId: session.subscription as string,
        stripePriceId: session.metadata?.priceId || null,
        tier: tier as "free" | "pro" | "enterprise",
        licenseKey,
        licenseJti: JSON.parse(
          Buffer.from(licenseKey.split(".")[1], "base64").toString()
        ).jti,
        licenseExpiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        licenseRevoked: false,
      })
      .where(eq(organizations.id, orgId));
  }

  if (event.type === "customer.subscription.deleted") {
    const subscription = event.data.object as Stripe.Subscription;
    const orgId = subscription.metadata?.orgId;

    if (orgId) {
      await db
        .update(organizations)
        .set({
          tier: "free",
          licenseRevoked: true,
          stripeSubscriptionId: null,
          stripePriceId: null,
        })
        .where(eq(organizations.id, orgId));
    }
  }

  return Response.json({ received: true });
}

async function getTierFromSession(session: Stripe.Checkout.Session): Promise<string> {
  // Check metadata first
  if (session.metadata?.tier) return session.metadata.tier;

  // Try to determine from price
  if (session.subscription) {
    try {
      const sub = await stripe.subscriptions.retrieve(session.subscription as string);
      const priceId = sub.items.data[0]?.price?.id;
      if (priceId) {
        const price = await stripe.prices.retrieve(priceId);
        const product = await stripe.products.retrieve(price.product as string);
        // Check product metadata for tier
        if (product.metadata?.tier) return product.metadata.tier;
        // Fallback: match by product name
        const name = product.name.toLowerCase();
        if (name.includes("enterprise")) return "enterprise";
        if (name.includes("pro")) return "pro";
      }
    } catch {
      // fallback
    }
  }

  return "pro"; // default for paid plans
}
