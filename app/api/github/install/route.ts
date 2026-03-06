import { type NextRequest, NextResponse } from "next/server";
import { getAuthContext } from "@/lib/auth";
import { getGitHubOAuthUrl, signState } from "@/lib/github-oauth";

/**
 * GET /api/github/install — Returns the GitHub OAuth authorization URL.
 */
export async function GET(request: NextRequest) {
  const ctx = await getAuthContext();
  if (!ctx) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const returnTo = request.nextUrl.searchParams.get("returnTo") ?? "/dashboard/onboarding";
  const payload = { orgId: ctx.orgId, userId: ctx.userId, returnTo };
  const state = signState(payload);
  const url = getGitHubOAuthUrl(state);

  return NextResponse.json({ url });
}
