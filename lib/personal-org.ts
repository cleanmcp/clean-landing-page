import { db } from "@/lib/db";
import { organizations, orgMembers } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";

/**
 * Ensure a user has a personal organization.
 * Creates one if missing. Returns the org ID.
 * Prefers the most recently joined org so invite-accepted orgs take priority.
 */
export async function ensurePersonalOrg(
  userId: string,
  userName: string | null
): Promise<string> {
  const existing = await db
    .select({ orgId: orgMembers.orgId })
    .from(orgMembers)
    .where(eq(orgMembers.userId, userId))
    .orderBy(desc(orgMembers.joinedAt))
    .limit(1);

  if (existing.length > 0) return existing[0].orgId;

  const slug = `personal-${userId.slice(0, 8)}`;
  const orgName = userName ? `${userName}'s Org` : "Personal";

  const [org] = await db
    .insert(organizations)
    .values({ name: orgName, slug })
    .returning({ id: organizations.id });

  await db.insert(orgMembers).values({
    orgId: org.id,
    userId,
    role: "OWNER",
  });

  return org.id;
}
