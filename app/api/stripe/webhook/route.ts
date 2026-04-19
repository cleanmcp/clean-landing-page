import { NextRequest, NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { db } from "@/lib/db";
import {
  organizations,
  subscriptions,
  paymentTransactions,
  stripeWebhookEvents,
  orgMembers,
  type SubscriptionStatus,
} from "@/lib/db/schema";
import { eq, sql, and } from "drizzle-orm";
import type Stripe from "stripe";
import { syncAllKeysForOrg } from "@/lib/engine-sync";
import { enforceRepoLimits } from "@/lib/enforce-repo-limits";
import { getCreditConfig } from "@/lib/tier-limits";

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

function creditFields(tier: string, periodEnd: Date | null) {
  const c = getCreditConfig(tier);
  const now = new Date();
  return {
    creditBalance: c.grantMonthly,
    creditGrantMonthly: c.grantMonthly,
    creditsPerSearch: c.creditsPerSearch,
    creditRolloverCap: c.rolloverCap,
    overageCap: c.overageCap,
    overageUsed: 0,
    creditPeriodStart: now,
    creditPeriodEnd: periodEnd ?? new Date(now.getTime() + THIRTY_DAYS_MS),
  };
}

/** Safely convert a Stripe Unix timestamp (seconds) to a Date, or null. */
function toDate(ts: number | null | undefined): Date | null {
  if (ts == null) return null;
  const d = new Date(ts * 1000);
  return isNaN(d.getTime()) ? null : d;
}

// Price ID → plan + org tier + seat limit mapping
// seatLimit: null = unlimited
type PlanTier = "free" | "pro" | "max" | "enterprise";
type PlanInfo = { plan: PlanTier; tier: PlanTier; seatLimit: number | null };

const PRICE_PLAN_MAP: Record<string, PlanInfo> = {};

// Populated at startup from env vars so we don't hardcode Stripe price IDs
if (process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID) {
  PRICE_PLAN_MAP[process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID] = { plan: "pro", tier: "pro", seatLimit: 5 };
}
if (process.env.NEXT_PUBLIC_STRIPE_MAX_PRICE_ID) {
  PRICE_PLAN_MAP[process.env.NEXT_PUBLIC_STRIPE_MAX_PRICE_ID] = { plan: "max", tier: "max", seatLimit: 10 };
}

function getPlanFromPriceId(priceId: string): PlanInfo {
  return PRICE_PLAN_MAP[priceId] ?? { plan: "pro", tier: "pro", seatLimit: 5 };
}

/** Returns true if the event was already processed (duplicate delivery). */
async function markEventProcessed(eventId: string, eventType: string): Promise<boolean> {
  const result = await db
    .insert(stripeWebhookEvents)
    .values({ id: eventId, type: eventType })
    .onConflictDoNothing()
    .returning({ id: stripeWebhookEvents.id });
  return result.length === 0;
}

// ---------------------------------------------------------------------------
// customer.subscription.created
// Primary handler for new subscriptions — fires before checkout.session.completed,
// has the full sub object, and sub.metadata carries userId + orgId.
// ---------------------------------------------------------------------------
async function handleSubscriptionCreated(sub: Stripe.Subscription) {
  const userId = sub.metadata?.userId;
  const orgId = sub.metadata?.orgId;

  if (!userId || !orgId) {
    console.warn(
      `[webhook] customer.subscription.created: missing metadata userId/orgId on sub ${sub.id}`
    );
    return;
  }

  const firstItem = sub.items.data[0];
  const priceId = firstItem?.price.id ?? "";
  const { plan, tier, seatLimit } = getPlanFromPriceId(priceId);
  const periodStart = toDate(firstItem?.current_period_start) ?? new Date();
  const periodEnd = toDate(firstItem?.current_period_end) ?? new Date();

  await Promise.all([
    db
      .insert(subscriptions)
      .values({
        stripeSubscriptionId: sub.id,
        stripeCustomerId: sub.customer as string,
        orgId,
        userId,
        status: sub.status as SubscriptionStatus,
        plan,
        stripePriceId: priceId,
        currentPeriodStart: periodStart,
        currentPeriodEnd: periodEnd,
        cancelAtPeriodEnd: sub.cancel_at_period_end,
        canceledAt: toDate(sub.canceled_at),
        trialEnd: toDate(sub.trial_end),
      })
      .onConflictDoNothing(),
    db
      .update(organizations)
      .set({
        tier,
        seatLimit,
        licenseExpiresAt: periodEnd,
        stripeCustomerId: sub.customer as string,
        ...creditFields(tier, periodEnd),
      })
      .where(eq(organizations.id, orgId)),
  ]);

  // Re-sync all keys so engine picks up new tier limits
  syncAllKeysForOrg(orgId).catch((err) =>
    console.error(`[webhook] Failed to re-sync keys for org ${orgId}:`, err)
  );

  // Pause/unpause repos to match new plan limits
  enforceRepoLimits(orgId).catch((err) =>
    console.error(`[webhook] Failed to enforce repo limits for org ${orgId}:`, err)
  );
}

// ---------------------------------------------------------------------------
// customer.subscription.updated
// ---------------------------------------------------------------------------
async function handleSubscriptionUpdated(sub: Stripe.Subscription) {
  const firstItem = sub.items.data[0];
  const priceId = firstItem?.price.id ?? "";
  const { tier, seatLimit } = getPlanFromPriceId(priceId);
  const periodStart = toDate(firstItem?.current_period_start) ?? new Date();
  const periodEnd = toDate(firstItem?.current_period_end) ?? new Date();

  await db
    .update(subscriptions)
    .set({
      status: sub.status as SubscriptionStatus,
      stripePriceId: priceId,
      currentPeriodStart: periodStart,
      currentPeriodEnd: periodEnd,
      cancelAtPeriodEnd: sub.cancel_at_period_end,
      canceledAt: toDate(sub.canceled_at),
      trialEnd: toDate(sub.trial_end),
      updatedAt: sql`now()`,
    })
    .where(eq(subscriptions.stripeSubscriptionId, sub.id));

  // Resolve orgId: prefer DB row, fall back to sub metadata
  const [existing] = await db
    .select({ orgId: subscriptions.orgId })
    .from(subscriptions)
    .where(eq(subscriptions.stripeSubscriptionId, sub.id))
    .limit(1);

  const orgId = existing?.orgId ?? sub.metadata?.orgId ?? null;
  if (orgId) {
    await db
      .update(organizations)
      .set({ tier, seatLimit, licenseExpiresAt: periodEnd, ...creditFields(tier, periodEnd) })
      .where(eq(organizations.id, orgId));

    // Re-sync all keys so engine picks up new tier limits + credit balance
    syncAllKeysForOrg(orgId).catch((err) =>
      console.error(`[webhook] Failed to re-sync keys for org ${orgId}:`, err)
    );

    // Pause/unpause repos to match new plan limits
    enforceRepoLimits(orgId).catch((err) =>
      console.error(`[webhook] Failed to enforce repo limits for org ${orgId}:`, err)
    );
  }
}

// ---------------------------------------------------------------------------
// customer.subscription.deleted
// ---------------------------------------------------------------------------
async function handleSubscriptionDeleted(sub: Stripe.Subscription) {
  // Grab orgId before updating
  const [existing] = await db
    .select({ orgId: subscriptions.orgId })
    .from(subscriptions)
    .where(eq(subscriptions.stripeSubscriptionId, sub.id))
    .limit(1);

  await db
    .update(subscriptions)
    .set({
      status: "canceled",
      canceledAt: toDate(sub.canceled_at) ?? new Date(),
      updatedAt: sql`now()`,
    })
    .where(eq(subscriptions.stripeSubscriptionId, sub.id));

  const orgId = existing?.orgId ?? sub.metadata?.orgId ?? null;
  if (orgId) {
    await db
      .update(organizations)
      .set({ tier: "free", seatLimit: 1, licenseExpiresAt: null, ...creditFields("free", null) })
      .where(eq(organizations.id, orgId));

    // Re-sync all keys so engine picks up free-tier limits
    syncAllKeysForOrg(orgId).catch((err) =>
      console.error(`[webhook] Failed to re-sync keys for org ${orgId}:`, err)
    );

    // Pause excess repos that no longer fit the free tier
    enforceRepoLimits(orgId).catch((err) =>
      console.error(`[webhook] Failed to enforce repo limits for org ${orgId}:`, err)
    );
  }
}

// ---------------------------------------------------------------------------
// invoice.payment_succeeded
// ---------------------------------------------------------------------------
async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
  const subField = invoice.parent?.subscription_details?.subscription;
  const stripeSubId =
    typeof subField === "string"
      ? subField
      : subField?.id ?? null;

  const customerId =
    typeof invoice.customer === "string"
      ? invoice.customer
      : invoice.customer?.id ?? null;

  // 1. Try to find subscription row by Stripe sub ID
  let subRecord: { id: string; orgId: string | null; userId: string } | null = null;
  if (stripeSubId) {
    const [row] = await db
      .select({
        id: subscriptions.id,
        orgId: subscriptions.orgId,
        userId: subscriptions.userId,
      })
      .from(subscriptions)
      .where(eq(subscriptions.stripeSubscriptionId, stripeSubId))
      .limit(1);
    subRecord = row ?? null;
  }

  // 2. Fallback: race condition guard — look up org via Stripe customer ID,
  //    and userId via the org's owner in org_members.
  let orgId: string | null = subRecord?.orgId ?? null;
  let userId: string | null = subRecord?.userId ?? null;

  if ((!orgId || !userId) && customerId) {
    const [org] = await db
      .select({ id: organizations.id })
      .from(organizations)
      .where(eq(organizations.stripeCustomerId, customerId))
      .limit(1);

    if (org) {
      orgId = orgId ?? org.id;

      if (!userId) {
        const [owner] = await db
          .select({ userId: orgMembers.userId })
          .from(orgMembers)
          .where(and(eq(orgMembers.orgId, org.id), eq(orgMembers.role, "OWNER")))
          .limit(1);
        userId = owner?.userId ?? null;
      }
    }
  }

  const paidAt = toDate(invoice.status_transitions?.paid_at);

  await db
    .insert(paymentTransactions)
    .values({
      subscriptionId: subRecord?.id ?? null,
      stripeInvoiceId: invoice.id!,
      stripePaymentIntentId: (() => {
        const pi = invoice.payments?.data?.[0]?.payment?.payment_intent;
        return typeof pi === "string" ? pi : pi?.id ?? null;
      })(),
      orgId,
      userId,
      amountPaid: invoice.amount_paid,
      currency: invoice.currency,
      status: invoice.status ?? "paid",
      billingReason: invoice.billing_reason ?? null,
      periodStart: toDate(invoice.period_start),
      periodEnd: toDate(invoice.period_end),
      paidAt,
    })
    .onConflictDoNothing();

  // Keep license_expires_at in sync with invoice period and reset credits
  const invoicePeriodEnd = toDate(invoice.period_end);
  if (orgId) {
    const [org] = await db
      .select({ tier: organizations.tier })
      .from(organizations)
      .where(eq(organizations.id, orgId))
      .limit(1);

    const tier = org?.tier ?? "free";

    await db
      .update(organizations)
      .set({
        ...(invoicePeriodEnd ? { licenseExpiresAt: invoicePeriodEnd } : {}),
        ...creditFields(tier, invoicePeriodEnd),
      })
      .where(eq(organizations.id, orgId));

    // Re-sync keys so engine picks up refreshed credit balance
    syncAllKeysForOrg(orgId).catch((err) =>
      console.error(`[webhook] Failed to re-sync keys for org ${orgId}:`, err)
    );
  }
}

// ---------------------------------------------------------------------------
// invoice.payment_failed
// ---------------------------------------------------------------------------
async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  const subField = invoice.parent?.subscription_details?.subscription;
  const stripeSubId =
    typeof subField === "string"
      ? subField
      : subField?.id ?? null;
  if (!stripeSubId) return;

  await db
    .update(subscriptions)
    .set({ status: "past_due", updatedAt: sql`now()` })
    .where(eq(subscriptions.stripeSubscriptionId, stripeSubId));
}

// ---------------------------------------------------------------------------
// Route handler
// ---------------------------------------------------------------------------
export async function POST(request: NextRequest) {
  const rawBody = await request.text();
  const sig = request.headers.get("stripe-signature");

  if (!sig) {
    return NextResponse.json({ error: "Missing stripe-signature header" }, { status: 400 });
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error("[webhook] STRIPE_WEBHOOK_SECRET is not set");
    return NextResponse.json({ error: "Webhook secret not configured" }, { status: 500 });
  }

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(rawBody, sig, webhookSecret);
  } catch (err) {
    console.error("[webhook] Signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  // Idempotency guard — wrapped so a DB hiccup here doesn't block everything
  try {
    const alreadyProcessed = await markEventProcessed(event.id, event.type);
    if (alreadyProcessed) {
      return NextResponse.json({ received: true });
    }
  } catch (err) {
    console.error(`[webhook] Failed to record idempotency for ${event.id}:`, err);
    // Continue processing — better to handle twice than drop
  }

  try {
    switch (event.type) {
      case "customer.subscription.created":
        await handleSubscriptionCreated(event.data.object as Stripe.Subscription);
        break;
      case "customer.subscription.updated":
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
        break;
      case "customer.subscription.deleted":
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;
      case "invoice.payment_succeeded":
        await handleInvoicePaymentSucceeded(event.data.object as Stripe.Invoice);
        break;
      case "invoice.payment_failed":
        await handleInvoicePaymentFailed(event.data.object as Stripe.Invoice);
        break;
      default:
        break;
    }
  } catch (err) {
    console.error(`[webhook] Error handling ${event.type} (${event.id}):`, err);
    return NextResponse.json({ error: "Handler error" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
