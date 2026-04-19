import { auth, currentUser } from "@clerk/nextjs/server";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { orgMembers, organizations, users } from "@/lib/db/schema";
import type { OrgRole } from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { ensurePersonalOrg } from "@/lib/personal-org";
import { provisionFreeTier } from "@/lib/provision";

/**
 * Ensure a free-tier org has a license + credits. Fires once per org on the
 * first authenticated request after signup (the original `/api/stripe/free`
 * POST was never called on the signup path, leaving 90% of free orgs with
 * licenseKey=NULL and creditBalance=0). Idempotent — safe to call on every
 * auth resolution; the update is a no-op once a license exists.
 */
async function ensureFreeTierProvisioned(orgId: string): Promise<void> {
  const [org] = await db
    .select({
      tier: organizations.tier,
      licenseKey: organizations.licenseKey,
      creditPeriodStart: organizations.creditPeriodStart,
    })
    .from(organizations)
    .where(eq(organizations.id, orgId))
    .limit(1);

  if (!org) return;
  const needsLicense = !org.licenseKey;
  const needsCredits = org.creditPeriodStart == null;
  const isFreeLike = org.tier == null || org.tier === "free";
  if (!isFreeLike || (!needsLicense && !needsCredits)) return;

  try {
    await provisionFreeTier(orgId);
  } catch (err) {
    console.error("[auth] auto-provision free tier failed", orgId, err);
  }
}

/**
 * Get the current user's ID, orgId, and role from Clerk + database.
 *
 * Org resolution order:
 *   1. `active_org` cookie (if set and the user is still a member)
 *   2. Most recently joined org (joinedAt DESC)
 *   3. Auto-create personal org if none exists (self-healing)
 *
 * Returns null if not authenticated.
 */
export async function getAuthContext(): Promise<{
  userId: string;
  orgId: string;
  role: OrgRole;
} | null> {
  const { userId } = await auth();
  if (!userId) return null;

  // 1. Check for an explicit active-org cookie
  const cookieStore = await cookies();
  const activeOrgId = cookieStore.get("active_org")?.value;

  if (activeOrgId) {
    const [pinned] = await db
      .select({ orgId: orgMembers.orgId, role: orgMembers.role })
      .from(orgMembers)
      .where(
        and(eq(orgMembers.userId, userId), eq(orgMembers.orgId, activeOrgId))
      )
      .limit(1);

    if (pinned) {
      await ensureFreeTierProvisioned(pinned.orgId);
      return { userId, orgId: pinned.orgId, role: pinned.role };
    }
  }

  // 2. Fall back to the most recently joined org
  const [membership] = await db
    .select({ orgId: orgMembers.orgId, role: orgMembers.role })
    .from(orgMembers)
    .where(eq(orgMembers.userId, userId))
    .orderBy(desc(orgMembers.joinedAt))
    .limit(1);

  if (membership) {
    await ensureFreeTierProvisioned(membership.orgId);
    return { userId, orgId: membership.orgId, role: membership.role };
  }

  // 3. Self-heal: create user + personal org if webhook missed it
  try {
    const user = await currentUser();
    const name = user?.firstName || user?.username || null;
    const email = user?.emailAddresses?.[0]?.emailAddress || null;
    const image = user?.imageUrl || null;

    // Ensure user row exists (FK for orgMembers)
    await db
      .insert(users)
      .values({ id: userId, name, email, image })
      .onConflictDoNothing();

    const orgId = await ensurePersonalOrg(userId, name);
    await ensureFreeTierProvisioned(orgId);
    return { userId, orgId, role: "OWNER" };
  } catch {
    return null;
  }
}
