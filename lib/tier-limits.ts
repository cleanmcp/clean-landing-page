/**
 * Legacy self-hosted tier limits — all unlimited.
 * Only used for enterprise / self-hosted orgs.
 */
export const SELF_HOSTED_TIER_LIMITS = {
  free: { repos: Infinity, apiKeys: Infinity, members: Infinity, searchesPerMonth: Infinity, storageMb: Infinity },
  pro: { repos: Infinity, apiKeys: Infinity, members: Infinity, searchesPerMonth: Infinity, storageMb: Infinity },
  enterprise: { repos: Infinity, apiKeys: Infinity, members: Infinity, searchesPerMonth: Infinity, storageMb: Infinity },
} as const;

/** @deprecated Use SELF_HOSTED_TIER_LIMITS for enterprise orgs, or CLOUD_TIER_LIMITS for cloud orgs. */
export const TIER_LIMITS = SELF_HOSTED_TIER_LIMITS;

export const CLOUD_TIER_LIMITS = {
  free: { repos: 2, apiKeys: 5, members: 1, searchesPerMonth: 10, storageMb: 100 },
  pro: { repos: 15, apiKeys: 20, members: 5, searchesPerMonth: 500, storageMb: 500 },
  max: { repos: Infinity, apiKeys: Infinity, members: 10, searchesPerMonth: 5000, storageMb: 1000 },
  enterprise: { repos: Infinity, apiKeys: Infinity, members: Infinity, searchesPerMonth: Infinity, storageMb: Infinity },
} as const;

export type CloudTier = keyof typeof CLOUD_TIER_LIMITS;

export function getCloudTierLimits(tier: string) {
  return CLOUD_TIER_LIMITS[tier as CloudTier] ?? CLOUD_TIER_LIMITS.free;
}

export type SelfHostedTier = keyof typeof SELF_HOSTED_TIER_LIMITS;

/** @deprecated Prefer getCloudTierLimits for cloud orgs. */
export function getTierLimits(tier: string) {
  return SELF_HOSTED_TIER_LIMITS[tier as SelfHostedTier] ?? SELF_HOSTED_TIER_LIMITS.free;
}

/** Alias kept for backwards compatibility — same as getCloudTierLimits. */
export type Tier = SelfHostedTier;

/**
 * Full per-tier credit configuration. Engine charges `creditsPerSearch` credits
 * per request and allows up to `overageCap` extra usage past the grant.
 * -1 = unlimited (engine convention).
 */
export type CreditConfig = {
  grantMonthly: number;
  creditsPerSearch: number;
  rolloverCap: number;
  overageCap: number;
};

export const CREDIT_CONFIGS: Record<string, CreditConfig> = {
  free: { grantMonthly: 200, creditsPerSearch: 20, rolloverCap: 0, overageCap: 0 },
  pro: { grantMonthly: 10_000, creditsPerSearch: 20, rolloverCap: 5_000, overageCap: 5_000 },
  max: { grantMonthly: 100_000, creditsPerSearch: 20, rolloverCap: 50_000, overageCap: 50_000 },
  enterprise: { grantMonthly: -1, creditsPerSearch: 0, rolloverCap: -1, overageCap: -1 },
};

export function getCreditConfig(tier: string): CreditConfig {
  return CREDIT_CONFIGS[tier] ?? CREDIT_CONFIGS.free;
}

/** @deprecated Use getCreditConfig(tier).grantMonthly. Kept for backwards compatibility. */
export function getCreditGrant(tier: string): number {
  return getCreditConfig(tier).grantMonthly;
}

/** Return cloud tier limits with Infinity replaced by -1 for JSON serialization (-1 = unlimited). */
export function getCloudTierLimitsForSync(tier: string) {
  const limits = getCloudTierLimits(tier);
  return {
    searchesPerMonth: limits.searchesPerMonth === Infinity ? -1 : limits.searchesPerMonth,
    maxRepos: limits.repos === Infinity ? -1 : limits.repos,
    storageMb: limits.storageMb === Infinity ? -1 : limits.storageMb,
  };
}
