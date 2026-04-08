import { NextRequest, NextResponse } from "next/server";
import { getAuthContext } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  cloudRepos,
  githubInstallations,
  indexingJobs,
  organizations,
} from "@/lib/db/schema";
import { eq, and, inArray } from "drizzle-orm";
import { getCloudTierLimits } from "@/lib/tier-limits";
import { engineFetch } from "@/lib/engine";
import { audit } from "@/lib/audit";
import { getTierPriority } from "@/lib/tier-priority";

/**
 * GET /api/cloud-repos — List cloud repos for the current org.
 *
 * Engine is the single source of truth for repo status / progress.
 * cloudRepos (Postgres) is a lightweight bookmark with GitHub metadata.
 * We merge both: engine-only repos (MCP-indexed) appear without GitHub
 * metadata, cloudRepos-only bookmarks appear as "not_indexed".
 */
export async function GET() {
  try {
    const ctx = await getAuthContext();
    if (!ctx) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch engine repos + cloudRepos bookmarks + org tier + active jobs in parallel
    const [engineResult, bookmarks, [org], activeJobs] = await Promise.all([
      engineFetch(ctx.orgId, "/repos", { signal: AbortSignal.timeout(5_000) })
        .then(async (res) => {
          if (!res.ok) return [];
          const data = await res.json();
          return (data.repos ?? []) as Array<{
            project_id: string;
            repo: string;
            branch: string;
            status: string;
            entity_count: number | null;
            last_indexed_at: string | null;
            error: string | null;
            description?: string | null;
            primary_language?: string | null;
            tags?: string[] | null;
            job?: {
              phase: string;
              phase_progress: number | null;
              files_processed: number;
              files_total: number;
              entities_found: number;
            } | null;
          }>;
        })
        .catch(() => [] as Array<{
          project_id: string;
          repo: string;
          branch: string;
          status: string;
          entity_count: number | null;
          last_indexed_at: string | null;
          error: string | null;
          description?: string | null;
          primary_language?: string | null;
          tags?: string[] | null;
          job?: {
            phase: string;
            phase_progress: number | null;
            files_processed: number;
            files_total: number;
            entities_found: number;
          } | null;
        }>),
      db.select().from(cloudRepos).where(eq(cloudRepos.orgId, ctx.orgId)),
      db.select({ tier: organizations.tier }).from(organizations).where(eq(organizations.id, ctx.orgId)).limit(1),
      db.select().from(indexingJobs).where(and(
        eq(indexingJobs.orgId, ctx.orgId),
        inArray(indexingJobs.status, ["pending", "running"]),
      )),
    ]);

    const limits = getCloudTierLimits(org?.tier ?? "free");

    // Separate deleted markers from active bookmarks
    const deletedNames = new Set(
      bookmarks.filter((b) => b.status === "deleted").map((b) => b.fullName)
    );
    const activeBookmarks = bookmarks.filter((b) => b.status !== "deleted");

    // Build lookups
    const bookmarkMap = new Map(activeBookmarks.map((b) => [b.fullName, b]));
    const engineMap = new Map(engineResult.map((e) => [e.repo, e]));
    const jobMap = new Map(activeJobs.map((j) => [`${j.repoFullName}:${j.branch}`, j]));

    // Collect all unique repo names from both sources, excluding deleted
    const allRepoNames = new Set([
      ...engineResult.map((e) => e.repo).filter((name) => !deletedNames.has(name)),
      ...activeBookmarks.map((b) => b.fullName),
    ]);

    const merged = Array.from(allRepoNames).map((fullName) => {
      const engine = engineMap.get(fullName);
      const bookmark = bookmarkMap.get(fullName);

      if (engine && bookmark) {
        // Both exist — engine is primary, bookmark supplements with GitHub metadata
        const branch = engine.branch ?? bookmark.defaultBranch ?? "main";
        const job = jobMap.get(`${fullName}:${branch}`);
        const entry = {
          id: bookmark.id,
          fullName,
          defaultBranch: branch,
          language: bookmark.language ?? engine.primary_language ?? null,
          private: bookmark.private,
          status: engine.status,
          entityCount: engine.entity_count,
          lastIndexedAt: engine.last_indexed_at ?? null,
          error: engine.error ?? null,
          createdAt: bookmark.createdAt.toISOString(),
          description: engine.description ?? null,
          source: "github" as const,
          ...(engine.job ? {
            job: {
              phase: engine.job.phase,
              phase_progress: engine.job.phase_progress ?? 0,
              files_processed: engine.job.files_processed,
              files_total: engine.job.files_total,
              entities_found: engine.job.entities_found,
            },
          } : {}),
        };
        if (job) {
          entry.job = {
            phase: job.currentPhase ?? "pending",
            phase_progress: job.phaseProgress ?? 0,
            files_processed: job.filesProcessed ?? 0,
            files_total: job.filesTotal ?? 0,
            entities_found: job.entitiesFound ?? 0,
          };
          if (job.status === "pending") entry.status = "pending";
          if (job.status === "running") entry.status = job.currentPhase ?? "indexing";
        }
        return entry;
      }

      if (engine) {
        // Engine-only (indexed via MCP/API, no GitHub bookmark)
        const job = jobMap.get(`${fullName}:${engine.branch}`);
        const entry = {
          id: engine.project_id,
          fullName,
          defaultBranch: engine.branch,
          language: engine.primary_language ?? null,
          private: false,
          status: engine.status,
          entityCount: engine.entity_count,
          lastIndexedAt: engine.last_indexed_at ?? null,
          error: engine.error ?? null,
          createdAt: engine.last_indexed_at ?? new Date().toISOString(),
          description: engine.description ?? null,
          source: "mcp" as const,
          ...(engine.job ? {
            job: {
              phase: engine.job.phase,
              phase_progress: engine.job.phase_progress ?? 0,
              files_processed: engine.job.files_processed,
              files_total: engine.job.files_total,
              entities_found: engine.job.entities_found,
            },
          } : {}),
        };
        if (job) {
          entry.job = {
            phase: job.currentPhase ?? "pending",
            phase_progress: job.phaseProgress ?? 0,
            files_processed: job.filesProcessed ?? 0,
            files_total: job.filesTotal ?? 0,
            entities_found: job.entitiesFound ?? 0,
          };
          if (job.status === "pending") entry.status = "pending";
          if (job.status === "running") entry.status = job.currentPhase ?? "indexing";
        }
        return entry;
      }

      // Bookmark-only (saved in dashboard but not yet in engine)
      const branch = bookmark!.defaultBranch ?? "main";
      const job = jobMap.get(`${fullName}:${branch}`);
      const entry = {
        id: bookmark!.id,
        fullName,
        defaultBranch: branch,
        language: bookmark!.language ?? null,
        private: bookmark!.private,
        status: "not_indexed" as string,
        entityCount: null as number | null,
        lastIndexedAt: null as string | null,
        error: null as string | null,
        createdAt: bookmark!.createdAt.toISOString(),
        description: null as string | null,
        source: "github" as const,
        job: undefined as {
          phase: string;
          phase_progress: number;
          files_processed: number;
          files_total: number;
          entities_found: number;
        } | undefined,
      };
      if (job) {
        entry.job = {
          phase: job.currentPhase ?? "pending",
          phase_progress: job.phaseProgress ?? 0,
          files_processed: job.filesProcessed ?? 0,
          files_total: job.filesTotal ?? 0,
          entities_found: job.entitiesFound ?? 0,
        };
        if (job.status === "pending") entry.status = "pending";
        if (job.status === "running") entry.status = job.currentPhase ?? "indexing";
      }
      return entry;
    });

    // Sort: in-progress first, then ready, then not_indexed, then error
    const statusOrder: Record<string, number> = {
      cloning: 0, indexing: 0, pending: 0,
      ready: 1,
      not_indexed: 2,
      error: 3,
    };
    merged.sort((a, b) => (statusOrder[a.status] ?? 4) - (statusOrder[b.status] ?? 4));

    return NextResponse.json({
      repos: merged,
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
      .select({ id: cloudRepos.id, status: cloudRepos.status })
      .from(cloudRepos)
      .where(eq(cloudRepos.orgId, ctx.orgId));

    const currentCount = existingRepos.filter((r) => r.status !== "deleted").length;
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

    // Insert cloud repo records. On conflict (re-adding a previously deleted
    // repo), revive the row by resetting its status back to pending.
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
      .onConflictDoUpdate({
        target: [cloudRepos.orgId, cloudRepos.fullName],
        set: {
          status: "pending" as const,
          error: null,
          updatedAt: new Date(),
        },
      })
      .returning({ id: cloudRepos.id, fullName: cloudRepos.fullName, installationId: cloudRepos.installationId });

    // Build a lookup for repo details from the insert data
    const repoDetails = new Map(toInsert.map((r) => [r.fullName, r]));

    // Resolve UUID installation IDs to numeric GitHub installation IDs
    const installationUuidToNumeric = new Map<string, number>();
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

    // Determine priority from org tier
    const priority = getTierPriority(org?.tier ?? "free");

    // Insert indexing jobs into the queue
    await Promise.allSettled(
      inserted.map(async (repo) => {
        try {
          const details = repoDetails.get(repo.fullName);
          const numericInstallId = repo.installationId
            ? installationUuidToNumeric.get(repo.installationId) ?? null
            : null;

          await db.insert(indexingJobs).values({
            orgId: ctx.orgId,
            repoFullName: repo.fullName,
            branch: details?.defaultBranch ?? "main",
            installationId: numericInstallId,
            priority,
            triggeredBy: "dashboard",
          }).onConflictDoNothing(); // dedup: active_uniq index

          audit({
            orgId: ctx.orgId,
            userId: ctx.userId,
            action: "repo.index_started",
            resourceType: "repository",
            resourceId: repo.fullName,
            metadata: { repo: repo.fullName, mode: "cloud" },
          });
        } catch (err) {
          const message = err instanceof Error ? err.message : "Failed to queue indexing";
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

    // Try cloudRepos bookmark first (GitHub App repos have a UUID here).
    // MCP-indexed repos use engine project_ids which are NOT valid UUIDs —
    // skip the DB lookup to avoid a Postgres "invalid input syntax" error.
    const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const [bookmark] = UUID_RE.test(repoId)
      ? await db
          .select()
          .from(cloudRepos)
          .where(and(eq(cloudRepos.id, repoId), eq(cloudRepos.orgId, ctx.orgId)))
          .limit(1)
      : [];

    // Also accept fullName param for MCP-indexed repos (no cloudRepos row)
    const REPO_NAME_RE = /^[a-zA-Z0-9._-]+\/[a-zA-Z0-9._-]+$/;
    const rawFullName = searchParams.get("fullName");
    const fullName = bookmark?.fullName ?? (rawFullName && REPO_NAME_RE.test(rawFullName) ? rawFullName : null);

    if (!bookmark && !fullName) {
      return NextResponse.json({ error: "Repo not found" }, { status: 404 });
    }

    const repoName = fullName ?? bookmark?.fullName;

    // Delete from engine (org-scoped — safe)
    const parts = repoName!.split("/");
    if (parts.length === 2) {
      try {
        const branch = bookmark?.defaultBranch;
        const enginePath = branch
          ? `/repos/${parts[0]}/${parts[1]}?branch=${encodeURIComponent(branch)}`
          : `/repos/${parts[0]}/${parts[1]}`;
        await engineFetch(ctx.orgId, enginePath, {
          method: "DELETE",
        });
      } catch (err) {
        // continue — soft-delete from DB even if engine is unavailable
        console.error("Engine delete failed for", repoName, err);
      }
    }

    // Soft-delete cloudRepos bookmark so the GET endpoint knows to suppress
    // this repo even if the engine is slow to process the delete.
    if (bookmark) {
      await db
        .update(cloudRepos)
        .set({ status: "deleted", updatedAt: new Date() })
        .where(eq(cloudRepos.id, bookmark.id));
    } else if (fullName) {
      // MCP-indexed repo with no bookmark — create a deleted marker so the
      // GET endpoint suppresses it from engine results.
      await db
        .insert(cloudRepos)
        .values({
          orgId: ctx.orgId,
          fullName,
          status: "deleted",
        })
        .onConflictDoNothing();
    }

    audit({
      orgId: ctx.orgId,
      userId: ctx.userId,
      action: "repo.deleted",
      resourceType: "repository",
      resourceId: repoName!,
      metadata: { repo: repoName!, mode: "cloud" },
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
