export const TIER_LIMITS = {
  free: { repos: Infinity, apiKeys: Infinity, members: Infinity, searchesPerDay: Infinity, storageMb: Infinity },
  pro: { repos: Infinity, apiKeys: Infinity, members: Infinity, searchesPerDay: Infinity, storageMb: Infinity },
  enterprise: { repos: Infinity, apiKeys: Infinity, members: Infinity, searchesPerDay: Infinity, storageMb: Infinity },
} as const;

export const CLOUD_TIER_LIMITS = {
  free: { repos: 3, apiKeys: 5, members: 1, searchesPerDay: 50, storageMb: 100 },
  pro: { repos: 15, apiKeys: 20, members: 5, searchesPerDay: Infinity, storageMb: 500 },
  max: { repos: Infinity, apiKeys: Infinity, members: 25, searchesPerDay: Infinity, storageMb: 1000 },
  enterprise: { repos: Infinity, apiKeys: Infinity, members: Infinity, searchesPerDay: Infinity, storageMb: Infinity },
} as const;

export type CloudTier = keyof typeof CLOUD_TIER_LIMITS;

export function getCloudTierLimits(tier: string) {
  return CLOUD_TIER_LIMITS[tier as CloudTier] ?? CLOUD_TIER_LIMITS.free;
}

export type Tier = keyof typeof TIER_LIMITS;

export function getTierLimits(tier: string) {
  return TIER_LIMITS[tier as Tier] ?? TIER_LIMITS.free;
}

/** Return cloud tier limits with Infinity replaced by 0 for JSON serialization. */
export function getCloudTierLimitsForSync(tier: string) {
  const limits = getCloudTierLimits(tier);
  return {
    searchesPerDay: limits.searchesPerDay === Infinity ? 0 : limits.searchesPerDay,
    maxRepos: limits.repos === Infinity ? 0 : limits.repos,
    storageMb: limits.storageMb === Infinity ? 0 : limits.storageMb,
  };
}
