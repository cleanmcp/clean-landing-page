/**
 * CSRF protection for the GitHub App installation flow.
 *
 * Uses the double-submit cookie pattern:
 *   1. GET /api/github/install sets an HTTP-only cookie and returns the
 *      install URL with a `?state=<nonce>` query parameter.
 *   2. After installation, GitHub redirects to our callback with the same
 *      `state` in the query string.
 *   3. The callback verifies the URL nonce matches the cookie AND that the
 *      cookie is bound to the current authenticated user/org.
 *
 * This prevents an attacker from crafting a callback URL that binds their
 * GitHub installation to a victim's org (CSRF).
 */

import crypto from "crypto";

const SECRET = process.env.GITHUB_APP_PRIVATE_KEY || "";

function hmac(data: string): string {
  return crypto.createHmac("sha256", SECRET).update(data).digest("hex");
}

/**
 * Cookie format: `nonce:userId:orgId:timestamp:hmacSignature`
 * URL state:     `nonce` (only the random part travels through GitHub)
 */

export const INSTALL_STATE_COOKIE = "gh_install_state";

export function createInstallState(userId: string, orgId: string): {
  nonce: string;
  cookie: string;
} {
  const nonce = crypto.randomBytes(16).toString("hex");
  const ts = Date.now().toString();
  const payload = `${nonce}:${userId}:${orgId}:${ts}`;
  const sig = hmac(payload);
  return { nonce, cookie: `${payload}:${sig}` };
}

/**
 * Verify the cookie alone (for the POST fallback where we don't have
 * the nonce from the URL).
 */
export function verifyInstallCookie(
  cookie: string,
  userId: string,
  orgId: string,
  maxAgeMs = 30 * 60 * 1000,
): boolean {
  if (!cookie) return false;
  const parts = cookie.split(":");
  if (parts.length !== 5) return false;

  const [, cookieUserId, cookieOrgId, ts, sig] = parts;
  if (cookieUserId !== userId || cookieOrgId !== orgId) return false;

  const timestamp = parseInt(ts, 10);
  if (isNaN(timestamp) || Date.now() - timestamp > maxAgeMs) return false;

  const payload = parts.slice(0, 4).join(":");
  const expected = hmac(payload);
  try {
    return crypto.timingSafeEqual(
      Buffer.from(sig, "hex"),
      Buffer.from(expected, "hex"),
    );
  } catch {
    return false;
  }
}

/**
 * Verify both the URL nonce AND the cookie (for the callback where GitHub
 * passes the state back in the query string).
 */
export function verifyInstallState(
  nonce: string,
  cookie: string,
  userId: string,
  orgId: string,
  maxAgeMs = 30 * 60 * 1000,
): boolean {
  if (!nonce || !cookie) return false;
  const parts = cookie.split(":");
  if (parts.length !== 5) return false;

  // The nonce from the URL must match the nonce baked into the cookie
  if (parts[0] !== nonce) return false;

  return verifyInstallCookie(cookie, userId, orgId, maxAgeMs);
}
