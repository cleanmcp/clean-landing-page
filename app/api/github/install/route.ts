import { NextResponse } from "next/server";
import { getAuthContext } from "@/lib/auth";
import { db } from "@/lib/db";
import { githubInstallations } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";
import { getGitHubAppInstallUrl } from "@/lib/github-app";

/**
 * GET /api/github/install — Check GitHub App installation status for the current org.
 *
 * Returns whether the org has any active GitHub App installations,
 * and the URL to install the app if not.
 */
export async function GET() {
  const ctx = await getAuthContext();
  if (!ctx) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const installations = await db
    .select({
      id: githubInstallations.id,
      installationId: githubInstallations.installationId,
      accountLogin: githubInstallations.accountLogin,
      accountType: githubInstallations.accountType,
      accountAvatarUrl: githubInstallations.accountAvatarUrl,
    })
    .from(githubInstallations)
    .where(
      and(
        eq(githubInstallations.orgId, ctx.orgId),
        eq(githubInstallations.active, true)
      )
    );

  return NextResponse.json({
    connected: installations.length > 0,
    installations,
    installUrl: getGitHubAppInstallUrl(),
  });
}
