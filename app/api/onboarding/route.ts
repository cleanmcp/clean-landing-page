import { db } from "@/lib/db";
import { users, organizations, orgMembers } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { auth, currentUser } from "@clerk/nextjs/server";
import { ensurePersonalOrg } from "@/lib/personal-org";

async function ensureUserAndOrg(userId: string) {
  const clerk = await currentUser();
  const name =
    [clerk?.firstName, clerk?.lastName].filter(Boolean).join(" ") ||
    clerk?.emailAddresses?.[0]?.emailAddress ||
    "User";
  const email = clerk?.emailAddresses?.[0]?.emailAddress ?? null;

  await db
    .insert(users)
    .values({
      id: userId,
      name,
      email,
      image: clerk?.imageUrl ?? null,
      onboardingStep: 0,
    })
    .onConflictDoNothing();

  await ensurePersonalOrg(userId, name);
}

export async function GET() {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  await ensureUserAndOrg(userId);

  const [user] = await db
    .select({ onboardingStep: users.onboardingStep })
    .from(users)
    .where(eq(users.id, userId));

  return Response.json({ step: user?.onboardingStep ?? 0 });
}

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  await ensureUserAndOrg(userId);

  const body = await req.json();
  const { role, teamSize, heardFrom, primaryTool } = body;

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

  await db
    .update(organizations)
    .set({
      metadata: { role, teamSize, heardFrom, primaryTool },
    })
    .where(eq(organizations.id, orgId));

  await db
    .update(users)
    .set({ onboardingStep: 2 })
    .where(eq(users.id, userId));

  return Response.json({ success: true });
}
