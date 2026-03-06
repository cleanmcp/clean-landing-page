import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { organizations } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { exchangeCodeForToken, getGitHubUser, verifyState } from "@/lib/github-oauth";

/**
 * GET /api/github/callback — GitHub redirects here after OAuth authorization.
 * Query params: code, state
 *
 * Auth is handled via HMAC-signed state (set during the authenticated /api/github/install call)
 * rather than Clerk session, because the popup redirect from GitHub may not carry cookies.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const stateParam = searchParams.get("state");

  if (!code) {
    return NextResponse.redirect(new URL("/dashboard?github_error=missing_code", request.url));
  }

  if (!stateParam) {
    return NextResponse.redirect(new URL("/dashboard?github_error=missing_state", request.url));
  }

  // Verify the HMAC-signed state
  const state = verifyState(stateParam);
  if (!state || !state.orgId || !state.userId) {
    return NextResponse.redirect(new URL("/dashboard?github_error=invalid_state", request.url));
  }

  const orgId = state.orgId as string;
  const returnTo = typeof state.returnTo === "string" && (state.returnTo as string).startsWith("/")
    ? (state.returnTo as string)
    : "/dashboard/onboarding";

  // Exchange code for access token
  let accessToken: string;
  try {
    accessToken = await exchangeCodeForToken(code);
  } catch (err) {
    console.error("GitHub OAuth token exchange failed:", err);
    return NextResponse.redirect(new URL("/dashboard?github_error=token_exchange_failed", request.url));
  }

  // Fetch GitHub user info
  let githubLogin = "unknown";
  try {
    const user = await getGitHubUser(accessToken);
    githubLogin = user.login;
  } catch {
    // continue with defaults
  }

  // Store token + login on the organization and set cloud mode
  await db
    .update(organizations)
    .set({
      githubAccessToken: accessToken,
      githubLogin: githubLogin,
      hostingMode: "cloud",
    })
    .where(eq(organizations.id, orgId));

  return NextResponse.redirect(new URL(`${returnTo}?github=connected`, request.url));
}
