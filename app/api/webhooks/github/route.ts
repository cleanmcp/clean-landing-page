import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { githubInstallations } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { verifyWebhookSignature } from "@/lib/github-app";

/**
 * POST /api/webhooks/github — Handle GitHub App webhook events.
 *
 * Handles:
 * - installation.deleted → mark installation as inactive
 * - installation.suspend → mark installation as inactive
 * - installation.unsuspend → mark installation as active
 *
 * installation.created is NOT handled here because we don't know
 * which Clean org it belongs to. That mapping happens in the
 * /api/github/callback redirect handler.
 */
export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get("x-hub-signature-256") || "";
  const event = request.headers.get("x-github-event") || "";

  // Verify webhook signature
  if (!verifyWebhookSignature(body, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let payload: Record<string, unknown>;
  try {
    payload = JSON.parse(body);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (event === "installation") {
    const action = payload.action as string | undefined;
    const installation = payload.installation as Record<string, unknown> | undefined;
    const installationId = installation?.id as number | undefined;

    if (!installationId) {
      return NextResponse.json({ ok: true });
    }

    if (action === "deleted" || action === "suspend") {
      // Mark all matching installations as inactive
      await db
        .update(githubInstallations)
        .set({ active: false, updatedAt: new Date() })
        .where(eq(githubInstallations.installationId, installationId));
    }

    if (action === "unsuspend") {
      await db
        .update(githubInstallations)
        .set({ active: true, updatedAt: new Date() })
        .where(eq(githubInstallations.installationId, installationId));
    }
  }

  // Acknowledge all events (GitHub retries on non-2xx)
  return NextResponse.json({ ok: true });
}
