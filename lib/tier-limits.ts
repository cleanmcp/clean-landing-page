/**
 * Legacy self-hosted tier limits — all unlimited.
 * Only used for enterprise / self-hosted orgs.
 */
export const SELF_HOSTED_TIER_LIMITS = {
  free: { repos: Infinity, apiKeys: Infinity, members: Infinity, initialCredits: Infinity, storageMb: Infinity },
  pro: { repos: Infinity, apiKeys: Infinity, members: Infinity, initialCredits: Infinity, storageMb: Infinity },
  enterprise: { repos: Infinity, apiKeys: Infinity, members: Infinity, initialCredits: Infinity, storageMb: Infinity },
} as const;

/** @deprecated Use SELF_HOSTED_TIER_LIMITS for enterprise orgs, or CLOUD_TIER_LIMITS for cloud orgs. */
export const TIER_LIMITS = SELF_HOSTED_TIER_LIMITS;

export const CLOUD_TIER_LIMITS = {
  free: { repos: 3, apiKeys: 5, members: 1, initialCredits: 1000, storageMb: 100 },
  pro: { repos: 15, apiKeys: 20, members: 5, initialCredits: 10000, storageMb: 500 },
  team: { repos: Infinity, apiKeys: Infinity, members: 15, initialCredits: 50000, storageMb: 1000 },
  enterprise: { repos: Infinity, apiKeys: Infinity, members: Infinity, initialCredits: Infinity, storageMb: Infinity },
} as const;

export const CREDITS_PER_SEARCH = 20;

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

/** Return cloud tier limits with Infinity replaced by 0 for JSON serialization. */
export function getCloudTierLimitsForSync(tier: string) {
  const limits = getCloudTierLimits(tier);
  return {
    maxRepos: limits.repos === Infinity ? 0 : limits.repos,
    storageMb: limits.storageMb === Infinity ? 0 : limits.storageMb,
  };
}
