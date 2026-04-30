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
import { getCreditGrant } from "@/lib/tier-limits";
import { getAgentSubPlanFromPriceId } from "@/lib/agent-tiers";

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
      `[webhook] customer.subscription.created: missing metadata userId/orgId on sub ${sub.id}. metadata=${JSON.stringify(sub.metadata)}`
    );
    return;
  }

  const firstItem = sub.items.data[0];
  const priceId = firstItem?.price.id ?? "";
  console.log(
    `[webhook] subscription.created sub=${sub.id} price=${priceId} user=${userId} org=${orgId}`
  );
  const periodStart = toDate(firstItem?.current_period_start) ?? new Date();
  const periodEnd = toDate(firstItem?.current_period_end) ?? new Date();

  // Agent product — persist metering fields and DO NOT touch organizations.tier.
  // The agent subscription is independent of any cloud subscription the user
  // might also hold; they bill separately and unlock different surfaces.
  const agentPlan = getAgentSubPlanFromPriceId(priceId);
  if (agentPlan) {
    console.log(`[webhook] → agent branch tier=${agentPlan.tierKey} limit=${agentPlan.tokensLimit}`);
    await db
      .insert(subscriptions)
      .values({
        stripeSubscriptionId: sub.id,
        stripeCustomerId: sub.customer as string,
        orgId,
        userId,
        status: sub.status as SubscriptionStatus,
        plan: agentPlan.plan,
        stripePriceId: priceId,
        currentPeriodStart: periodStart,
        currentPeriodEnd: periodEnd,
        cancelAtPeriodEnd: sub.cancel_at_period_end,
        canceledAt: toDate(sub.canceled_at),
        trialEnd: toDate(sub.trial_end),
        product: "agent",
        tierKey: agentPlan.tierKey,
        tokensUsedThisPeriod: 0,
        tokensLimit: agentPlan.tokensLimit,
      })
      .onConflictDoNothing();
    console.log(`[webhook] ✓ inserted agent subscription ${sub.id}`);
    return;
  }

  console.log(`[webhook] → cloud branch (no agent plan matched price ${priceId})`);

  // Cloud product (existing flow) — unchanged.
  const { plan, tier, seatLimit } = getPlanFromPriceId(priceId);

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
        creditBalance: getCreditGrant(tier),
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
  const periodStart = toDate(firstItem?.current_period_start) ?? new Date();
  const periodEnd = toDate(firstItem?.current_period_end) ?? new Date();

  // Agent product: update metering fields and reset usage for the new period.
  const agentPlan = getAgentSubPlanFromPriceId(priceId);
  if (agentPlan) {
    await db
      .update(subscriptions)
      .set({
        status: sub.status as SubscriptionStatus,
        stripePriceId: priceId,
        plan: agentPlan.plan,
        currentPeriodStart: periodStart,
        currentPeriodEnd: periodEnd,
        cancelAtPeriodEnd: sub.cancel_at_period_end,
        canceledAt: toDate(sub.canceled_at),
        trialEnd: toDate(sub.trial_end),
        product: "agent",
        tierKey: agentPlan.tierKey,
        tokensUsedThisPeriod: 0,
        tokensLimit: agentPlan.tokensLimit,
        updatedAt: sql`now()`,
      })
      .where(eq(subscriptions.stripeSubscriptionId, sub.id));
    return;
  }

  // Cloud product (existing flow) — unchanged.
  const { tier, seatLimit } = getPlanFromPriceId(priceId);

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
      .set({ tier, seatLimit, licenseExpiresAt: periodEnd, creditBalance: getCreditGrant(tier) })
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
  // Grab orgId + product before updating so cloud cleanup only runs for cloud subs.
  const [existing] = await db
    .select({ orgId: subscriptions.orgId, product: subscriptions.product })
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

  // Agent subs: cancellation flips status; nothing to reset on organizations.
  if (existing?.product === "agent") {
    return;
  }

  const orgId = existing?.orgId ?? sub.metadata?.orgId ?? null;
  if (orgId) {
    await db
      .update(organizations)
      .set({ tier: "free", seatLimit: 1, licenseExpiresAt: null, creditBalance: getCreditGrant("free") })
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
  let subRecord:
    | { id: string; orgId: string | null; userId: string; product: string }
    | null = null;
  if (stripeSubId) {
    const [row] = await db
      .select({
        id: subscriptions.id,
        orgId: subscriptions.orgId,
        userId: subscriptions.userId,
        product: subscriptions.product,
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

  // Agent-product sub: reset the per-period token counter on renewal.
  // Skip the cloud-only licenseExpiresAt/creditBalance reset below.
  if (subRecord?.product === "agent" && subRecord.id) {
    await db
      .update(subscriptions)
      .set({
        tokensUsedThisPeriod: 0,
        currentPeriodEnd: toDate(invoice.period_end) ?? sql`current_period_end`,
        updatedAt: sql`now()`,
      })
      .where(eq(subscriptions.id, subRecord.id));
    return;
  }

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
        creditBalance: getCreditGrant(tier),
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

  console.log(`[webhook] → ${event.type} (${event.id})`);

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
      case "invoice_payment.paid": {
        // v2 event (Stripe API 2026+). Payload is an InvoicePayment, not an
        // Invoice, so we fetch the underlying invoice and reuse the existing
        // handler. This fires in addition to `invoice.payment_succeeded` on
        // most accounts, but on some 2026+ accounts it's the only signal.
        const ip = event.data.object as { invoice?: string };
        if (ip.invoice && typeof ip.invoice === "string") {
          try {
            const invoice = await getStripe().invoices.retrieve(ip.invoice);
            await handleInvoicePaymentSucceeded(invoice);
          } catch (err) {
            console.error(
              `[webhook] invoice_payment.paid: failed to retrieve invoice ${ip.invoice}:`,
              err,
            );
          }
        }
        break;
      }
      default:
        break;
    }
  } catch (err) {
    console.error(`[webhook] Error handling ${event.type} (${event.id}):`, err);
    return NextResponse.json({ error: "Handler error" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
