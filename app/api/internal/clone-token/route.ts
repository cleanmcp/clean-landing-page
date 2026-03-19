import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";
import { db } from "@/lib/db";
import { githubInstallations, cloudRepos } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { getRepoScopedInstallationToken } from "@/lib/github-app";
import { audit } from "@/lib/audit";

const GATEWAY_SECRET = process.env.GATEWAY_INTERNAL_SECRET || "";

function verifySecret(request: NextRequest): boolean {
  if (!GATEWAY_SECRET) return false;
  const auth = request.headers.get("authorization");
  if (!auth?.startsWith("Bearer ")) return false;
  const provided = auth.slice(7);
  if (provided.length !== GATEWAY_SECRET.length) return false;
  try {
    return timingSafeEqual(
      Buffer.from(provided),
      Buffer.from(GATEWAY_SECRET)
    );
  } catch {
    return false;
  }
}

/**
 * POST /api/internal/clone-token
 *
 * Returns a short-lived, repo-scoped, read-only GitHub token for cloning.
 * Called by the Gateway on behalf of the Engine.
 *
 * Security:
 * - Only uses GitHub App installation tokens (no personal OAuth tokens)
 * - Token is scoped to a SINGLE repo with `contents: read` only
 * - Org must have a GitHub App installation covering the repo owner
 * - If installation doesn't cover the repo, GitHub returns 422 and we fail
 *
 * Body: { org_id: string, repo: string }
 * Auth: Authorization: Bearer <GATEWAY_INTERNAL_SECRET>
 */
export async function POST(request: NextRequest) {
  if (!verifySecret(request)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const orgId: string | undefined = body.org_id;
  const repo: string | undefined = body.repo;

  if (!orgId || !repo) {
    return NextResponse.json(
      { error: "org_id and repo are required" },
      { status: 400 }
    );
  }

  // Validate repo format
  const parts = repo.split("/");
  if (parts.length !== 2 || !parts[0] || !parts[1]) {
    return NextResponse.json(
      { error: "repo must be in owner/repo format" },
      { status: 400 }
    );
  }
  const repoOwner = parts[0].toLowerCase();
  const repoName = parts[1]; // GitHub API wants just the repo name, not owner/repo

  // --- 1. Fast path: repo is a known cloud repo with an installation ---
  try {
    const [cloudRepo] = await db
      .select({ installationId: cloudRepos.installationId })
      .from(cloudRepos)
      .where(
        and(eq(cloudRepos.orgId, orgId), eq(cloudRepos.fullName, repo))
      )
      .limit(1);

    if (cloudRepo?.installationId) {
      const [inst] = await db
        .select({ numericId: githubInstallations.installationId })
        .from(githubInstallations)
        .where(
          and(
            eq(githubInstallations.id, cloudRepo.installationId),
            eq(githubInstallations.active, true),
          )
        )
        .limit(1);

      if (inst?.numericId) {
        const token = await getRepoScopedInstallationToken(inst.numericId, repoName);
        audit({
          orgId,
          action: "clone_token.resolved",
          resourceType: "repo",
          resourceId: repo,
          metadata: { source: "installation", scoped: true },
        });
        return NextResponse.json({ token, source: "installation" });
      }
    }
  } catch (err) {
    // Fall through to installation lookup
    console.error("[clone-token] Cloud repo fast path failed:", err);
  }

  // --- 2. Find an installation whose account matches the repo owner ---
  try {
    const installations = await db
      .select({
        numericId: githubInstallations.installationId,
        accountLogin: githubInstallations.accountLogin,
      })
      .from(githubInstallations)
      .where(
        and(
          eq(githubInstallations.orgId, orgId),
          eq(githubInstallations.active, true),
        )
      );

    for (const inst of installations) {
      if (inst.accountLogin?.toLowerCase() === repoOwner) {
        try {
          const token = await getRepoScopedInstallationToken(inst.numericId, repoName);
          audit({
            orgId,
            action: "clone_token.resolved",
            resourceType: "repo",
            resourceId: repo,
            metadata: { source: "installation", scoped: true },
          });
          return NextResponse.json({ token, source: "installation" });
        } catch (err) {
          // GitHub returned 422 — installation doesn't cover this repo.
          // Try next installation if any.
          console.warn(
            `[clone-token] Installation ${inst.numericId} doesn't cover ${repo}:`,
            err instanceof Error ? err.message : err
          );
        }
      }
    }

    // No matching installation found
    const hasAnyInstallation = installations.length > 0;

    audit({
      orgId,
      action: "clone_token.failed",
      resourceType: "repo",
      resourceId: repo,
      metadata: {
        reason: hasAnyInstallation ? "repo_not_covered" : "no_installation",
        installations_checked: installations.length,
      },
    });

    if (hasAnyInstallation) {
      return NextResponse.json(
        {
          error: "repo_not_covered",
          message:
            `Your GitHub App installation doesn't cover '${repo}'. ` +
            "Update your GitHub App permissions to include this repository, " +
            "or add it via the Clean dashboard.",
        },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        error: "no_installation",
        message:
          "No GitHub App installed. Install the Clean GitHub App on your " +
          "GitHub account to index private repositories. " +
          "Visit your Clean dashboard → Repositories → Connect GitHub.",
      },
      { status: 404 }
    );
  } catch (err) {
    console.error("[clone-token] Installation lookup error:", err);
    return NextResponse.json(
      { error: "internal_error" },
      { status: 500 }
    );
  }
}
