import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { users, organizations, orgMembers } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

/**
 * Ensure a user has a personal organization.
 * Creates one if missing. Returns the org ID.
 */
async function ensurePersonalOrg(
  userId: string,
  userName: string | null
): Promise<string> {
  const existing = await db
    .select({ orgId: orgMembers.orgId })
    .from(orgMembers)
    .where(eq(orgMembers.userId, userId))
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

/**
 * Resolve the current user's auth context, creating a personal org if needed.
 */
async function resolveAuth() {
  const { userId } = await auth();
  if (!userId) return null;

  const [existingUser] = await db
    .select()
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!existingUser) {
    await db
      .insert(users)
      .values({ id: userId })
      .onConflictDoNothing();
  }

  const orgId = await ensurePersonalOrg(
    userId,
    existingUser?.name ?? null
  );

  return { userId, orgId };
}

// GET /api/onboarding — returns current onboarding state
export async function GET() {
  try {
    const ctx = await resolveAuth();
    if (!ctx) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [user] = await db
      .select({ onboardingStep: users.onboardingStep })
      .from(users)
      .where(eq(users.id, ctx.userId))
      .limit(1);

    const [org] = await db
      .select({
        name: organizations.name,
        slug: organizations.slug,
        metadata: organizations.metadata,
      })
      .from(organizations)
      .where(eq(organizations.id, ctx.orgId))
      .limit(1);

    return NextResponse.json({
      step: user?.onboardingStep ?? 0,
      orgName: org?.name ?? "",
      orgSlug: org?.slug ?? "",
      metadata: org?.metadata ?? {},
    });
  } catch (error) {
    console.error("GET /api/onboarding failed:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PATCH /api/onboarding — advance onboarding by one step
//
// Steps:
//   0→1  Welcome + Profile (org name, role, team size, heard from)
//   1→2  Primary Tool selection → mark complete
//
// Step 2+ = onboarding complete. Dashboard guard checks step < 2.
export async function PATCH(request: NextRequest) {
  try {
    const ctx = await resolveAuth();
    if (!ctx) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const rawBody = await request.text();
    if (rawBody.length > 10000) {
      return NextResponse.json(
        { error: "Request too large" },
        { status: 413 }
      );
    }
    const body = JSON.parse(rawBody);
    const { step, data } = body as {
      step: number;
      data?: Record<string, unknown>;
    };

    // Get current step
    const [user] = await db
      .select({ onboardingStep: users.onboardingStep })
      .from(users)
      .where(eq(users.id, ctx.userId))
      .limit(1);

    const currentStep = user?.onboardingStep ?? 0;

    // Validate: requested step must be currentStep + 1
    if (step !== currentStep + 1) {
      return NextResponse.json(
        { error: `Invalid step transition: ${currentStep} → ${step}` },
        { status: 400 }
      );
    }

    // Step 0→1: Save profile info + org name
    if (currentStep === 0 && step === 1) {
      const orgName = data?.orgName as string | undefined;
      const role = data?.role as string | undefined;
      const teamSize = data?.teamSize as string | undefined;
      const heardFrom = data?.heardFrom as string | undefined;

      if (!orgName || orgName.trim().length === 0) {
        return NextResponse.json(
          { error: "Organization name is required" },
          { status: 400 }
        );
      }

      let slug = orgName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");

      if (!slug) slug = "org";

      const [existing] = await db
        .select({ id: organizations.id })
        .from(organizations)
        .where(eq(organizations.slug, slug))
        .limit(1);

      if (existing && existing.id !== ctx.orgId) {
        const suffix = Math.random().toString(36).slice(2, 6);
        slug = `${slug}-${suffix}`;
      }

      const [currentOrg] = await db
        .select({ metadata: organizations.metadata })
        .from(organizations)
        .where(eq(organizations.id, ctx.orgId))
        .limit(1);

      await db
        .update(organizations)
        .set({
          name: orgName.trim(),
          slug,
          metadata: {
            ...(currentOrg?.metadata ?? {}),
            role: role ?? undefined,
            teamSize: teamSize ?? undefined,
            heardFrom: heardFrom ?? undefined,
          },
        })
        .where(eq(organizations.id, ctx.orgId));
    }

    // Step 1→2: Save primary tool → onboarding complete
    if (currentStep === 1 && step === 2) {
      const primaryTool = data?.primaryTool as string | undefined;

      if (!primaryTool) {
        return NextResponse.json(
          { error: "Primary tool selection is required" },
          { status: 400 }
        );
      }

      const [currentOrg] = await db
        .select({ metadata: organizations.metadata })
        .from(organizations)
        .where(eq(organizations.id, ctx.orgId))
        .limit(1);

      await db
        .update(organizations)
        .set({
          metadata: {
            ...(currentOrg?.metadata ?? {}),
            primaryTool,
          },
        })
        .where(eq(organizations.id, ctx.orgId));
    }

    // Advance the step
    await db
      .update(users)
      .set({ onboardingStep: step })
      .where(eq(users.id, ctx.userId));

    return NextResponse.json({ step });
  } catch (error) {
    console.error("PATCH /api/onboarding failed:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
