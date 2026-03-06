import { NextResponse } from "next/server";
import { getAuthContext } from "@/lib/auth";
import { db } from "@/lib/db";
import { organizations, githubInstallations } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { listUserRepos } from "@/lib/github-oauth";
import { listInstallationRepos } from "@/lib/github-app";

/**
 * GET /api/github/repos — List all repos accessible via OAuth token (primary)
 * or GitHub App installations (fallback for existing users).
 */
export async function GET() {
  try {
    const ctx = await getAuthContext();
    if (!ctx) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check for OAuth token on the org
    const [org] = await db
      .select({
        githubAccessToken: organizations.githubAccessToken,
        githubLogin: organizations.githubLogin,
      })
      .from(organizations)
      .where(eq(organizations.id, ctx.orgId))
      .limit(1);

    // Primary path: OAuth token
    if (org?.githubAccessToken) {
      try {
        const repos = await listUserRepos(org.githubAccessToken);
        return NextResponse.json({
          repos: repos.map((r) => ({
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
            installationId: null,
          })),
          installations: [{ accountLogin: org.githubLogin }],
          connected: true,
        });
      } catch (err) {
        console.error("Failed to fetch repos via OAuth token:", err);
        // Token may be revoked — fall through to installation fallback
      }
    }

    // Fallback: GitHub App installations (backward compat)
    const installations = await db
      .select()
      .from(githubInstallations)
      .where(
        and(
          eq(githubInstallations.orgId, ctx.orgId),
          eq(githubInstallations.active, true)
        )
      );

    if (installations.length === 0) {
      return NextResponse.json({ repos: [], installations: [], connected: false });
    }

    const results = await Promise.allSettled(
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
          installationId: inst.id,
        }));
      })
    );

    type MappedRepo = {
      id: number;
      fullName: string;
      name: string;
      owner: string;
      ownerAvatar: string;
      private: boolean;
      defaultBranch: string;
      language: string | null;
      description: string | null;
      updatedAt: string;
      installationId: string;
    };

    const allRepos: MappedRepo[] = results
      .filter((r): r is PromiseFulfilledResult<MappedRepo[]> => r.status === "fulfilled")
      .flatMap((r) => r.value);

    const seen = new Set<string>();
    const unique = allRepos.filter((r) => {
      if (seen.has(r.fullName)) return false;
      seen.add(r.fullName);
      return true;
    });

    return NextResponse.json({
      repos: unique,
      installations: installations.map((i) => ({
        id: i.id,
        installationId: i.installationId,
        accountLogin: i.accountLogin,
        accountType: i.accountType,
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
