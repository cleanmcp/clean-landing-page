import { NextRequest, NextResponse } from "next/server";
import { getAuthContext } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  cloudRepos,
  organizations,
} from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { getCloudTierLimits } from "@/lib/tier-limits";
import { engineFetch } from "@/lib/engine";
import { audit } from "@/lib/audit";

/**
 * GET /api/cloud-repos — List cloud repos for the current org.
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

    return NextResponse.json({
      repos: repos.map((r) => ({
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
      })),
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

    const toInsert = reposToAdd.slice(0, maxNew);

    // Insert cloud repo records
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
      .returning({ id: cloudRepos.id, fullName: cloudRepos.fullName });

    // Trigger indexing for each repo via the engine
    for (const repo of inserted) {
      try {
        await engineFetch(
          ctx.orgId,
          `/repos/index?repo=${encodeURIComponent(repo.fullName)}`,
          { method: "POST" }
        );

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
      } catch {
        await db
          .update(cloudRepos)
          .set({
            status: "error",
            error: "Failed to start indexing",
            updatedAt: new Date(),
          })
          .where(eq(cloudRepos.id, repo.id));
      }
    }

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
