import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { syncProjects, syncProjectRepos } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { getAuthContext } from "@/lib/auth";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; repoId: string }> }
) {
  const ctx = await getAuthContext();
  if (!ctx || (ctx.role !== "OWNER" && ctx.role !== "ADMIN")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id, repoId } = await params;

  // Verify project belongs to org
  const [project] = await db
    .select({ id: syncProjects.id })
    .from(syncProjects)
    .where(and(eq(syncProjects.id, id), eq(syncProjects.orgId, ctx.orgId)))
    .limit(1);

  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  const [deleted] = await db
    .delete(syncProjectRepos)
    .where(
      and(
        eq(syncProjectRepos.id, repoId),
        eq(syncProjectRepos.projectId, id)
      )
    )
    .returning({ id: syncProjectRepos.id });

  if (!deleted) {
    return NextResponse.json({ error: "Repo not found" }, { status: 404 });
  }

  return NextResponse.json({ status: "deleted" });
}
