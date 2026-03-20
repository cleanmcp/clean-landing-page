import { db } from "@/lib/db";
import { users, organizations, orgMembers } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";
import { createCheckoutSession } from "@/lib/stripe";
import { getAuthContext } from "@/lib/auth";

export async function POST(req: Request) {
  const ctx = await getAuthContext();
  if (!ctx) return Response.json({ error: "Unauthorized" }, { status: 401 });

  if (ctx.role !== "OWNER" && ctx.role !== "ADMIN") {
    return Response.json({ error: "Only owners and admins can manage billing" }, { status: 403 });
  }

  const { priceId } = await req.json();
  if (!priceId) {
    return Response.json({ error: "priceId is required" }, { status: 400 });
  }

  // Server-side allowlist: only accept known Stripe price IDs
  const allowedPriceIds = [
    process.env.STRIPE_PRO_PRICE_ID,
    process.env.STRIPE_MAX_PRICE_ID,
  ].filter(Boolean);

  if (!allowedPriceIds.includes(priceId)) {
    return Response.json({ error: "Invalid plan selected" }, { status: 400 });
  }

  // Get user info
  const [user] = await db
    .select({ email: users.email })
    .from(users)
    .where(eq(users.id, ctx.userId));

  if (!user?.email) {
    return Response.json({ error: "User not found" }, { status: 404 });
  }

  const orgId = ctx.orgId;
  const [org] = await db
    .select({ name: organizations.name })
    .from(organizations)
    .where(eq(organizations.id, orgId));

  // Count org members for per-seat billing
  const [memberCount] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(orgMembers)
    .where(eq(orgMembers.orgId, orgId));

  const seatCount = Math.max(memberCount?.count ?? 1, 1);

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://tryclean.ai";

  try {
    const session = await createCheckoutSession({
      orgId,
      orgName: org?.name || "Unknown",
      email: user.email,
      priceId,
      quantity: seatCount,
      successUrl: `${baseUrl}/dashboard?setup=complete&session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl: `${baseUrl}/dashboard?setup=cancelled`,
    });

    return Response.json({ url: session.url });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[stripe/checkout] Failed to create session:", message);
    return Response.json({ error: message }, { status: 500 });
  }
}
