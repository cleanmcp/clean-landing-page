import "server-only";
import Stripe from "stripe";

let _stripe: Stripe | null = null;

export function getStripe() {
  if (!_stripe) {
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: "2026-02-25.clover",
    });
  }
  return _stripe;
}

export async function createCheckoutSession({
  orgId,
  orgName,
  userId,
  email,
  priceId,
  successUrl,
  cancelUrl,
  quantity = 1,
}: {
  orgId: string;
  orgName: string;
  userId: string;
  email: string;
  priceId: string;
  successUrl: string;
  cancelUrl: string;
  quantity?: number;
}) {
  const session = await getStripe().checkout.sessions.create({
    mode: "subscription",
    payment_method_types: ["card"],
    customer_email: email,
    line_items: [{ price: priceId, quantity }],
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata: { orgId, orgName },
    subscription_data: {
      metadata: { orgId, orgName, userId },
    },
  });

  return session;
}

export async function createBillingPortalSession(customerId: string, returnUrl: string) {
  const session = await getStripe().billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
  });
  return session;
}
