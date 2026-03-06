/**
 * GitHub App utilities for cloud onboarding.
 * Handles installation token generation and repo listing.
 */

const GITHUB_APP_ID = process.env.GITHUB_APP_ID || "";
const GITHUB_APP_PRIVATE_KEY = (process.env.GITHUB_APP_PRIVATE_KEY || "").replace(/\\n/g, "\n");
const GITHUB_APP_SLUG = process.env.NEXT_PUBLIC_GITHUB_APP_SLUG || "clean-code-search";

/**
 * Get the GitHub App installation URL for the user to install/configure the app.
 */
export function getGitHubAppInstallUrl(state?: string): string {
  const base = `https://github.com/apps/${GITHUB_APP_SLUG}/installations/new`;
  return state ? `${base}?state=${encodeURIComponent(state)}` : base;
}

/**
 * Generate a JWT for GitHub App authentication.
 * Used to request installation access tokens.
 */
async function generateAppJwt(): Promise<string> {
  if (!GITHUB_APP_ID || !GITHUB_APP_PRIVATE_KEY) {
    throw new Error("GitHub App credentials not configured (GITHUB_APP_ID, GITHUB_APP_PRIVATE_KEY)");
  }

  const now = Math.floor(Date.now() / 1000);
  const header = Buffer.from(JSON.stringify({ alg: "RS256", typ: "JWT" })).toString("base64url");
  const payload = Buffer.from(
    JSON.stringify({ iat: now - 60, exp: now + 600, iss: GITHUB_APP_ID })
  ).toString("base64url");

  const crypto = await import("crypto");
  const sign = crypto.createSign("RSA-SHA256");
  sign.update(`${header}.${payload}`);
  const signature = sign.sign(GITHUB_APP_PRIVATE_KEY, "base64url");

  return `${header}.${payload}.${signature}`;
}

/**
 * Get an installation access token from GitHub.
 */
export async function getInstallationToken(installationId: number): Promise<string> {
  const jwt = await generateAppJwt();
  const res = await fetch(
    `https://api.github.com/app/installations/${installationId}/access_tokens`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${jwt}`,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
      },
    }
  );

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to get installation token: ${res.status} ${text}`);
  }

  const data = await res.json();
  return data.token;
}

export interface GitHubRepo {
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

/**
 * List repositories accessible to a GitHub App installation.
 */
export async function listInstallationRepos(installationId: number): Promise<GitHubRepo[]> {
  const token = await getInstallationToken(installationId);
  const repos: GitHubRepo[] = [];
  let page = 1;

  while (true) {
    const res = await fetch(
      `https://api.github.com/installation/repositories?per_page=100&page=${page}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/vnd.github+json",
          "X-GitHub-Api-Version": "2022-11-28",
        },
      }
    );

    if (!res.ok) break;

    const data = await res.json();
    repos.push(...data.repositories);

    if (data.repositories.length < 100) break;
    page++;
  }

  return repos;
}
