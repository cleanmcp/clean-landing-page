import { db } from "@/lib/db";
import { users, orgMembers } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";

/**
 * Check if a user has completed onboarding (step >= 2) or has org membership.
 * Returns true if the user should be allowed to access dashboard resources.
 */
export async function hasCompletedOnboarding(userId: string): Promise<boolean> {
  const [user] = await db
    .select({ onboardingStep: users.onboardingStep })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  const step = user?.onboardingStep ?? 0;
  if (step >= 2) return true;

  // Users who accepted an invite have org membership — allow them
  const [membership] = await db
    .select({ orgId: orgMembers.orgId })
    .from(orgMembers)
    .where(eq(orgMembers.userId, userId))
    .orderBy(desc(orgMembers.joinedAt))
    .limit(1);

  return !!membership;
}
