import { randomBytes, createHash } from "crypto";
import bcrypt from "bcryptjs";

// API Key format: clean_sk_{env}_{random32hex} = 78 characters total.
// bcrypt truncates input at 72 bytes, so the last 6 chars were silently ignored.
// Fix: SHA-256 pre-hash the key (producing 64 hex chars) before bcrypt.
//
// Migration: keys created before this change store bcrypt(plainKey) hashes.
// Keys created after store bcrypt(sha256(plainKey)) hashes. The verifyApiKey()
// function tries the new scheme first, then falls back to legacy raw bcrypt
// so both old and new keys verify correctly.

const KEY_PREFIX = "clean_sk";
const SALT_ROUNDS = 12;

export interface GeneratedKey {
  /** The full key to show to user ONCE */
  plainKey: string;
  /** The prefix for display (clean_sk_prod_abc123) */
  keyPrefix: string;
  /** The hash to store in database */
  keyHash: string;
}

/**
 * Generate a new API key
 * Returns the plain key (show once), prefix (for display), and hash (for storage)
 */
export async function generateApiKey(
  env: "prod" | "dev" = "prod"
): Promise<GeneratedKey> {
  // Generate 32 random bytes -> 64 hex chars
  const randomPart = randomBytes(32).toString("hex");

  // Full key: clean_sk_prod_a1b2c3...
  const plainKey = `${KEY_PREFIX}_${env}_${randomPart}`;

  // Prefix for display: clean_sk_prod_a1b2c3d4 (first 8 chars of random)
  const keyPrefix = `${KEY_PREFIX}_${env}_${randomPart.slice(0, 8)}`;

  // SHA-256 pre-hash to avoid bcrypt 72-byte truncation, then bcrypt the digest
  const sha256 = createHash("sha256").update(plainKey).digest("hex");
  const keyHash = await bcrypt.hash(sha256, SALT_ROUNDS);

  return {
    plainKey,
    keyPrefix,
    keyHash,
  };
}

/**
 * Verify an API key against a stored hash.
 * Tries SHA-256 pre-hash scheme first (new keys), then falls back to
 * legacy raw bcrypt for keys created before the pre-hash fix.
 */
export async function verifyApiKey(
  plainKey: string,
  keyHash: string
): Promise<boolean> {
  // New scheme: SHA-256 pre-hash + bcrypt
  const sha256 = createHash("sha256").update(plainKey).digest("hex");
  if (await bcrypt.compare(sha256, keyHash)) return true;

  // Legacy fallback: raw bcrypt (truncated at 72 bytes)
  return bcrypt.compare(plainKey, keyHash);
}

/**
 * Extract the prefix from a plain key (for lookup)
 */
export function extractKeyPrefix(plainKey: string): string | null {
  // Expected format: clean_sk_{env}_{random64}
  const match = plainKey.match(/^(clean_sk_(?:prod|dev)_[a-f0-9]{8})/);
  return match ? match[1] : null;
}

/**
 * Validate API key format
 */
export function isValidKeyFormat(key: string): boolean {
  return /^clean_sk_(prod|dev)_[a-f0-9]{64}$/.test(key);
}

