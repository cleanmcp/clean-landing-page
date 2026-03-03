import { Webhook } from "svix";
import { headers } from "next/headers";
import { WebhookEvent } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { users, apiKeys, orgMembers, orgTokens } from "@/lib/db/schema";
import { eq, and, isNull, ne } from "drizzle-orm";
import { ensurePersonalOrg } from "@/lib/personal-org";
import { audit } from "@/lib/audit";

export async function POST(req: Request) {
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;

  if (!WEBHOOK_SECRET) {
    throw new Error(
      "Please add CLERK_WEBHOOK_SECRET from Clerk Dashboard to .env.local"
    );
  }

  // Get the headers
  const headerPayload = await headers();
  const svix_id = headerPayload.get("svix-id");
  const svix_timestamp = headerPayload.get("svix-timestamp");
  const svix_signature = headerPayload.get("svix-signature");

  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response("Missing svix headers", { status: 400 });
  }

  // Get the body
  const payload = await req.json();
  const body = JSON.stringify(payload);

  // Verify the webhook
  const wh = new Webhook(WEBHOOK_SECRET);
  let evt: WebhookEvent;

  try {
    evt = wh.verify(body, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    }) as WebhookEvent;
  } catch (err) {
    console.error("Webhook verification failed:", err);
    return new Response("Webhook verification failed", { status: 400 });
  }

  const eventType = evt.type;

  if (eventType === "user.created") {
    const { id, first_name, last_name, email_addresses, image_url } = evt.data;
    const name =
      [first_name, last_name].filter(Boolean).join(" ") ||
      email_addresses?.[0]?.email_address ||
      "Unknown";

    const email = email_addresses?.[0]?.email_address ?? null;

    // Insert user with onboardingStep=2 so users go straight to dashboard.
    await db
      .insert(users)
      .values({
        id,
        name,
        email,
        image: image_url ?? null,
        onboardingStep: 2,
      })
      .onConflictDoNothing();

    // Auto-create personal organization
    try {
      await ensurePersonalOrg(id, name);
    } catch (err) {
      console.error("Failed to create personal org:", err);
    }

    return new Response("User created", { status: 201 });
  }

  if (eventType === "user.updated") {
    const { id, first_name, last_name, email_addresses, image_url } = evt.data;
    const name =
      [first_name, last_name].filter(Boolean).join(" ") ||
      email_addresses?.[0]?.email_address ||
      "Unknown";

    const email = email_addresses?.[0]?.email_address ?? null;

    await db
      .update(users)
      .set({ name, email, image: image_url ?? null })
      .where(eq(users.id, id));

    return new Response("User updated", { status: 200 });
  }

  if (eventType === "user.deleted") {
    const { id } = evt.data;
    if (!id) {
      return new Response("User deleted", { status: 200 });
    }

    // 1. Nullify API key ownership so keys are preserved instead of
    //    cascade-deleted when the users row is removed.
    await db
      .update(apiKeys)
      .set({ createdById: null })
      .where(eq(apiKeys.createdById, id));

    // 2. Find all orgs this user belongs to and handle sole-member orgs.
    const memberships = await db
      .select({ orgId: orgMembers.orgId })
      .from(orgMembers)
      .where(eq(orgMembers.userId, id));

    for (const { orgId } of memberships) {
      // Count members in this org OTHER than the departing user
      const remainingMembers = await db
        .select({ userId: orgMembers.userId })
        .from(orgMembers)
        .where(
          and(
            eq(orgMembers.orgId, orgId),
            ne(orgMembers.userId, id)
          )
        );

      if (remainingMembers.length === 0) {
        // Sole member: revoke all active org tokens so the engine disconnects
        // on its next heartbeat validation.
        await db
          .update(orgTokens)
          .set({ revokedAt: new Date() })
          .where(
            and(eq(orgTokens.orgId, orgId), isNull(orgTokens.revokedAt))
          );

        audit({
          orgId,
          userId: null,
          action: "org.tokens_revoked_on_user_delete",
          resourceType: "org",
          resourceId: orgId,
          metadata: { deletedUserId: id, reason: "sole_member_deleted" },
        });
      }
    }

    // 3. Delete the user. The cascade on orgMembers removes membership rows;
    //    apiKeys are safe because createdById is now null (set null FK).
    await db.delete(users).where(eq(users.id, id));

    return new Response("User deleted", { status: 200 });
  }

  return new Response("Webhook received", { status: 200 });
}
