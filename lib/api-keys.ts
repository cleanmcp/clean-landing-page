import { randomBytes, createHash } from "crypto";
import bcrypt from "bcryptjs";

// API Key format: clean_sk_{env}_{random32}
// Example: clean_sk_prod_a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6

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

  // Hash the full key for storage
  const keyHash = await bcrypt.hash(plainKey, SALT_ROUNDS);

  return {
    plainKey,
    keyPrefix,
    keyHash,
  };
}

/**
 * Verify an API key against a stored hash
 */
export async function verifyApiKey(
  plainKey: string,
  keyHash: string
): Promise<boolean> {
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

/**
 * Hash a key for quick lookup (not for security, just for indexing)
 * Use SHA256 for fast lookup, bcrypt for verification
 */
export function quickHash(plainKey: string): string {
  return createHash("sha256").update(plainKey).digest("hex");
}
