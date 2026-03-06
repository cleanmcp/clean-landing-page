import { db } from "@/lib/db";
import { cloudRepos, organizations } from "@/lib/db/schema";
import { eq, and, inArray } from "drizzle-orm";
import { getCloudTierLimits } from "@/lib/tier-limits";

/**
 * Enforce repo limits for an org after a plan change.
 *
 * - Repos within the limit that were paused get un-paused (restored to "ready").
 * - Repos beyond the limit get soft-locked to "paused".
 *
 * Repos are kept in creation order — the oldest repos stay active.
 */
export async function enforceRepoLimits(orgId: string): Promise<{ paused: number; unpaused: number }> {
  const [org] = await db
    .select({ tier: organizations.tier })
    .from(organizations)
    .where(eq(organizations.id, orgId))
    .limit(1);

  const limit = getCloudTierLimits(org?.tier ?? "free").repos;

  const repos = await db
    .select({ id: cloudRepos.id, status: cloudRepos.status })
    .from(cloudRepos)
    .where(eq(cloudRepos.orgId, orgId))
    .orderBy(cloudRepos.createdAt);

  if (limit === Infinity) {
    // Unlimited plan — un-pause everything
    const pausedIds = repos.filter((r) => r.status === "paused").map((r) => r.id);
    if (pausedIds.length > 0) {
      await db
        .update(cloudRepos)
        .set({ status: "ready", updatedAt: new Date() })
        .where(and(eq(cloudRepos.orgId, orgId), inArray(cloudRepos.id, pausedIds)));
    }
    return { paused: 0, unpaused: pausedIds.length };
  }

  const withinLimit = repos.slice(0, limit);
  const overLimit = repos.slice(limit);

  let paused = 0;
  let unpaused = 0;

  // Un-pause repos that are now within the limit
  const toUnpause = withinLimit.filter((r) => r.status === "paused").map((r) => r.id);
  if (toUnpause.length > 0) {
    await db
      .update(cloudRepos)
      .set({ status: "ready", updatedAt: new Date() })
      .where(and(eq(cloudRepos.orgId, orgId), inArray(cloudRepos.id, toUnpause)));
    unpaused = toUnpause.length;
  }

  // Pause repos that are over the limit (only if they're active)
  const toPause = overLimit
    .filter((r) => r.status !== "paused" && r.status !== "error")
    .map((r) => r.id);
  if (toPause.length > 0) {
    await db
      .update(cloudRepos)
      .set({ status: "paused", updatedAt: new Date() })
      .where(and(eq(cloudRepos.orgId, orgId), inArray(cloudRepos.id, toPause)));
    paused = toPause.length;
  }

  return { paused, unpaused };
}
