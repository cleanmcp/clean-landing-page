import { db } from "@/lib/db";
import { organizations } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getAuthContext } from "@/lib/auth";
import { provisionFreeTier } from "@/lib/provision";

export async function POST() {
  const ctx = await getAuthContext();
  if (!ctx) return Response.json({ error: "Unauthorized" }, { status: 401 });

  if (ctx.role !== "OWNER" && ctx.role !== "ADMIN") {
    return Response.json({ error: "Only owners and admins can activate plans" }, { status: 403 });
  }

  const orgId = ctx.orgId;

  const [org] = await db
    .select({ licenseKey: organizations.licenseKey, tier: organizations.tier })
    .from(organizations)
    .where(eq(organizations.id, orgId));

  if (org?.licenseKey && !org?.tier) {
    return Response.json({ error: "License already exists" }, { status: 409 });
  }

  const { licenseKey } = await provisionFreeTier(orgId);
  return Response.json({ success: true, licenseKey, hostingMode: "cloud" as const });
}
