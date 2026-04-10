import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { syncRuns } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Authenticate via shared secret
  const secret = request.headers.get("x-sync-secret");
  if (!secret || secret !== process.env.SYNC_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();
  const { status, completedCount, failedCount, error } = body as {
    status?: string;
    completedCount?: number;
    failedCount?: number;
    error?: string;
  };

  const updates: Record<string, unknown> = {};
  if (status) updates.status = status;
  if (completedCount !== undefined) updates.completedCount = completedCount;
  if (failedCount !== undefined) updates.failedCount = failedCount;
  if (error !== undefined) updates.error = error;

  if (status === "running") {
    updates.startedAt = new Date();
  }
  if (status === "completed" || status === "failed" || status === "partial_failure") {
    updates.completedAt = new Date();
  }

  const [updated] = await db
    .update(syncRuns)
    .set(updates)
    .where(eq(syncRuns.id, id))
    .returning({ id: syncRuns.id });

  if (!updated) {
    return NextResponse.json({ error: "Run not found" }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
