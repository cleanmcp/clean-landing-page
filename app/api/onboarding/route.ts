import { db } from "@/lib/db";
import { users, organizations, orgMembers } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { auth } from "@clerk/nextjs/server";

export async function GET() {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const [user] = await db
    .select({ onboardingStep: users.onboardingStep })
    .from(users)
    .where(eq(users.id, userId));

  if (!user) return Response.json({ error: "User not found" }, { status: 404 });

  return Response.json({ step: user.onboardingStep });
}

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { role, teamSize, heardFrom, primaryTool } = body;

  // Find user's org
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

  // Update org metadata
  await db
    .update(organizations)
    .set({
      metadata: { role, teamSize, heardFrom, primaryTool },
    })
    .where(eq(organizations.id, orgId));

  // Mark onboarding complete
  await db
    .update(users)
    .set({ onboardingStep: 2 })
    .where(eq(users.id, userId));

  return Response.json({ success: true });
}
