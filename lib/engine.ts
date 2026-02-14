import { db } from "@/lib/db";
import { tunnels } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

/**
 * Get the Clean Engine base URL for an organization.
 *
 * Looks up the org's Cloudflare tunnel hostname from the tunnels table,
 * then constructs the engine URL. This is a temporary solution until
 * the gateway is built.
 *
 * Falls back to CLEAN_SERVER_URL env var if no tunnel is found.
 */
interface EngineInfo {
  url: string;
  apiKey: string;
}

export async function getEngineInfo(orgId: string): Promise<EngineInfo | null> {
  // Try tunnel first
  const tunnel = await db
    .select({ hostname: tunnels.hostname, engineApiKey: tunnels.engineApiKey })
    .from(tunnels)
    .where(eq(tunnels.orgId, orgId))
    .limit(1);

  if (tunnel.length > 0 && tunnel[0].hostname) {
    return {
      url: `https://${tunnel[0].hostname}`,
      apiKey: tunnel[0].engineApiKey || process.env.CLEAN_API_KEY || "",
    };
  }

  // Fallback to env var
  const fallbackUrl = process.env.CLEAN_SERVER_URL || null;
  if (!fallbackUrl) return null;
  return { url: fallbackUrl, apiKey: process.env.CLEAN_API_KEY || "" };
}

/**
 * Make a request to the Clean Engine for an organization.
 */
export async function engineFetch(
  orgId: string,
  path: string,
  options: RequestInit = {}
): Promise<Response> {
  const engine = await getEngineInfo(orgId);
  if (!engine) {
    throw new Error("No engine URL configured for this organization");
  }

  const url = `${engine.url}${path}`;

  return fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${engine.apiKey}`,
      "X-Org-Id": orgId,
      ...options.headers,
    },
  });
}
