import { NextRequest, NextResponse } from "next/server";
import { getAuthContext } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  cloudRepos,
  githubInstallations,
  organizations,
} from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { getCloudTierLimits } from "@/lib/tier-limits";
import { engineFetch } from "@/lib/engine";
import { audit } from "@/lib/audit";
import { getInstallationToken } from "@/lib/github-app";

/**
 * GET /api/cloud-repos — List cloud repos for the current org.
 *
 * Syncs live status from the Engine for any repos that are still in progress.
 * The Engine tracks real clone/index status in its own metadata DB — we pull
 * that status and update our PostgreSQL records so the frontend sees progress.
 */
export async function GET() {
  try {
    const ctx = await getAuthContext();
    if (!ctx) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [repos, [org]] = await Promise.all([
      db.select().from(cloudRepos).where(eq(cloudRepos.orgId, ctx.orgId)),
      db.select({ tier: organizations.tier }).from(organizations).where(eq(organizations.id, ctx.orgId)).limit(1),
    ]);

    const limits = getCloudTierLimits(org?.tier ?? "free");

    // If any repos are in-progress, poll the Engine for live status
    const inProgress = repos.some((r) =>
      ["pending", "cloning", "indexing"].includes(r.status)
    );

    if (inProgress) {
      try {
        const engineRes = await engineFetch(ctx.orgId, "/repos", {
          signal: AbortSignal.timeout(5_000),
        });

        if (engineRes.ok) {
          const engineData = await engineRes.json();
          const engineRepos: Array<{
            repo: string;
            status: string;
            entity_count: number | null;
            last_indexed_at: string | null;
            error: string | null;
            job?: {
              phase: string;
              progress: number;
              files_processed: number;
              files_total: number;
              entities_found: number;
            } | null;
          }> = engineData.repos ?? [];

          // Build lookup by repo full name
          const engineMap = new Map(engineRepos.map((r) => [r.repo, r]));

          // Sync engine status → PostgreSQL for in-progress repos
          for (const repo of repos) {
            if (!["pending", "cloning", "indexing"].includes(repo.status)) continue;

            const engine = engineMap.get(repo.fullName);
            if (!engine) continue;

            // Map engine status to our status enum
            const newStatus = engine.status === "ready"
              ? "ready"
              : engine.status === "error"
                ? "error"
                : engine.status === "indexing"
                  ? "indexing"
                  : engine.status === "cloning"
                    ? "cloning"
                    : repo.status;

            // Only update if status actually changed
            if (newStatus !== repo.status || engine.entity_count !== repo.entityCount) {
              await db
                .update(cloudRepos)
                .set({
                  status: newStatus as typeof repo.status,
                  entityCount: engine.entity_count ?? repo.entityCount,
                  lastIndexedAt: engine.last_indexed_at ? new Date(engine.last_indexed_at) : repo.lastIndexedAt,
                  error: engine.error ?? null,
                  updatedAt: new Date(),
                })
                .where(eq(cloudRepos.id, repo.id));

              // Update the in-memory object for the response
              repo.status = newStatus as typeof repo.status;
              repo.entityCount = engine.entity_count ?? repo.entityCount;
              repo.lastIndexedAt = engine.last_indexed_at ? new Date(engine.last_indexed_at) : repo.lastIndexedAt;
              repo.error = engine.error ?? null;
            }

            // Stash job progress for the response (not persisted in DB)
            if (engine.job) {
              (repo as Record<string, unknown>)._job = engine.job;
            }
          }
        }
      } catch {
        // Engine unreachable — return stale data, don't fail the request
      }
    }

    return NextResponse.json({
      repos: repos.map((r) => {
        const job = (r as Record<string, unknown>)._job as {
          phase: string;
          progress: number;
          files_processed: number;
          files_total: number;
          entities_found: number;
        } | undefined;
        return {
          id: r.id,
          fullName: r.fullName,
          defaultBranch: r.defaultBranch,
          language: r.language,
          private: r.private,
          status: r.status,
          entityCount: r.entityCount,
          lastIndexedAt: r.lastIndexedAt?.toISOString() ?? null,
          error: r.error,
          createdAt: r.createdAt.toISOString(),
          ...(job ? { job } : {}),
        };
      }),
      repoLimit: limits.repos === Infinity ? null : limits.repos,
    });
  } catch (error) {
    console.error("Failed to fetch cloud repos:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/cloud-repos — Add repos for cloud indexing.
 * Body: { repos: [{ fullName, defaultBranch, language, private, installationId }] }
 */
export async function POST(request: NextRequest) {
  try {
    const ctx = await getAuthContext();
    if (!ctx) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const reposToAdd: Array<{
      fullName: string;
      defaultBranch?: string;
      language?: string;
      private?: boolean;
      installationId?: string;
    }> = body.repos;

    if (!Array.isArray(reposToAdd) || reposToAdd.length === 0) {
      return NextResponse.json(
        { error: "No repos provided" },
        { status: 400 }
      );
    }

    // Get org tier and enforce limits
    const [org] = await db
      .select({ tier: organizations.tier })
      .from(organizations)
      .where(eq(organizations.id, ctx.orgId))
      .limit(1);

    const limits = getCloudTierLimits(org?.tier ?? "free");
    const existingRepos = await db
      .select({ id: cloudRepos.id })
      .from(cloudRepos)
      .where(eq(cloudRepos.orgId, ctx.orgId));

    const currentCount = existingRepos.length;
    const maxNew = Math.max(0, limits.repos - currentCount);

    if (maxNew === 0) {
      return NextResponse.json(
        {
          error: `Repository limit reached (${currentCount}/${limits.repos}). Upgrade your plan to add more.`,
        },
        { status: 403 }
      );
    }

    // Validate fullName format (must be "owner/repo")
    const REPO_NAME_RE = /^[a-zA-Z0-9._-]+\/[a-zA-Z0-9._-]+$/;
    const validRepos = reposToAdd.filter((r) => REPO_NAME_RE.test(r.fullName));
    if (validRepos.length === 0) {
      return NextResponse.json(
        { error: "No valid repository names provided (expected owner/repo format)" },
        { status: 400 }
      );
    }

    const toInsert = validRepos.slice(0, maxNew);

    // Insert cloud repo records (unique constraint on org_id + full_name prevents duplicates)
    const inserted = await db
      .insert(cloudRepos)
      .values(
        toInsert.map((r) => ({
          orgId: ctx.orgId,
          fullName: r.fullName,
          defaultBranch: r.defaultBranch ?? "main",
          language: r.language ?? null,
          private: r.private ?? false,
          installationId: r.installationId ?? null,
          status: "pending" as const,
        }))
      )
      .onConflictDoNothing()
      .returning({ id: cloudRepos.id, fullName: cloudRepos.fullName, installationId: cloudRepos.installationId });

    // Build a lookup for repo details from the insert data
    const repoDetails = new Map(toInsert.map((r) => [r.fullName, r]));

    // Pre-fetch installation tokens for all unique installations (org-level, not per-user)
    const installationTokenCache = new Map<number, string>();
    const installationUuidToNumeric = new Map<string, number>();

    // Get all active installations for this org
    const orgInstallations = await db
      .select({
        id: githubInstallations.id,
        installationId: githubInstallations.installationId,
      })
      .from(githubInstallations)
      .where(
        and(
          eq(githubInstallations.orgId, ctx.orgId),
          eq(githubInstallations.active, true)
        )
      );

    for (const inst of orgInstallations) {
      installationUuidToNumeric.set(inst.id, inst.installationId);
    }

    // Pre-fetch installation tokens (shared across repos from same installation)
    for (const repo of inserted) {
      if (repo.installationId) {
        const numericId = installationUuidToNumeric.get(repo.installationId);
        if (numericId && !installationTokenCache.has(numericId)) {
          try {
            const token = await getInstallationToken(numericId);
            installationTokenCache.set(numericId, token);
          } catch (err) {
            console.error(`Failed to get installation token for ${numericId}:`, err);
          }
        }
      }
    }

    // Trigger indexing for all repos in parallel
    await Promise.allSettled(
      inserted.map(async (repo) => {
        try {
          const details = repoDetails.get(repo.fullName);

          let cloneToken: string | null = null;
          if (repo.installationId) {
            const numericId = installationUuidToNumeric.get(repo.installationId);
            if (numericId) {
              cloneToken = installationTokenCache.get(numericId) ?? null;
            }
          }

          const engineRes = await engineFetch(
            ctx.orgId,
            "/repos/index",
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                repo: repo.fullName,
                branch: details?.defaultBranch ?? "main",
                ...(cloneToken ? { token: cloneToken } : {}),
              }),
              signal: AbortSignal.timeout(30_000),
            }
          );

          if (!engineRes.ok) {
            const errBody = await engineRes.text().catch(() => "");
            throw new Error(`Engine returned ${engineRes.status}: ${errBody}`);
          }

          await db
            .update(cloudRepos)
            .set({ status: "cloning", updatedAt: new Date() })
            .where(eq(cloudRepos.id, repo.id));

          audit({
            orgId: ctx.orgId,
            userId: ctx.userId,
            action: "repo.index_started",
            resourceType: "repository",
            resourceId: repo.fullName,
            metadata: { repo: repo.fullName, mode: "cloud" },
          });
        } catch (err) {
          const message = err instanceof Error ? err.message : "Failed to start indexing";
          await db
            .update(cloudRepos)
            .set({
              status: "error",
              error: message,
              updatedAt: new Date(),
            })
            .where(eq(cloudRepos.id, repo.id));
        }
      })
    );

    const skipped = reposToAdd.length - toInsert.length;

    return NextResponse.json({
      added: inserted.length,
      skipped,
      repos: inserted,
    });
  } catch (error) {
    console.error("Failed to add cloud repos:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/cloud-repos?id=<uuid> — Remove a cloud repo from indexing.
 */
export async function DELETE(request: NextRequest) {
  try {
    const ctx = await getAuthContext();
    if (!ctx) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const repoId = searchParams.get("id");

    if (!repoId) {
      return NextResponse.json(
        { error: "Repo id is required" },
        { status: 400 }
      );
    }

    // Verify ownership
    const [repo] = await db
      .select()
      .from(cloudRepos)
      .where(and(eq(cloudRepos.id, repoId), eq(cloudRepos.orgId, ctx.orgId)))
      .limit(1);

    if (!repo) {
      return NextResponse.json({ error: "Repo not found" }, { status: 404 });
    }

    // Delete from engine
    const parts = repo.fullName.split("/");
    if (parts.length === 2) {
      try {
        await engineFetch(ctx.orgId, `/repos/${parts[0]}/${parts[1]}`, {
          method: "DELETE",
        });
      } catch {
        // continue — delete from DB even if engine is unavailable
      }
    }

    await db.delete(cloudRepos).where(eq(cloudRepos.id, repoId));

    audit({
      orgId: ctx.orgId,
      userId: ctx.userId,
      action: "repo.deleted",
      resourceType: "repository",
      resourceId: repo.fullName,
      metadata: { repo: repo.fullName, mode: "cloud" },
    });

    return NextResponse.json({ status: "deleted" });
  } catch (error) {
    console.error("Failed to delete cloud repo:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
