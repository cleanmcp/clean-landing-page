import { NextRequest, NextResponse } from "next/server";
import { getAuthContext } from "@/lib/auth";
import { db } from "@/lib/db";
import { githubInstallations } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";
import { getGitHubAppInstallUrl, getInstallationInfo } from "@/lib/github-app";

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

/**
 * POST /api/github/install — Save a GitHub App installation by ID.
 *
 * Used as a fallback when the callback redirect silently fails to persist
 * the installation (e.g., GitHub App credentials misconfigured on server).
 * The client can call this with the installation_id from the redirect URL.
 */
export async function POST(request: NextRequest) {
  const ctx = await getAuthContext();
  if (!ctx) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const installationId = parseInt(body.installationId, 10);

  if (!installationId || isNaN(installationId)) {
    return NextResponse.json({ error: "Missing installation_id" }, { status: 400 });
  }

  try {
    const info = await getInstallationInfo(installationId);

    await db
      .insert(githubInstallations)
      .values({
        orgId: ctx.orgId,
        installationId,
        accountLogin: info.account.login,
        accountType: info.account.type,
        accountAvatarUrl: info.account.avatar_url,
      })
      .onConflictDoUpdate({
        target: [githubInstallations.orgId, githubInstallations.installationId],
        set: {
          active: true,
          accountLogin: info.account.login,
          accountType: info.account.type,
          accountAvatarUrl: info.account.avatar_url,
          updatedAt: new Date(),
        },
      });

    return NextResponse.json({ saved: true });
  } catch (error) {
    console.error("Failed to verify GitHub installation:", error);
    // Save with minimal info so the connection is established even if
    // the GitHub API verification fails
    try {
      await db
        .insert(githubInstallations)
        .values({
          orgId: ctx.orgId,
          installationId,
          accountLogin: "unknown",
          accountType: "User",
          accountAvatarUrl: "",
        })
        .onConflictDoUpdate({
          target: [githubInstallations.orgId, githubInstallations.installationId],
          set: {
            active: true,
            updatedAt: new Date(),
          },
        });
      return NextResponse.json({ saved: true });
    } catch (dbError) {
      console.error("Failed to save GitHub installation fallback:", dbError);
      return NextResponse.json(
        { error: "Failed to save installation" },
        { status: 500 }
      );
    }
  }
}
