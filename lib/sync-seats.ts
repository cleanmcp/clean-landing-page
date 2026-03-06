import "server-only";
import { db } from "@/lib/db";
import { orgMembers, organizations } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";
import { stripe } from "@/lib/stripe";

/**
 * Sync the Stripe subscription seat quantity with the actual member count.
 * Call this whenever members are added or removed from an org.
 */
export async function syncSeatCount(orgId: string): Promise<void> {
  // Count current members
  const [memberCount] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(orgMembers)
    .where(eq(orgMembers.orgId, orgId));

  const seats = Math.max(memberCount?.count ?? 1, 1);

  // Get the org's Stripe subscription
  const [org] = await db
    .select({ stripeSubscriptionId: organizations.stripeSubscriptionId })
    .from(organizations)
    .where(eq(organizations.id, orgId))
    .limit(1);

  if (!org?.stripeSubscriptionId) return;

  try {
    const sub = await stripe.subscriptions.retrieve(org.stripeSubscriptionId);
    const item = sub.items.data[0];
    if (!item) return;

    if (item.quantity !== seats) {
      await stripe.subscriptionItems.update(item.id, { quantity: seats });
    }
  } catch (err) {
    console.error(`[sync-seats] Failed to sync seats for org ${orgId}:`, err);
  }
}
