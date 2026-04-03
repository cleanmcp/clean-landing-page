import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getAuthContext } from "@/lib/auth";
import { db } from "@/lib/db";
import { githubInstallations } from "@/lib/db/schema";
import { and, eq, ne } from "drizzle-orm";
import { getInstallationInfo } from "@/lib/github-app";
import {
  verifyInstallState,
  INSTALL_STATE_COOKIE,
} from "@/lib/github-install-state";

/**
 * GET /api/github/callback — Handle redirect after GitHub App installation.
 *
 * GitHub redirects here with ?installation_id=123&setup_action=install
 * after a user installs or updates the GitHub App.
 *
 * We link the GitHub installation to the user's current Clean org.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const installationIdStr = searchParams.get("installation_id");
  const setupAction = searchParams.get("setup_action");
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://tryclean.ai";

  // Must be authenticated — if session expired while on GitHub, redirect to
  // sign-in with a return URL so the installation isn't lost
  const ctx = await getAuthContext();
  if (!ctx) {
    const stateParam = searchParams.get("state");
    const returnUrl = `/api/github/callback?installation_id=${installationIdStr ?? ""}&setup_action=${setupAction ?? ""}${stateParam ? `&state=${encodeURIComponent(stateParam)}` : ""}`;
    const signInUrl = `/sign-in?redirect_url=${encodeURIComponent(returnUrl)}`;
    return NextResponse.redirect(`${appUrl}${signInUrl}`);
  }

  if (!installationIdStr) {
    return NextResponse.redirect(`${appUrl}/dashboard/repositories`);
  }

  const numericInstallationId = parseInt(installationIdStr, 10);
  if (isNaN(numericInstallationId)) {
    return NextResponse.redirect(`${appUrl}/dashboard/repositories`);
  }

  // --- CSRF protection via state cookie (double-submit pattern) ---
  //
  // Strict state verification for new installs (setup_action=install).
  // For updates to already-linked installations (setup_action=update),
  // GitHub may drop the state param, so we allow it if the installation
  // is already linked to this org (no new trust is being established).
  const state = searchParams.get("state");
  const cookieStore = await cookies();
  const stateCookie = cookieStore.get(INSTALL_STATE_COOKIE)?.value;
  const stateValid = state && stateCookie && verifyInstallState(state, stateCookie, ctx.userId, ctx.orgId);

  // Check if this installation is already linked to the current org
  const [alreadyLinked] = await db
    .select({ id: githubInstallations.id })
    .from(githubInstallations)
    .where(
      and(
        eq(githubInstallations.installationId, numericInstallationId),
        eq(githubInstallations.orgId, ctx.orgId),
      ),
    )
    .limit(1);

  // Allow without state if: (a) it's an update to an existing link, or
  // (b) the installation is already ours. Otherwise require valid state.
  if (!stateValid && !alreadyLinked) {
    console.warn("[github/callback] Invalid or missing install state — possible CSRF attempt");
    return NextResponse.redirect(
      `${appUrl}/dashboard/repositories?error=invalid_state`,
    );
  }

  // --- Reject if installation is already claimed by a different org ---
  const [existingClaim] = await db
    .select({ orgId: githubInstallations.orgId })
    .from(githubInstallations)
    .where(
      and(
        eq(githubInstallations.installationId, numericInstallationId),
        ne(githubInstallations.orgId, ctx.orgId),
        eq(githubInstallations.active, true),
      ),
    )
    .limit(1);

  if (existingClaim) {
    console.warn(`[github/callback] Installation ${numericInstallationId} already claimed by org ${existingClaim.orgId}`);
    return NextResponse.redirect(
      `${appUrl}/dashboard/repositories?error=installation_claimed`,
    );
  }

  let installSaved = false;
  try {
    // Fetch installation details from GitHub to verify the installation exists
    const info = await getInstallationInfo(numericInstallationId);

    // Atomic upsert using the unique constraint on (org_id, installation_id)
    await db
      .insert(githubInstallations)
      .values({
        orgId: ctx.orgId,
        installationId: numericInstallationId,
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
    installSaved = true;
  } catch (error) {
    console.error("Failed to fetch GitHub installation info:", error);
    // Still save the installation with minimal info so the connection is
    // established even if the GitHub API call fails (e.g. missing credentials).
    // The account details will be populated later when repos are fetched.
    try {
      await db
        .insert(githubInstallations)
        .values({
          orgId: ctx.orgId,
          installationId: numericInstallationId,
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
      installSaved = true;
    } catch (dbError) {
      console.error("Failed to save GitHub installation fallback:", dbError);
    }
  }

  // Redirect based on context — clear the CSRF cookie on the redirect response
  let redirectUrl: string;
  if (setupAction === "update") {
    redirectUrl = `${appUrl}/dashboard/repositories`;
  } else {
    // Pass installation_id as fallback if save failed, so onboarding can retry
    const fallbackParam = !installSaved ? `&installation_id=${numericInstallationId}` : "";
    redirectUrl = `${appUrl}/dashboard/onboarding?step=select-repos${fallbackParam}`;
  }

  const redirect = NextResponse.redirect(redirectUrl);
  if (installSaved) {
    redirect.cookies.delete(INSTALL_STATE_COOKIE);
  }
  return redirect;
}
