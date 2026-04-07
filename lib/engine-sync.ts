interface KeySyncData {
  id: string;
  orgId?: string | null;
  keyPrefix?: string;
  keyHash?: string;
  scopes?: string[];
  name?: string;
  expiresAt?: string | null;
  tier?: string;
  searchesPerMonth?: number;
  maxRepos?: number;
  storageMb?: number;
  creditBalance?: number;
}

import { db } from "@/lib/db";
import { apiKeys, organizations } from "@/lib/db/schema";
import { eq, and, isNull } from "drizzle-orm";
import { getCloudTierLimitsForSync } from "@/lib/tier-limits";

const GATEWAY_URL = process.env.GATEWAY_URL || "https://api.tryclean.ai";
const GATEWAY_SECRET = process.env.GATEWAY_INTERNAL_SECRET || "";

/**
 * Push an API key create or revoke event to the engine via the gateway.
 *
 * Returns a warning string on failure instead of swallowing silently,
 * so callers can surface the issue to the user.
 */
export async function syncKeyToEngine(
  orgId: string,
  action: "create" | "revoke",
  keyData: KeySyncData
): Promise<{ warning?: string }> {
  if (!GATEWAY_SECRET) {
    console.warn("GATEWAY_INTERNAL_SECRET not set — skipping key sync");
    return { warning: "Key sync skipped — gateway secret not configured" };
  }

  try {
    const res = await fetch(`${GATEWAY_URL}/internal/key-sync`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${GATEWAY_SECRET}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        orgId,
        action: action === "create" ? "upsert" : "revoke",
        keyData,
      }),
    });

    if (!res.ok) {
      console.error(`Key sync failed: HTTP ${res.status}`);
      return { warning: "Key created but engine sync failed — key may take up to 5 minutes to activate" };
    }
    return {};
  } catch (error) {
    console.error(`Failed to sync key ${action} to engine:`, error);
    return { warning: "Key created but engine sync failed — key may take up to 5 minutes to activate" };
  }
}

/**
 * Re-sync all active keys for an org so the engine picks up new tier limits.
 * Called after Stripe tier changes.
 */
export async function syncAllKeysForOrg(orgId: string): Promise<void> {
  if (!GATEWAY_SECRET) return;

  const [org] = await db
    .select({ tier: organizations.tier, creditBalance: organizations.creditBalance })
    .from(organizations)
    .where(eq(organizations.id, orgId))
    .limit(1);

  const tier = org?.tier ?? "free";
  const tierLimits = getCloudTierLimitsForSync(tier);
  const creditBalance = org?.creditBalance ?? 0;

  const keys = await db
    .select()
    .from(apiKeys)
    .where(and(eq(apiKeys.orgId, orgId), isNull(apiKeys.revokedAt)));

  for (const key of keys) {
    await syncKeyToEngine(orgId, "create", {
      id: key.id,
      orgId: key.orgId,
      keyPrefix: key.keyPrefix,
      keyHash: key.keyHash,
      scopes: key.scopes,
      name: key.name,
      expiresAt: key.expiresAt?.toISOString() ?? null,
      tier,
      ...tierLimits,
      creditBalance,
    });
  }
}
