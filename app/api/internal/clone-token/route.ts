import crypto from "crypto";
import { db } from "@/lib/db";
import { githubInstallations } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { getInstallationToken } from "@/lib/github-app";

const GATEWAY_INTERNAL_SECRET = process.env.GATEWAY_INTERNAL_SECRET || "";

/**
 * Verify the Authorization header matches GATEWAY_INTERNAL_SECRET using
 * a timing-safe comparison to prevent timing attacks.
 */
function verifyInternalAuth(req: Request): boolean {
  if (!GATEWAY_INTERNAL_SECRET) return false;

  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) return false;

  const provided = authHeader.slice("Bearer ".length);

  // timingSafeEqual requires buffers of identical length
  if (provided.length !== GATEWAY_INTERNAL_SECRET.length) return false;

  return crypto.timingSafeEqual(
    Buffer.from(provided),
    Buffer.from(GATEWAY_INTERNAL_SECRET)
  );
}

/**
 * POST /api/internal/clone-token
 *
 * Called by the gateway to resolve a GitHub installation access token for
 * cloning private repos. Requires GATEWAY_INTERNAL_SECRET in the
 * Authorization header.
 *
 * Body: { org_id: string, repo: string }
 * Response: { token: string }
 */
export async function POST(req: Request) {
  if (!verifyInternalAuth(req)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { org_id?: string; repo?: string };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { org_id: orgId, repo } = body;

  if (!orgId || !repo) {
    return Response.json(
      { error: "org_id and repo are required" },
      { status: 400 }
    );
  }

  // Look up active GitHub installation for this org
  const [installation] = await db
    .select({ installationId: githubInstallations.installationId })
    .from(githubInstallations)
    .where(
      and(
        eq(githubInstallations.orgId, orgId),
        eq(githubInstallations.active, true)
      )
    )
    .limit(1);

  if (!installation) {
    return Response.json(
      { error: "No active GitHub installation found for this org" },
      { status: 404 }
    );
  }

  try {
    const token = await getInstallationToken(installation.installationId);
    return Response.json({ token });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[internal/clone-token] Failed to get installation token:", message);
    return Response.json(
      { error: "Failed to generate GitHub installation token" },
      { status: 500 }
    );
  }
}
