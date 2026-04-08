import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { githubInstallations, indexingJobs, organizations } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { verifyWebhookSignature } from "@/lib/github-app";
import { getTierPriority } from "@/lib/tier-priority";

/**
 * POST /api/webhooks/github — Handle GitHub App webhook events.
 *
 * Handles:
 * - installation.deleted → mark installation as inactive
 * - installation.suspend → mark installation as inactive
 * - installation.unsuspend → mark installation as active
 *
 * installation.created is NOT handled here because we don't know
 * which Clean org it belongs to. That mapping happens in the
 * /api/github/callback redirect handler.
 */
export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get("x-hub-signature-256") || "";
  const event = request.headers.get("x-github-event") || "";

  // Verify webhook signature
  if (!verifyWebhookSignature(body, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let payload: Record<string, unknown>;
  try {
    payload = JSON.parse(body);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (event === "installation") {
    const action = payload.action as string | undefined;
    const installation = payload.installation as Record<string, unknown> | undefined;
    const installationId = installation?.id as number | undefined;

    if (!installationId) {
      return NextResponse.json({ ok: true });
    }

    if (action === "deleted" || action === "suspend") {
      // Mark all matching installations as inactive
      await db
        .update(githubInstallations)
        .set({ active: false, updatedAt: new Date() })
        .where(eq(githubInstallations.installationId, installationId));
    }

    if (action === "unsuspend") {
      await db
        .update(githubInstallations)
        .set({ active: true, updatedAt: new Date() })
        .where(eq(githubInstallations.installationId, installationId));
    }
  }

  if (event === "push") {
    const repo = (payload.repository as Record<string, unknown>)?.full_name as string;
    const branch = ((payload.ref as string) ?? "").replace("refs/heads/", "");
    const installationId = (payload.installation as Record<string, unknown>)?.id as number;

    if (!repo || !branch) {
      return NextResponse.json({ ok: true });
    }

    // Find which org this installation belongs to
    const [inst] = await db
      .select({ orgId: githubInstallations.orgId })
      .from(githubInstallations)
      .where(eq(githubInstallations.installationId, installationId))
      .limit(1);

    if (!inst) {
      return NextResponse.json({ ok: true }); // Unknown installation
    }

    // Get org tier for priority
    const [org] = await db
      .select({ tier: organizations.tier })
      .from(organizations)
      .where(eq(organizations.id, inst.orgId))
      .limit(1);

    const priority = getTierPriority(org?.tier ?? "free") + 5; // +5 bonus for webhooks

    // Queue re-index
    await db.insert(indexingJobs).values({
      orgId: inst.orgId,
      repoFullName: repo,
      branch,
      installationId,
      priority,
      triggeredBy: "webhook_push",
    }).onConflictDoNothing(); // dedup
  }

  // Acknowledge all events (GitHub retries on non-2xx)
  return NextResponse.json({ ok: true });
}
