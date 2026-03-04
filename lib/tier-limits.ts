export const TIER_LIMITS = {
  free: { repos: Infinity, apiKeys: Infinity, members: Infinity },
  pro: { repos: Infinity, apiKeys: Infinity, members: Infinity },
  enterprise: { repos: Infinity, apiKeys: Infinity, members: Infinity },
} as const;

export type Tier = keyof typeof TIER_LIMITS;

export function getTierLimits(tier: string) {
  return TIER_LIMITS[tier as Tier] ?? TIER_LIMITS.free;
}
