import { auth } from "@clerk/nextjs/server";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { orgMembers } from "@/lib/db/schema";
import type { OrgRole } from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";

/**
 * Get the current user's ID, orgId, and role from Clerk + database.
 *
 * Org resolution order:
 *   1. `active_org` cookie (if set and the user is still a member)
 *   2. Most recently joined org (joinedAt DESC)
 *
 * Returns null if not authenticated or has no org membership.
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

  if (!membership) return null;

  return { userId, orgId: membership.orgId, role: membership.role };
}
