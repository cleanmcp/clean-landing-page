import { db } from "@/lib/db";
import { organizations } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getStripe } from "@/lib/stripe";
import { generateLicenseKey } from "@/lib/license";
import { getAuthContext } from "@/lib/auth";

// Called after Stripe checkout redirect — verifies payment and provisions license
export async function POST(req: Request) {
  const ctx = await getAuthContext();
  if (!ctx) return Response.json({ error: "Unauthorized" }, { status: 401 });

  if (ctx.role !== "OWNER" && ctx.role !== "ADMIN") {
    return Response.json({ error: "Only owners and admins can provision licenses" }, { status: 403 });
  }

  const body = await req.json();
  const { sessionId } = body;
  if (!sessionId) {
    return Response.json({ error: "sessionId required" }, { status: 400 });
  }
  const hostingMode: "cloud" | "self-hosted" = body.hostingMode === "self-hosted" ? "self-hosted" : "cloud";

  const orgId = ctx.orgId;

  // Check if already has a valid license
  const [org] = await db
    .select({ licenseKey: organizations.licenseKey, licenseRevoked: organizations.licenseRevoked })
    .from(organizations)
    .where(eq(organizations.id, orgId));

  if (org?.licenseKey && !org?.licenseRevoked) {
    return Response.json({ licenseKey: org.licenseKey, alreadyProvisioned: true });
  }

  // Verify the Stripe checkout session
  const session = await getStripe().checkout.sessions.retrieve(sessionId);

  if (session.payment_status !== "paid") {
    return Response.json({ error: "Payment not completed" }, { status: 400 });
  }

  // Verify this session belongs to this org
  if (session.metadata?.orgId !== orgId) {
    return Response.json({ error: "Session mismatch" }, { status: 403 });
  }

  // Determine tier
  let tier = session.metadata?.tier || "pro";
  if (session.subscription) {
    try {
      const sub = await getStripe().subscriptions.retrieve(session.subscription as string);
      const priceId = sub.items.data[0]?.price?.id;
      if (priceId) {
        const price = await getStripe().prices.retrieve(priceId);
        const product = await getStripe().products.retrieve(price.product as string);
        if (product.metadata?.tier) tier = product.metadata.tier;
      }
    } catch {
      // fallback to metadata
    }
  }

  // Generate license
  const licenseKey = generateLicenseKey({
    customerId: orgId,
    tier,
    months: 12,
  });

  const claims = JSON.parse(
    Buffer.from(licenseKey.split(".")[1], "base64").toString()
  );

  await db
    .update(organizations)
    .set({
      stripeCustomerId: session.customer as string,
      stripeSubscriptionId: session.subscription as string,
      stripePriceId: session.metadata?.priceId || null,
      tier: tier as "free" | "pro" | "max" | "enterprise",
      licenseKey,
      licenseJti: claims.jti,
      licenseExpiresAt: new Date(claims.exp * 1000),
      licenseRevoked: false,
      hostingMode,
    })
    .where(eq(organizations.id, orgId));

  return Response.json({ licenseKey, tier });
}
