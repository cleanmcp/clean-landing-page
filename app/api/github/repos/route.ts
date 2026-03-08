import { NextResponse } from "next/server";
import { getAuthContext } from "@/lib/auth";
import { db } from "@/lib/db";
import { githubInstallations } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";
import { listInstallationRepos } from "@/lib/github-app";

/**
 * GET /api/github/repos — List all repos accessible via the org's GitHub App installations.
 *
 * Fetches repos from ALL active installations for the org (user might have
 * installed the app on their personal account + one or more GitHub orgs).
 *
 * Each repo includes our internal installation UUID so it can be linked
 * when adding cloud repos for indexing.
 */
export async function GET() {
  try {
    const ctx = await getAuthContext();
    if (!ctx) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get all active installations for this org
    const installations = await db
      .select({
        id: githubInstallations.id,
        installationId: githubInstallations.installationId,
        accountLogin: githubInstallations.accountLogin,
        accountAvatarUrl: githubInstallations.accountAvatarUrl,
      })
      .from(githubInstallations)
      .where(
        and(
          eq(githubInstallations.orgId, ctx.orgId),
          eq(githubInstallations.active, true)
        )
      );

    if (installations.length === 0) {
      return NextResponse.json({
        repos: [],
        installations: [],
        connected: false,
      });
    }

    // Fetch repos from each installation in parallel
    const repoResults = await Promise.allSettled(
      installations.map(async (inst) => {
        const repos = await listInstallationRepos(inst.installationId);
        return repos.map((r) => ({
          id: r.id,
          fullName: r.full_name,
          name: r.name,
          owner: r.owner.login,
          ownerAvatar: r.owner.avatar_url,
          private: r.private,
          defaultBranch: r.default_branch,
          language: r.language,
          description: r.description,
          updatedAt: r.updated_at,
          installationId: inst.id, // Our internal UUID
          installationAccount: inst.accountLogin,
        }));
      })
    );

    // Collect successful results, skip failed installations
    const repos = repoResults.flatMap((result) =>
      result.status === "fulfilled" ? result.value : []
    );

    // Deduplicate by fullName (same repo could appear in multiple installations — unlikely but safe)
    const seen = new Set<string>();
    const unique = repos.filter((r) => {
      if (seen.has(r.fullName)) return false;
      seen.add(r.fullName);
      return true;
    });

    return NextResponse.json({
      repos: unique,
      installations: installations.map((i) => ({
        id: i.id,
        accountLogin: i.accountLogin,
        accountAvatarUrl: i.accountAvatarUrl,
      })),
      connected: true,
    });
  } catch (error) {
    console.error("Failed to fetch GitHub repos:", error);
    return NextResponse.json(
      { error: "Failed to fetch repositories from GitHub" },
      { status: 500 }
    );
  }
}
