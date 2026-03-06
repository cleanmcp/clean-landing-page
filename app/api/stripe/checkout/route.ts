import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { users, organizations, orgMembers } from "@/lib/db/schema";
import { eq, desc, and, sql } from "drizzle-orm";
import { createCheckoutSession } from "@/lib/stripe";

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { priceId } = await req.json();
  if (!priceId) {
    return Response.json({ error: "priceId is required" }, { status: 400 });
  }

  // Get user info
  const [user] = await db
    .select({ email: users.email })
    .from(users)
    .where(eq(users.id, userId));

  if (!user?.email) {
    return Response.json({ error: "User not found" }, { status: 404 });
  }

  // Get user's org
  const membership = await db
    .select({ orgId: orgMembers.orgId })
    .from(orgMembers)
    .where(eq(orgMembers.userId, userId))
    .orderBy(desc(orgMembers.joinedAt))
    .limit(1);

  if (membership.length === 0) {
    return Response.json({ error: "No organization found" }, { status: 400 });
  }

  const orgId = membership[0].orgId;
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
}
