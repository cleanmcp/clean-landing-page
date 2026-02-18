import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { users, orgMembers } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";

export async function OnboardingGuard({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const [user] = await db
    .select({ onboardingStep: users.onboardingStep })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  const step = user?.onboardingStep ?? 0;

  if (step < 2) {
    // Users who accepted an invite already have org membership and bypass
    // onboarding, so only redirect if they have no membership at all.
    const [membership] = await db
      .select({ orgId: orgMembers.orgId })
      .from(orgMembers)
      .where(eq(orgMembers.userId, userId))
      .orderBy(desc(orgMembers.joinedAt))
      .limit(1);

    if (!membership) {
      redirect("/onboarding");
    }
  }

  return <>{children}</>;
}
