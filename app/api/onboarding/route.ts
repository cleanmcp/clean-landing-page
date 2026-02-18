import { NextRequest, NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { users, organizations, orgMembers } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { ensureClerkOrg } from "@/lib/clerk-org";
import { generateSlug, validateSlug } from "@/lib/slug";

/**
 * Ensure a user has a personal organization.
 * Creates one if missing. Returns the org ID.
 * Prefers the most recently joined org so invite-accepted orgs take priority.
 */
async function ensurePersonalOrg(
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

/**
 * Resolve the current user's auth context, creating a personal org if needed.
 */
async function resolveAuth() {
  const { userId } = await auth();
  if (!userId) return null;

  // Fetch Clerk profile so we always have name/email/image
  const clerkUser = await currentUser();
  const name =
    [clerkUser?.firstName, clerkUser?.lastName].filter(Boolean).join(" ") ||
    clerkUser?.emailAddresses?.[0]?.emailAddress ||
    null;
  const email = clerkUser?.emailAddresses?.[0]?.emailAddress ?? null;
  const image = clerkUser?.imageUrl ?? null;

  const [existingUser] = await db
    .select()
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!existingUser) {
    await db
      .insert(users)
      .values({ id: userId, name, email, image })
      .onConflictDoNothing();
  } else if (!existingUser.name && name) {
    // Backfill profile data if missing
    await db
      .update(users)
      .set({ name, email, image })
      .where(eq(users.id, userId));
  }

  const orgId = await ensurePersonalOrg(userId, name);

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

    const step = user?.onboardingStep ?? 0;
    console.log(`GET /api/onboarding — userId=${ctx.userId}, step=${step}`);

    return NextResponse.json({
      step,
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

      let slug = generateSlug(orgName);

      const slugError = validateSlug(slug);
      if (slugError) {
        return NextResponse.json({ error: slugError }, { status: 400 });
      }

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

      // Create corresponding Clerk Organization (best-effort, log errors loudly)
      try {
        const clerkOrgId = await ensureClerkOrg(ctx.orgId, ctx.userId);
        console.log("[onboarding] Clerk org created/found:", clerkOrgId);
      } catch (err) {
        console.error("[onboarding] FAILED to create Clerk org:", err);
      }
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
