import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { orgMembers } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

/**
 * Get the current user's ID and orgId from Clerk + database.
 * Returns null if not authenticated.
 */
export async function getAuthContext(): Promise<{
  userId: string;
  orgId: string;
} | null> {
  const { userId } = await auth();
  if (!userId) return null;

  // Look up org membership
  const membership = await db
    .select({ orgId: orgMembers.orgId })
    .from(orgMembers)
    .where(eq(orgMembers.userId, userId))
    .limit(1);

  if (membership.length === 0) return null;

  return { userId, orgId: membership[0].orgId };
}
