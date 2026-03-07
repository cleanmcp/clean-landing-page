import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { organizations, orgMembers } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { generateLicenseKey } from "@/lib/license";

export async function POST() {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  // Free tier is always cloud-hosted.
  const hostingMode: "cloud" | "self-hosted" = "cloud";

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

  // Check if already has a license
  const [org] = await db
    .select({ licenseKey: organizations.licenseKey, tier: organizations.tier })
    .from(organizations)
    .where(eq(organizations.id, orgId));

  if (org?.licenseKey && !org?.tier) {
    return Response.json({ error: "License already exists" }, { status: 409 });
  }

  // Generate free tier license
  const licenseKey = generateLicenseKey({
    customerId: orgId,
    tier: "free",
    months: 12,
  });

  const claims = JSON.parse(
    Buffer.from(licenseKey.split(".")[1], "base64").toString()
  );

  await db
    .update(organizations)
    .set({
      tier: "free",
      licenseKey,
      licenseJti: claims.jti,
      licenseExpiresAt: new Date(claims.exp * 1000),
      licenseRevoked: false,
      hostingMode,
    })
    .where(eq(organizations.id, orgId));

  return Response.json({ success: true, licenseKey, hostingMode });
}
