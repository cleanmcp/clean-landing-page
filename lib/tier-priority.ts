export const TIER_PRIORITY: Record<string, number> = {
  free: 10,
  pro: 20,
  max: 30,
  enterprise: 40,
};

export function getTierPriority(tier: string): number {
  return TIER_PRIORITY[tier] ?? 10;
}
