/**
 * GitHub App utilities for cloud repo access.
 * Handles installation token generation, repo listing, and webhook verification.
 *
 * This is SEPARATE from Clerk's GitHub OAuth (used for sign-in only).
 * The GitHub App provides org-level repo access that works regardless of
 * how the user authenticated (email, Google, GitHub).
 */

import crypto from "crypto";

const GITHUB_APP_ID = process.env.GITHUB_APP_ID || "";
const GITHUB_APP_PRIVATE_KEY = (process.env.GITHUB_APP_PRIVATE_KEY || "").replace(/\\n/g, "\n");
const GITHUB_APP_SLUG = process.env.NEXT_PUBLIC_GITHUB_APP_SLUG || "clean-code-search";
const GITHUB_WEBHOOK_SECRET = process.env.GITHUB_WEBHOOK_SECRET || "";

// ---------------------------------------------------------------------------
// Install URL
// ---------------------------------------------------------------------------

/**
 * Get the GitHub App installation URL.
 * After installation, GitHub redirects to our Setup URL with installation_id.
 */
export function getGitHubAppInstallUrl(state?: string): string {
  const base = `https://github.com/apps/${GITHUB_APP_SLUG}/installations/new`;
  return state ? `${base}?state=${encodeURIComponent(state)}` : base;
}

// ---------------------------------------------------------------------------
// JWT Generation (for GitHub App API auth)
// ---------------------------------------------------------------------------

/**
 * Generate a short-lived JWT for GitHub App API authentication.
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

  const sign = crypto.createSign("RSA-SHA256");
  sign.update(`${header}.${payload}`);
  const signature = sign.sign(GITHUB_APP_PRIVATE_KEY, "base64url");

  return `${header}.${payload}.${signature}`;
}

// ---------------------------------------------------------------------------
// Installation Tokens
// ---------------------------------------------------------------------------

/**
 * Get a short-lived access token for a GitHub App installation.
 * These tokens last ~1 hour and have the permissions granted during install.
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

/**
 * Get a repo-scoped, read-only installation token.
 * Restricted to a single repository with only `contents: read` permission.
 * If the repo isn't covered by this installation, GitHub returns 422.
 */
export async function getRepoScopedInstallationToken(
  installationId: number,
  repoName: string,
): Promise<string> {
  const jwt = await generateAppJwt();
  const res = await fetch(
    `https://api.github.com/app/installations/${installationId}/access_tokens`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${jwt}`,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        repositories: [repoName],
        permissions: { contents: "read" },
      }),
    }
  );

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to get repo-scoped token: ${res.status} ${text}`);
  }

  const data = await res.json();
  return data.token;
}

// ---------------------------------------------------------------------------
// Installation Info
// ---------------------------------------------------------------------------

interface GitHubInstallationInfo {
  id: number;
  account: {
    login: string;
    avatar_url: string;
    type: string; // "User" or "Organization"
  };
}

/**
 * Fetch installation details from GitHub API.
 * Used after redirect to get account info for the installation.
 */
export async function getInstallationInfo(installationId: number): Promise<GitHubInstallationInfo> {
  const jwt = await generateAppJwt();
  const res = await fetch(
    `https://api.github.com/app/installations/${installationId}`,
    {
      headers: {
        Authorization: `Bearer ${jwt}`,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
      },
    }
  );

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to get installation info: ${res.status} ${text}`);
  }

  return res.json();
}

// ---------------------------------------------------------------------------
// Repo Listing
// ---------------------------------------------------------------------------

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
 * Paginates through all repos the installation has access to.
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

// ---------------------------------------------------------------------------
// Webhook Verification
// ---------------------------------------------------------------------------

/**
 * Verify GitHub webhook signature (HMAC-SHA256).
 * Returns true if the payload matches the signature.
 */
export function verifyWebhookSignature(
  payload: string | Buffer,
  signatureHeader: string
): boolean {
  if (!GITHUB_WEBHOOK_SECRET) {
    console.error("GITHUB_WEBHOOK_SECRET not configured");
    return false;
  }

  if (!signatureHeader?.startsWith("sha256=")) {
    return false;
  }

  const expected = crypto
    .createHmac("sha256", GITHUB_WEBHOOK_SECRET)
    .update(payload)
    .digest("hex");

  const actual = signatureHeader.slice("sha256=".length);

  try {
    const expectedBuf = Buffer.from(expected, "hex");
    const actualBuf = Buffer.from(actual, "hex");
    if (expectedBuf.length !== actualBuf.length) return false;
    return crypto.timingSafeEqual(expectedBuf, actualBuf);
  } catch {
    return false;
  }
}
