import { db } from "@/lib/db";
import { organizations } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

const GATEWAY_URL = process.env.GATEWAY_URL || "https://api.tryclean.ai";
const GATEWAY_SECRET = process.env.GATEWAY_INTERNAL_SECRET || "";
const CLEAN_API_KEY = process.env.CLEAN_API_KEY || "";

/**
 * Engine status from the gateway.
 */
interface EngineStatus {
  connected: boolean;
  orgSlug?: string;
  connectedAt?: string;
  lastHeartbeat?: {
    uptime: number;
    repos: number;
    searches_total: number;
  } | null;
}

/**
 * Get engine connection info via the gateway.
 * Returns the engine URL via api.tryclean.ai,
 * or null if no engine is connected.
 */
export async function getEngineInfo(
  orgId: string
): Promise<{ url: string } | null> {
  if (!GATEWAY_SECRET) return null;

  try {
    const status = await getEngineStatus(orgId);
    if (!status.connected || !status.orgSlug) return null;

    return { url: `https://api.tryclean.ai` };
  } catch {
    return null;
  }
}

/**
 * Get detailed engine status from the gateway.
 */
export async function getEngineStatus(orgId: string): Promise<EngineStatus> {
  if (!GATEWAY_SECRET) {
    return { connected: false };
  }

  try {
    const res = await fetch(`${GATEWAY_URL}/internal/status/${orgId}`, {
      headers: {
        Authorization: `Bearer ${GATEWAY_SECRET}`,
      },
    });

    if (!res.ok) {
      return { connected: false };
    }

    return await res.json();
  } catch {
    return { connected: false };
  }
}

/**
 * Make a request to the Clean Engine for an organization.
 * Routes through the gateway using X-Clean-Slug header.
 * This works in both local dev (GATEWAY_URL=http://localhost:4000)
 * and production (GATEWAY_URL=https://api.tryclean.ai).
 */
export async function engineFetch(
  orgId: string,
  path: string,
  options: RequestInit = {}
): Promise<Response> {
  // Look up org slug for routing
  const [org] = await db
    .select({ slug: organizations.slug })
    .from(organizations)
    .where(eq(organizations.id, orgId))
    .limit(1);

  if (!org) {
    throw new Error("Organization not found");
  }

  const url = `${GATEWAY_URL}${path}`;

  return fetch(url, {
    ...options,
    headers: {
      "X-Clean-Slug": org.slug,
      "X-Org-Id": orgId,
      ...(CLEAN_API_KEY ? { Authorization: `Bearer ${CLEAN_API_KEY}` } : {}),
      ...options.headers,
    },
  });
}
