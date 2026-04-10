import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { syncProjects, syncProjectRepos, syncRuns } from "@/lib/db/schema";
import { eq, desc, sql } from "drizzle-orm";
import { getAuthContext } from "@/lib/auth";

export async function GET() {
  const ctx = await getAuthContext();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const projects = await db
    .select({
      id: syncProjects.id,
      name: syncProjects.name,
      description: syncProjects.description,
      active: syncProjects.active,
      createdAt: syncProjects.createdAt,
      updatedAt: syncProjects.updatedAt,
      repoCount: sql<number>`(
        SELECT count(*) FROM sync_project_repos
        WHERE project_id = ${syncProjects.id}
      )`.as("repo_count"),
    })
    .from(syncProjects)
    .where(eq(syncProjects.orgId, ctx.orgId))
    .orderBy(desc(syncProjects.createdAt));

  // Get latest run for each project
  const projectIds = projects.map((p) => p.id);
  const latestRuns =
    projectIds.length > 0
      ? await db
          .select({
            projectId: syncRuns.projectId,
            status: syncRuns.status,
            createdAt: syncRuns.createdAt,
            sourceRepoFullName: syncRuns.sourceRepoFullName,
          })
          .from(syncRuns)
          .where(
            sql`${syncRuns.projectId} IN ${projectIds} AND ${syncRuns.createdAt} = (
              SELECT max(created_at) FROM sync_runs sr
              WHERE sr.project_id = ${syncRuns.projectId}
            )`
          )
      : [];

  const runMap = new Map(latestRuns.map((r) => [r.projectId, r]));

  return NextResponse.json({
    projects: projects.map((p) => ({
      ...p,
      latestRun: runMap.get(p.id) ?? null,
    })),
  });
}

export async function POST(request: NextRequest) {
  const ctx = await getAuthContext();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { name, description } = body as { name?: string; description?: string };

  if (!name || name.trim().length === 0 || name.length > 100) {
    return NextResponse.json(
      { error: "Name is required (max 100 chars)" },
      { status: 400 }
    );
  }

  const [project] = await db
    .insert(syncProjects)
    .values({
      orgId: ctx.orgId,
      name: name.trim(),
      description: description?.trim() || null,
    })
    .returning();

  return NextResponse.json({ project });
}
