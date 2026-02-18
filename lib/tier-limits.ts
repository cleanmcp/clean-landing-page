export const TIER_LIMITS = {
  free: { repos: 3, apiKeys: 2, members: 1 },
  pro: { repos: 25, apiKeys: 20, members: 10 },
  enterprise: { repos: Infinity, apiKeys: Infinity, members: Infinity },
} as const;

export type Tier = keyof typeof TIER_LIMITS;

export function getTierLimits(tier: string) {
  return TIER_LIMITS[tier as Tier] ?? TIER_LIMITS.free;
}
