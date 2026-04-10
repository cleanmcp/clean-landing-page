import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  githubInstallations,
  indexingJobs,
  organizations,
  syncProjectRepos,
  syncProjects,
  syncRuns,
} from "@/lib/db/schema";
import { eq, and, ne, inArray, sql } from "drizzle-orm";
import { verifyWebhookSignature, getInstallationToken } from "@/lib/github-app";
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

    // --- Cross-platform sync ---
    const headCommit = payload.head_commit as Record<string, unknown> | undefined;
    const commitMessage = (headCommit?.message as string) ?? "";
    const commitSha = (headCommit?.id as string) ?? (payload.after as string) ?? "";
    const commitAuthorEmail = (headCommit?.author as Record<string, unknown>)?.email as string ?? "";

    // Only trigger if commit message contains "clean-cp"
    if (!commitMessage.toLowerCase().includes("clean-cp")) {
      // Normal push — no cross-platform sync
    } else if (branch.startsWith("feature/auto-sync-")) {
      // Loop prevention: skip auto-sync branches
    } else if (commitAuthorEmail === "sync-bot@auto.dev") {
      // Loop prevention: skip sync bot commits
    } else {
      // Find sync projects that include this repo
      const matchingRepos = await db
        .select({
          projectId: syncProjectRepos.projectId,
          projectName: syncProjects.name,
        })
        .from(syncProjectRepos)
        .innerJoin(syncProjects, eq(syncProjects.id, syncProjectRepos.projectId))
        .where(
          and(
            eq(syncProjectRepos.repoFullName, repo),
            eq(syncProjects.orgId, inst.orgId),
            eq(syncProjects.active, true)
          )
        );

      for (const match of matchingRepos) {
        // Get sibling repos (all other repos in this project)
        const siblings = await db
          .select()
          .from(syncProjectRepos)
          .where(
            and(
              eq(syncProjectRepos.projectId, match.projectId),
              ne(syncProjectRepos.repoFullName, repo)
            )
          );

        if (siblings.length === 0) continue;

        // Dedup: skip if a run exists for this project within 5 minutes
        const [recentRun] = await db
          .select({ id: syncRuns.id })
          .from(syncRuns)
          .where(
            and(
              eq(syncRuns.projectId, match.projectId),
              inArray(syncRuns.status, ["pending", "running"]),
              sql`${syncRuns.createdAt} > now() - interval '5 minutes'`
            )
          )
          .limit(1);

        if (recentRun) continue;

        // Get installation token for cloning/pushing
        let token: string;
        try {
          token = await getInstallationToken(installationId);
        } catch (err) {
          console.error("Failed to get installation token for sync:", err);
          continue;
        }

        // Create sync run record
        const [run] = await db
          .insert(syncRuns)
          .values({
            projectId: match.projectId,
            sourceRepoFullName: repo,
            commitSha,
            branch,
            targetCount: siblings.length,
          })
          .returning();

        // Fire to Modal orchestrator (fire-and-forget)
        const modalEndpoint = process.env.MODAL_SYNC_ENDPOINT;
        if (modalEndpoint) {
          fetch(modalEndpoint, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              sync_run_id: run.id,
              source_repo: repo,
              source_branch: branch,
              commit_sha: commitSha,
              targets: siblings.map((s) => ({
                repo: s.repoFullName,
                stack: s.stack,
                branch: s.branch,
              })),
              github_token: token,
              callback_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/sync-runs/${run.id}/status`,
              callback_secret: process.env.SYNC_WEBHOOK_SECRET,
            }),
          }).catch((err) => {
            console.error("Failed to trigger Modal sync:", err);
          });
        }
      }
    }
  }

  // Acknowledge all events (GitHub retries on non-2xx)
  return NextResponse.json({ ok: true });
}
