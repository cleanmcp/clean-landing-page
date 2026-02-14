import jwt from "jsonwebtoken";

/**
 * Tier limits — mirrors the plan table.
 * 0 = unlimited (represented as 999_999 in the JWT).
 */
const TIER_LIMITS: Record<string, { max_repos: number; max_users: number }> = {
  free: { max_repos: 3, max_users: 1 },
  pro: { max_repos: 25, max_users: 10 },
  enterprise: { max_repos: 999_999, max_users: 999_999 },
};

export interface LicenseClaims {
  sub: string;
  tier: string;
  max_repos: number;
  max_users: number;
  iat: number;
  exp: number;
}

/**
 * Generate a signed ES256 license JWT.
 *
 * Requires CLEAN_LICENSE_PRIVATE_KEY env var (PEM-encoded EC private key).
 * Newlines in the env var can be literal `\n` — they'll be normalised.
 */
export function generateLicenseKey(params: {
  customerId: string;
  tier?: string;
  months?: number;
}): string {
  const raw = process.env.CLEAN_LICENSE_PRIVATE_KEY;
  if (!raw) {
    throw new Error("CLEAN_LICENSE_PRIVATE_KEY is not set");
  }

  // Env vars often store PEM with literal \n — restore real newlines
  const privateKey = raw.replace(/\\n/g, "\n");

  const tier = params.tier ?? "free";
  const limits = TIER_LIMITS[tier];
  if (!limits) {
    throw new Error(`Unknown tier: ${tier}`);
  }

  const months = params.months ?? 12;

  const payload: Omit<LicenseClaims, "iat" | "exp"> = {
    sub: params.customerId,
    tier,
    max_repos: limits.max_repos,
    max_users: limits.max_users,
  };

  return jwt.sign(payload, privateKey, {
    algorithm: "ES256",
    expiresIn: `${months * 30}d`,
  });
}

/**
 * Verify a license JWT and return its claims.
 *
 * Uses the ES256 private key (which contains the public key) for verification.
 * Throws if the signature is invalid or the token is expired.
 */
export function verifyLicenseKey(token: string): LicenseClaims {
  const raw = process.env.CLEAN_LICENSE_PRIVATE_KEY;
  if (!raw) throw new Error("CLEAN_LICENSE_PRIVATE_KEY is not set");
  const privateKey = raw.replace(/\\n/g, "\n");

  return jwt.verify(token, privateKey, {
    algorithms: ["ES256"],
  }) as LicenseClaims;
}
