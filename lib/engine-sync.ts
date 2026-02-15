interface KeySyncData {
  id: string;
  orgId?: string | null;
  keyPrefix?: string;
  keyHash?: string;
  scopes?: string[];
  name?: string;
  expiresAt?: string | null;
}

const GATEWAY_URL = process.env.GATEWAY_URL || "https://api.tryclean.ai";
const GATEWAY_SECRET = process.env.GATEWAY_INTERNAL_SECRET || "";

/**
 * Push an API key create or revoke event to the engine via the gateway.
 *
 * Fire-and-forget: logs errors but never throws, so the dashboard
 * request succeeds even if the engine is offline.
 */
export async function syncKeyToEngine(
  orgId: string,
  action: "create" | "revoke",
  keyData: KeySyncData
): Promise<void> {
  if (!GATEWAY_SECRET) {
    console.warn("GATEWAY_INTERNAL_SECRET not set — skipping key sync");
    return;
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
    }
  } catch (error) {
    console.error(`Failed to sync key ${action} to engine:`, error);
  }
}
