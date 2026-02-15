/**
 * Org token generation and hashing.
 *
 * Format: clean_tk_ + 64 hex chars (32 bytes entropy)
 * Storage: SHA-256 hash (tokens are high-entropy, fast hash is fine)
 */

import { randomBytes, createHash } from "node:crypto";

const TOKEN_PREFIX = "clean_tk_";

export interface GeneratedOrgToken {
  /** The full token to show to user ONCE */
  plainToken: string;
  /** SHA-256 hex hash for storage */
  tokenHash: string;
}

/**
 * Generate a new org token with a secure random value.
 */
export function generateOrgToken(): GeneratedOrgToken {
  const randomPart = randomBytes(32).toString("hex");
  const plainToken = `${TOKEN_PREFIX}${randomPart}`;
  const tokenHash = hashOrgToken(plainToken);
  return { plainToken, tokenHash };
}

/**
 * SHA-256 hash a plain org token for DB lookup/storage.
 */
export function hashOrgToken(plain: string): string {
  return createHash("sha256").update(plain).digest("hex");
}
