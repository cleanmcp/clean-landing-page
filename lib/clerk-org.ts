import { createClerkClient } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { organizations } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

function getClerkClient() {
  const key = process.env.CLERK_SECRET_KEY;
  if (!key) throw new Error("CLERK_SECRET_KEY is not set");
  return createClerkClient({ secretKey: key });
}

/**
 * Pull the human-readable error messages out of a Clerk API error.
 */
function clerkErrorDetails(err: unknown): string {
  const e = err as {
    status?: number;
    errors?: { message?: string; longMessage?: string; code?: string }[];
  };
  const parts: string[] = [];
  if (e.status) parts.push(`status=${e.status}`);
  if (Array.isArray(e.errors)) {
    for (const item of e.errors) {
      parts.push(
        item.longMessage || item.message || item.code || "(unknown)"
      );
    }
  }
  return parts.length > 0 ? parts.join(" | ") : String(err);
}

/**
 * Ensure a Neon org has a corresponding Clerk Organization.
 * Creates one if it doesn't exist yet and stores the clerkOrgId.
 * Returns the Clerk Organization ID.
 */
export async function ensureClerkOrg(
  neonOrgId: string,
  creatorClerkUserId: string
): Promise<string> {
  const clerkClient = getClerkClient();

  // Check if org already has a Clerk org
  const [org] = await db
    .select({
      clerkOrgId: organizations.clerkOrgId,
      name: organizations.name,
      slug: organizations.slug,
    })
    .from(organizations)
    .where(eq(organizations.id, neonOrgId))
    .limit(1);

  if (!org) throw new Error(`Organization ${neonOrgId} not found`);
  if (org.clerkOrgId) return org.clerkOrgId;

  console.log(
    `[clerk-org] Creating Clerk org for "${org.name}" (slug: ${org.slug}, creator: ${creatorClerkUserId})`
  );

  // Create Clerk Organization
  let slug = org.slug;
  let clerkOrg;

  try {
    clerkOrg = await clerkClient.organizations.createOrganization({
      name: org.name,
      slug,
      createdBy: creatorClerkUserId,
    });
  } catch (err: unknown) {
    const details = clerkErrorDetails(err);
    const status = (err as { status?: number }).status;

    // 403 almost always means "Organizations not enabled in Clerk".
    if (status === 403) {
      console.error(
        `[clerk-org] ❌ Clerk returned 403 Forbidden. ` +
          `Organizations are likely NOT enabled in your Clerk dashboard. ` +
          `Go to Clerk Dashboard → Configure → Organization settings → Enable organizations. ` +
          `(${details})`
      );
      throw new Error(
        "Clerk Organizations feature is not enabled. Enable it in your Clerk Dashboard → Configure → Organization settings."
      );
    }

    console.error("[clerk-org] First attempt failed:", details);

    // Slug conflict - append random suffix and retry
    const isSlugConflict =
      details.includes("slug") ||
      details.includes("unique") ||
      details.includes("taken");

    if (isSlugConflict) {
      const suffix = Math.random().toString(36).slice(2, 6);
      slug = `${slug}-${suffix}`;
      clerkOrg = await clerkClient.organizations.createOrganization({
        name: org.name,
        slug,
        createdBy: creatorClerkUserId,
      });
    } else {
      throw err;
    }
  }

  console.log(`[clerk-org] Created Clerk org: ${clerkOrg.id}`);

  // Store the Clerk org ID back in NeonDB
  await db
    .update(organizations)
    .set({ clerkOrgId: clerkOrg.id })
    .where(eq(organizations.id, neonOrgId));

  return clerkOrg.id;
}

export function getClerkClientInstance() {
  return getClerkClient();
}
