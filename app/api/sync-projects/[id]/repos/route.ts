import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { syncProjects, syncProjectRepos } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { getAuthContext } from "@/lib/auth";

const REPO_NAME_RE = /^[a-zA-Z0-9._-]+\/[a-zA-Z0-9._-]+$/;

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const ctx = await getAuthContext();
  if (!ctx || (ctx.role !== "OWNER" && ctx.role !== "ADMIN")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  // Verify project belongs to org
  const [project] = await db
    .select({ id: syncProjects.id })
    .from(syncProjects)
    .where(and(eq(syncProjects.id, id), eq(syncProjects.orgId, ctx.orgId)))
    .limit(1);

  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  const body = await request.json();
  const { repoFullName, stack, branch } = body as {
    repoFullName?: string;
    stack?: string;
    branch?: string;
  };

  if (!repoFullName || !REPO_NAME_RE.test(repoFullName)) {
    return NextResponse.json(
      { error: "Invalid repo name (expected owner/repo)" },
      { status: 400 }
    );
  }

  if (!stack || stack.trim().length === 0) {
    return NextResponse.json({ error: "Stack is required" }, { status: 400 });
  }

  const [repo] = await db
    .insert(syncProjectRepos)
    .values({
      projectId: id,
      repoFullName,
      stack: stack.trim(),
      branch: branch?.trim() || "main",
    })
    .onConflictDoNothing()
    .returning();

  if (!repo) {
    return NextResponse.json(
      { error: "Repo already in this project" },
      { status: 409 }
    );
  }

  return NextResponse.json({ repo });
}
