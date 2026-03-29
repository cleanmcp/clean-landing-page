import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getAuthContext } from "@/lib/auth";
import { db } from "@/lib/db";
import { githubInstallations } from "@/lib/db/schema";
import { and, eq, ne } from "drizzle-orm";
import { getGitHubAppInstallUrl, getInstallationInfo } from "@/lib/github-app";
import {
  createInstallState,
  verifyInstallCookie,
  INSTALL_STATE_COOKIE,
} from "@/lib/github-install-state";

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

  // Generate a signed state token for CSRF protection on the install flow.
  // The nonce travels through GitHub's redirect; the cookie stays in the browser.
  const { nonce, cookie: stateCookie } = createInstallState(ctx.userId, ctx.orgId);
  const cookieStore = await cookies();
  cookieStore.set(INSTALL_STATE_COOKIE, stateCookie, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 30 * 60, // 30 minutes
    path: "/",
  });

  return NextResponse.json({
    connected: installations.length > 0,
    installations,
    installUrl: getGitHubAppInstallUrl(nonce),
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

  // Verify the install-state cookie to confirm this user initiated the
  // GitHub App installation flow from our app (prevents hijacking).
  const cookieStore = await cookies();
  const stateCookie = cookieStore.get(INSTALL_STATE_COOKIE)?.value;
  if (!stateCookie || !verifyInstallCookie(stateCookie, ctx.userId, ctx.orgId)) {
    return NextResponse.json(
      { error: "Install flow not initiated or session expired. Please try again." },
      { status: 403 },
    );
  }

  const body = await request.json().catch(() => ({}));
  const installationId = parseInt(body.installationId, 10);

  if (!installationId || isNaN(installationId)) {
    return NextResponse.json({ error: "Missing installation_id" }, { status: 400 });
  }

  // Reject if this installation is already linked to a different org.
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
      { error: "This GitHub installation is already linked to another organization" },
      { status: 409 },
    );
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

    // Clear the state cookie after successful save
    cookieStore.delete(INSTALL_STATE_COOKIE);

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

/**
 * DELETE /api/github/install?id=<uuid> — Disconnect a GitHub App installation.
 *
 * Sets the installation to inactive (soft delete). Only OWNER/ADMIN can disconnect.
 */
export async function DELETE(request: NextRequest) {
  const ctx = await getAuthContext();
  if (!ctx) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (ctx.role !== "OWNER" && ctx.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const installId = searchParams.get("id");

  if (!installId) {
    return NextResponse.json({ error: "Missing installation id" }, { status: 400 });
  }

  const result = await db
    .update(githubInstallations)
    .set({ active: false, updatedAt: new Date() })
    .where(
      and(
        eq(githubInstallations.id, installId),
        eq(githubInstallations.orgId, ctx.orgId),
      ),
    )
    .returning({ id: githubInstallations.id });

  if (result.length === 0) {
    return NextResponse.json({ error: "Installation not found" }, { status: 404 });
  }

  return NextResponse.json({ disconnected: true });
}
