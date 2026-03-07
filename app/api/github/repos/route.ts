import { NextResponse } from "next/server";
import { getAuthContext } from "@/lib/auth";
import { getClerkGitHubToken } from "@/lib/github-clerk";
import { listUserRepos } from "@/lib/github-oauth";

/**
 * GET /api/github/repos — List all repos accessible via the user's GitHub token.
 * Token is pulled from Clerk (linked GitHub account).
 */
export async function GET() {
  try {
    const ctx = await getAuthContext();
    if (!ctx) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = await getClerkGitHubToken(ctx.userId);
    if (!token) {
      return NextResponse.json({ repos: [], installations: [], connected: false });
    }

    const repos = await listUserRepos(token);

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
      installations: [],
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
