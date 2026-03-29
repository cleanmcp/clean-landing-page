import { NextRequest, NextResponse } from "next/server";
import { getAuthContext } from "@/lib/auth";
import { db } from "@/lib/db";
import { githubInstallations } from "@/lib/db/schema";
import { getInstallationInfo } from "@/lib/github-app";

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
    const returnUrl = `/api/github/callback?installation_id=${installationIdStr ?? ""}&setup_action=${setupAction ?? ""}`;
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

  // Redirect based on context
  if (setupAction === "update") {
    return NextResponse.redirect(`${appUrl}/dashboard/repositories`);
  }

  // Pass installation_id as fallback if save failed, so onboarding can retry
  const fallbackParam = !installSaved ? `&installation_id=${numericInstallationId}` : "";
  return NextResponse.redirect(`${appUrl}/dashboard/onboarding?step=select-repos${fallbackParam}`);
}
