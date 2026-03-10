import { clerkClient } from "@clerk/nextjs/server";

/**
 * Get GitHub OAuth token from Clerk for a user.
 * Returns null if user hasn't connected GitHub.
 */
export async function getClerkGitHubToken(userId: string): Promise<string | null> {
  try {
    const client = await clerkClient();
    const tokens = await client.users.getUserOauthAccessToken(userId, "oauth_github");
    return tokens.data?.[0]?.token ?? null;
  } catch {
    return null;
  }
}
