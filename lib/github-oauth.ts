/**
 * GitHub OAuth utilities for cloud onboarding.
 * Handles OAuth authorization, token exchange, user info, and repo listing.
 */

import { createHmac } from "crypto";

const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID || "";
const GITHUB_CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET || "";

/**
 * Sign a state payload with HMAC so the callback can trust it without Clerk auth.
 * Uses GITHUB_CLIENT_SECRET as the HMAC key.
 */
export function signState(payload: Record<string, unknown>): string {
  const data = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const sig = createHmac("sha256", GITHUB_CLIENT_SECRET).update(data).digest("base64url");
  return `${data}.${sig}`;
}

/**
 * Verify and decode a signed state string. Returns null if invalid.
 */
export function verifyState(state: string): Record<string, unknown> | null {
  const dotIdx = state.lastIndexOf(".");
  if (dotIdx === -1) return null;

  const data = state.slice(0, dotIdx);
  const sig = state.slice(dotIdx + 1);
  const expected = createHmac("sha256", GITHUB_CLIENT_SECRET).update(data).digest("base64url");

  if (sig !== expected) return null;

  try {
    return JSON.parse(Buffer.from(data, "base64url").toString());
  } catch {
    return null;
  }
}

export function getGitHubOAuthUrl(state: string): string {
  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/github/callback`;
  const params = new URLSearchParams({
    client_id: GITHUB_CLIENT_ID,
    scope: "read:user,repo",
    state,
    redirect_uri: redirectUri,
  });
  return `https://github.com/login/oauth/authorize?${params.toString()}`;
}

export async function exchangeCodeForToken(code: string): Promise<string> {
  const res = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      client_id: GITHUB_CLIENT_ID,
      client_secret: GITHUB_CLIENT_SECRET,
      code,
    }),
  });

  if (!res.ok) {
    throw new Error(`GitHub token exchange failed: ${res.status}`);
  }

  const data = await res.json();
  if (data.error) {
    throw new Error(`GitHub OAuth error: ${data.error_description || data.error}`);
  }

  return data.access_token;
}

export async function getGitHubUser(token: string): Promise<{ login: string; avatar_url: string }> {
  const res = await fetch("https://api.github.com/user", {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
    },
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch GitHub user: ${res.status}`);
  }

  return res.json();
}

export interface GitHubOAuthRepo {
  id: number;
  full_name: string;
  name: string;
  owner: { login: string; avatar_url: string };
  private: boolean;
  default_branch: string;
  language: string | null;
  description: string | null;
  updated_at: string;
}

export async function listUserRepos(token: string): Promise<GitHubOAuthRepo[]> {
  const repos: GitHubOAuthRepo[] = [];
  let page = 1;

  while (true) {
    const res = await fetch(
      `https://api.github.com/user/repos?per_page=100&sort=updated&type=all&page=${page}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/vnd.github+json",
        },
      }
    );

    if (!res.ok) break;

    const data = await res.json();
    repos.push(...data);

    if (data.length < 100) break;
    page++;
  }

  return repos;
}
