import { db } from "@/lib/db";
import { organizations } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { generateLicenseKey } from "@/lib/license";
import { getAuthContext } from "@/lib/auth";

export async function POST() {
  const ctx = await getAuthContext();
  if (!ctx) return Response.json({ error: "Unauthorized" }, { status: 401 });

  if (ctx.role !== "OWNER" && ctx.role !== "ADMIN") {
    return Response.json({ error: "Only owners and admins can activate plans" }, { status: 403 });
  }

  // Free tier is always cloud-hosted.
  const hostingMode: "cloud" | "self-hosted" = "cloud";

  const orgId = ctx.orgId;

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
