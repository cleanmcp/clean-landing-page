import "server-only";

/**
 * Agent-product tier catalog. Independent from `lib/tier-limits.ts`, which
 * governs the cloud/search product. The two share a Stripe account but nothing
 * else — prices, allowances, and webhook handling are separate.
 *
 * Billable-token math mirrors Anthropic's pricing multipliers:
 *   billable = input + output + 0.1 * cacheRead + 1.25 * cacheCreation
 * so a "token" here is already normalized to cost impact.
 */

export type AgentTierKey = "starter" | "pro" | "enterprise";

export type AgentTier = {
  key: AgentTierKey;
  label: string;
  priceUsd: number | null; // null = "Contact sales"
  tokensPerMonth: number; // -1 = unlimited
  priceIdEnv: string | null;
  features: string[];
};

export const AGENT_TIERS: Record<AgentTierKey, AgentTier> = {
  starter: {
    key: "starter",
    label: "Starter",
    priceUsd: 15,
    tokensPerMonth: 1_500_000,
    priceIdEnv: "NEXT_PUBLIC_STRIPE_AGENT_STARTER_PRICE_ID",
    features: [
      "1.5M billable tokens / month",
      "All Clean Agent features",
      "Single user",
      "Bring your own model keys (unmetered)",
    ],
  },
  pro: {
    key: "pro",
    label: "Pro",
    priceUsd: 50,
    tokensPerMonth: 7_000_000,
    priceIdEnv: "NEXT_PUBLIC_STRIPE_AGENT_PRO_PRICE_ID",
    features: [
      "7M billable tokens / month",
      "Priority model access",
      "Larger context windows",
      "Bring your own model keys (unmetered)",
    ],
  },
  enterprise: {
    key: "enterprise",
    label: "Enterprise",
    priceUsd: null,
    tokensPerMonth: -1,
    priceIdEnv: null,
    features: [
      "Custom monthly allowance",
      "SSO / SAML",
      "Invoicing + net-30",
      "Dedicated support",
    ],
  },
};

/** Resolve a Stripe price ID to its agent tier, or null if not an agent price. */
export function getAgentTierForPriceId(priceId: string): AgentTier | null {
  for (const tier of Object.values(AGENT_TIERS)) {
    if (!tier.priceIdEnv) continue;
    const envValue = process.env[tier.priceIdEnv];
    if (envValue && envValue === priceId) return tier;
  }
  return null;
}

/** For webhook handlers — returns info needed to populate the subscriptions row. */
export function getAgentSubPlanFromPriceId(priceId: string): {
  product: "agent";
  tierKey: AgentTierKey;
  tokensLimit: number;
  plan: "pro" | "max" | "enterprise"; // maps to the legacy `plan` column for compat
} | null {
  const tier = getAgentTierForPriceId(priceId);
  if (!tier) return null;
  // The `plan` column on subscriptions is NOT NULL and typed to the cloud enum.
  // We reuse the closest legacy value so the insert succeeds; authoritative
  // agent tier lives in `tier_key`.
  const legacyPlan =
    tier.key === "starter" ? "pro" : tier.key === "pro" ? "max" : "enterprise";
  return {
    product: "agent",
    tierKey: tier.key,
    tokensLimit: tier.tokensPerMonth,
    plan: legacyPlan,
  };
}
