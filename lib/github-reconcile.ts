/**
 * GitHub installation reconciliation — auto-heals stale installation IDs.
 *
 * When listInstallationRepos() fails with 404, this module finds the current
 * installation ID for the account from GitHub's API and updates the DB.
 */

import { db } from "@/lib/db";
import { githubInstallations } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";

// ---------------------------------------------------------------------------
// Cached list of all GitHub App installations (60s TTL)
// ---------------------------------------------------------------------------

interface GitHubInstallation {
  id: number;
  account: { login: string; type: string; avatar_url: string };
}

let _cachedInstallations: GitHubInstallation[] | null = null;
let _cacheTimestamp = 0;
const CACHE_TTL_MS = 60_000;

const GITHUB_APP_ID = process.env.GITHUB_APP_ID || "";
const GITHUB_APP_PRIVATE_KEY = (
  process.env.GITHUB_APP_PRIVATE_KEY || ""
).replace(/\\n/g, "\n");

async function generateAppJwt(): Promise<string> {
  const crypto = await import("crypto");
  const header = Buffer.from(
    JSON.stringify({ alg: "RS256", typ: "JWT" })
  ).toString("base64url");
  const now = Math.floor(Date.now() / 1000);
  const payload = Buffer.from(
    JSON.stringify({ iat: now - 60, exp: now + 600, iss: GITHUB_APP_ID })
  ).toString("base64url");
  const sig = crypto
    .sign("RSA-SHA256", Buffer.from(`${header}.${payload}`), GITHUB_APP_PRIVATE_KEY)
    .toString("base64url");
  return `${header}.${payload}.${sig}`;
}

/**
 * Fetch ALL installations of this GitHub App (cached 60s).
 */
export async function getAllAppInstallations(): Promise<GitHubInstallation[]> {
  const now = Date.now();
  if (_cachedInstallations && now - _cacheTimestamp < CACHE_TTL_MS) {
    return _cachedInstallations;
  }

  const jwt = await generateAppJwt();
  const res = await fetch("https://api.github.com/app/installations?per_page=100", {
    headers: {
      Authorization: `Bearer ${jwt}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
    },
    signal: AbortSignal.timeout(10_000),
  });

  if (!res.ok) {
    console.error(`[reconcile] Failed to list app installations: ${res.status}`);
    return _cachedInstallations ?? [];
  }

  const data = await res.json();
  _cachedInstallations = data as GitHubInstallation[];
  _cacheTimestamp = now;
  return _cachedInstallations;
}

// ---------------------------------------------------------------------------
// Reconcile a single installation
// ---------------------------------------------------------------------------

export interface ReconcileResult {
  healed: boolean;
  newInstallationId?: number;
  error?: string;
}

/**
 * Try to find the current GitHub installation for an account and update the DB.
 *
 * Returns { healed: true, newInstallationId } if fixed,
 * or { healed: false, error } if the account is no longer installed.
 */
export async function reconcileInstallation(
  accountLogin: string,
  orgId: string,
  dbRowId: string,
): Promise<ReconcileResult> {
  const installations = await getAllAppInstallations();
  const match = installations.find(
    (i) => i.account.login.toLowerCase() === accountLogin.toLowerCase()
  );

  if (!match) {
    // Account no longer has the GitHub App installed — mark inactive
    await db
      .update(githubInstallations)
      .set({ active: false, updatedAt: new Date() })
      .where(eq(githubInstallations.id, dbRowId));

    return {
      healed: false,
      error: `${accountLogin} no longer has the Clean GitHub App installed`,
    };
  }

  // Found the current installation — update the DB row
  await db
    .update(githubInstallations)
    .set({
      installationId: match.id,
      accountLogin: match.account.login,
      accountType: match.account.type,
      accountAvatarUrl: match.account.avatar_url,
      active: true,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(githubInstallations.id, dbRowId),
        eq(githubInstallations.orgId, orgId),
      )
    );

  return { healed: true, newInstallationId: match.id };
}
