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
export async function getEngineUrl(orgId: string): Promise<string | null> {
  // Try tunnel first
  const tunnel = await db
    .select({ hostname: tunnels.hostname })
    .from(tunnels)
    .where(eq(tunnels.orgId, orgId))
    .limit(1);

  if (tunnel.length > 0 && tunnel[0].hostname) {
    return `https://${tunnel[0].hostname}`;
  }

  // Fallback to env var
  return process.env.CLEAN_SERVER_URL || null;
}

/**
 * Make a request to the Clean Engine for an organization.
 */
export async function engineFetch(
  orgId: string,
  path: string,
  options: RequestInit = {}
): Promise<Response> {
  const baseUrl = await getEngineUrl(orgId);
  if (!baseUrl) {
    throw new Error("No engine URL configured for this organization");
  }

  const apiKey = process.env.CLEAN_API_KEY || "";
  const url = `${baseUrl}${path}`;

  return fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "X-Org-Id": orgId,
      ...options.headers,
    },
  });
}
