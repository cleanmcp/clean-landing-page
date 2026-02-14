import { getEngineInfo } from "@/lib/engine";

interface KeySyncData {
  id: string;
  orgId?: string | null;
  keyPrefix?: string;
  keyHash?: string;
  scopes?: string[];
  name?: string;
  expiresAt?: string | null;
}

/**
 * Push an API key create or revoke event to the self-hosted engine.
 *
 * Fire-and-forget: logs errors but never throws, so the dashboard
 * request succeeds even if the engine is offline.
 */
export async function syncKeyToEngine(
  orgId: string,
  action: "create" | "revoke",
  keyData: KeySyncData
): Promise<void> {
  try {
    const engine = await getEngineInfo(orgId);
    if (!engine) {
      return; // No engine configured for this org
    }

    if (action === "create") {
      await fetch(`${engine.url}/admin/keys`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${engine.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(keyData),
      });
    } else if (action === "revoke") {
      await fetch(`${engine.url}/admin/keys/${keyData.id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${engine.apiKey}`,
        },
      });
    }
  } catch (error) {
    console.error(`Failed to sync key ${action} to engine:`, error);
  }
}
