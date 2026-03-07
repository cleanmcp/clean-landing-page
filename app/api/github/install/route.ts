import { NextResponse } from "next/server";
import { getAuthContext } from "@/lib/auth";
import { getClerkGitHubToken } from "@/lib/github-clerk";

/**
 * GET /api/github/install — Check if user has GitHub connected.
 * If yes, returns connected: true.
 * If no, returns connected: false so the frontend can trigger Clerk OAuth linking.
 */
export async function GET() {
  const ctx = await getAuthContext();
  if (!ctx) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const token = await getClerkGitHubToken(ctx.userId);

  return NextResponse.json({ connected: !!token });
}
