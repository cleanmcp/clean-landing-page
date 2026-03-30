import { NextRequest, NextResponse } from "next/server";
import { getAuthContext } from "@/lib/auth";
import { db } from "@/lib/db";
import { githubInstallations } from "@/lib/db/schema";
import { and, eq, ne } from "drizzle-orm";
import { getInstallationInfo } from "@/lib/github-app";
import { getClerkGitHubToken } from "@/lib/github-clerk";

/**
 * POST /api/github/install/link — Manually link an existing GitHub App installation.
 *
 * Used when the GitHub redirect flow doesn't work (e.g., Setup URL points
 * to production while developing locally, or app is already installed).
 * Requires OWNER/ADMIN role and verifies the caller owns the GitHub account
 * that the installation belongs to.
 */
export async function POST(request: NextRequest) {
  const ctx = await getAuthContext();
  if (!ctx) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (ctx.role !== "OWNER" && ctx.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json().catch(() => ({}));
  const installationId = parseInt(body.installationId, 10);

  if (!installationId || isNaN(installationId)) {
    return NextResponse.json(
      { error: "A valid installation ID is required" },
      { status: 400 },
    );
  }

  // --- Reject if installation is already claimed by a different org ---
  const [existingClaim] = await db
    .select({ orgId: githubInstallations.orgId })
    .from(githubInstallations)
    .where(
      and(
        eq(githubInstallations.installationId, installationId),
        ne(githubInstallations.orgId, ctx.orgId),
        eq(githubInstallations.active, true),
      ),
    )
    .limit(1);

  if (existingClaim) {
    return NextResponse.json(
      { error: "This GitHub installation is already linked to another organization." },
      { status: 409 },
    );
  }

  try {
    const info = await getInstallationInfo(installationId);

    // --- Verify the caller owns this GitHub installation ---
    // Get the caller's GitHub identity via Clerk OAuth and confirm it matches
    // the GitHub account that owns the installation.
    const ghToken = await getClerkGitHubToken(ctx.userId);
    if (!ghToken) {
      return NextResponse.json(
        { error: "You must connect your GitHub account before linking an installation. Go to Settings to connect GitHub." },
        { status: 403 },
      );
    }

    const ghUserRes = await fetch("https://api.github.com/user", {
      headers: {
        Authorization: `Bearer ${ghToken}`,
        Accept: "application/vnd.github+json",
      },
    });

    if (!ghUserRes.ok) {
      return NextResponse.json(
        { error: "Failed to verify your GitHub identity. Please reconnect GitHub in Settings." },
        { status: 403 },
      );
    }

    const ghUser = await ghUserRes.json();
    const callerLogin = (ghUser.login as string).toLowerCase();
    const installationAccount = info.account.login.toLowerCase();

    if (info.account.type === "User") {
      // For user installations, the caller must be the account owner
      if (callerLogin !== installationAccount) {
        return NextResponse.json(
          { error: "You can only link installations belonging to your own GitHub account." },
          { status: 403 },
        );
      }
    } else {
      // For org installations, verify the caller is an admin of the GitHub org
      // (installing a GitHub App requires org admin permissions)
      const membershipRes = await fetch(
        `https://api.github.com/orgs/${encodeURIComponent(info.account.login)}/memberships/${encodeURIComponent(ghUser.login)}`,
        {
          headers: {
            Authorization: `Bearer ${ghToken}`,
            Accept: "application/vnd.github+json",
          },
        },
      );

      if (!membershipRes.ok) {
        return NextResponse.json(
          { error: "You must be an admin of this GitHub organization to link its installation." },
          { status: 403 },
        );
      }

      const membership = await membershipRes.json();
      if (membership.role !== "admin") {
        return NextResponse.json(
          { error: "You must be an admin of this GitHub organization to link its installation." },
          { status: 403 },
        );
      }
    }

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

    return NextResponse.json({
      linked: true,
      account: info.account.login,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("Failed to link GitHub installation:", message);

    if (message.includes("credentials not configured")) {
      return NextResponse.json(
        { error: "GitHub App credentials (GITHUB_APP_ID / GITHUB_APP_PRIVATE_KEY) are not configured." },
        { status: 500 },
      );
    }

    return NextResponse.json(
      { error: "Installation not found or not accessible." },
      { status: 404 },
    );
  }
}
