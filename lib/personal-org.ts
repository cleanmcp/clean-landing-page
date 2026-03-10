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

  // Clerk user IDs contain underscores (e.g. user_2abc...) which are invalid
  // in slugs (gateway only allows lowercase alphanumeric + hyphens).
  const slug = `personal-${userId.replace(/[^a-z0-9]/g, "").slice(0, 12)}`;
  const orgName = userName ? `${userName}'s Org` : "Personal";

  // Check if an org with this slug already exists (orphaned from a previous attempt)
  const [existingOrg] = await db
    .select({ id: organizations.id })
    .from(organizations)
    .where(eq(organizations.slug, slug))
    .limit(1);

  let orgId: string;

  if (existingOrg) {
    orgId = existingOrg.id;
  } else {
    const [org] = await db
      .insert(organizations)
      .values({ name: orgName, slug, hostingMode: "cloud" })
      .returning({ id: organizations.id });
    orgId = org.id;
  }

  await db
    .insert(orgMembers)
    .values({ orgId, userId, role: "OWNER" })
    .onConflictDoNothing();

  return orgId;
}
