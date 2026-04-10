import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { syncProjects, syncProjectRepos, syncRuns } from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { getAuthContext } from "@/lib/auth";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const ctx = await getAuthContext();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const [project] = await db
    .select()
    .from(syncProjects)
    .where(and(eq(syncProjects.id, id), eq(syncProjects.orgId, ctx.orgId)))
    .limit(1);

  if (!project) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const repos = await db
    .select()
    .from(syncProjectRepos)
    .where(eq(syncProjectRepos.projectId, id));

  const runs = await db
    .select()
    .from(syncRuns)
    .where(eq(syncRuns.projectId, id))
    .orderBy(desc(syncRuns.createdAt))
    .limit(20);

  return NextResponse.json({ project: { ...project, repos, runs } });
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const ctx = await getAuthContext();
  if (!ctx || (ctx.role !== "OWNER" && ctx.role !== "ADMIN")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();
  const { name, description, active } = body as {
    name?: string;
    description?: string;
    active?: boolean;
  };

  const updates: Record<string, unknown> = { updatedAt: new Date() };
  if (name !== undefined) updates.name = name.trim();
  if (description !== undefined) updates.description = description?.trim() || null;
  if (active !== undefined) updates.active = active;

  const [updated] = await db
    .update(syncProjects)
    .set(updates)
    .where(and(eq(syncProjects.id, id), eq(syncProjects.orgId, ctx.orgId)))
    .returning();

  if (!updated) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ project: updated });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const ctx = await getAuthContext();
  if (!ctx || (ctx.role !== "OWNER" && ctx.role !== "ADMIN")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const [deleted] = await db
    .delete(syncProjects)
    .where(and(eq(syncProjects.id, id), eq(syncProjects.orgId, ctx.orgId)))
    .returning({ id: syncProjects.id });

  if (!deleted) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ status: "deleted" });
}
