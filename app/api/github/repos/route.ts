import { NextResponse } from "next/server";
import { getAuthContext } from "@/lib/auth";
import { db } from "@/lib/db";
import { githubInstallations } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";
import { listInstallationRepos } from "@/lib/github-app";
import { reconcileInstallation } from "@/lib/github-reconcile";

/**
 * GET /api/github/repos — List all repos accessible via the org's GitHub App installations.
 *
 * Fetches repos from ALL active installations for the org (user might have
 * installed the app on their personal account + one or more GitHub orgs).
 *
 * Each repo includes our internal installation UUID so it can be linked
 * when adding cloud repos for indexing.
 *
 * If an installation's ID is stale (404), auto-heals via reconciliation
 * and retries. Surfaces disconnected accounts so the frontend can warn.
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

    const mapRepo = (r: any, inst: { id: string; accountLogin: string }) => ({
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
      installationId: inst.id,
      installationAccount: inst.accountLogin,
    });

    // Fetch repos per installation with auto-heal on failure
    const repoResults: Array<{ repos: any[]; error?: string; account: string }> = [];

    for (const inst of installations) {
      try {
        const repos = await listInstallationRepos(inst.installationId);
        repoResults.push({
          account: inst.accountLogin,
          repos: repos.map((r) => mapRepo(r, inst)),
        });
      } catch (err) {
        // Installation ID may be stale — try auto-heal
        console.warn(`[github/repos] Failed to list repos for ${inst.accountLogin} (install=${inst.installationId}):`, err);

        try {
          const result = await reconcileInstallation(inst.accountLogin, ctx.orgId, inst.id);
          if (result.healed && result.newInstallationId) {
            try {
              const repos = await listInstallationRepos(result.newInstallationId);
              repoResults.push({
                account: inst.accountLogin,
                repos: repos.map((r) => mapRepo(r, inst)),
              });
              continue;
            } catch {
              // Healed ID also failed — fall through to error
            }
          }
          repoResults.push({
            account: inst.accountLogin,
            repos: [],
            error: result.error || `Failed to fetch repos from ${inst.accountLogin}`,
          });
        } catch {
          repoResults.push({
            account: inst.accountLogin,
            repos: [],
            error: `Failed to reconnect ${inst.accountLogin}`,
          });
        }
      }
    }

    // Flatten all repos
    const allRepos = repoResults.flatMap((r) => r.repos);

    // Deduplicate by fullName (same repo could appear in multiple installations — unlikely but safe)
    const seen = new Set<string>();
    const unique = allRepos.filter((r) => {
      if (seen.has(r.fullName)) return false;
      seen.add(r.fullName);
      return true;
    });

    const disconnected = repoResults
      .filter((r) => r.error)
      .map((r) => ({ accountLogin: r.account, error: r.error! }));

    return NextResponse.json({
      repos: unique,
      installations: installations.map((i) => ({
        id: i.id,
        accountLogin: i.accountLogin,
        accountAvatarUrl: i.accountAvatarUrl,
      })),
      connected: true,
      disconnected,
    });
  } catch (error) {
    console.error("Failed to fetch GitHub repos:", error);
    return NextResponse.json(
      { error: "Failed to fetch repositories from GitHub" },
      { status: 500 }
    );
  }
}
