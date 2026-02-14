import { Webhook } from "svix";
import { headers } from "next/headers";
import { WebhookEvent } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { users, organizations, orgMembers } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

/**
 * Ensure a user has a personal organization.
 * Creates one if missing. Returns the org ID.
 */
async function ensurePersonalOrg(
  userId: string,
  userName: string | null
): Promise<string> {
  // Check for existing membership
  const existing = await db
    .select({ orgId: orgMembers.orgId })
    .from(orgMembers)
    .where(eq(orgMembers.userId, userId))
    .limit(1);

  if (existing.length > 0) return existing[0].orgId;

  // Create personal org
  const slug = `personal-${userId.slice(0, 8)}`;
  const orgName = userName ? `${userName}'s Org` : "Personal";

  const [org] = await db
    .insert(organizations)
    .values({ name: orgName, slug })
    .returning({ id: organizations.id });

  await db.insert(orgMembers).values({
    orgId: org.id,
    userId,
    role: "OWNER",
  });

  return org.id;
}

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

    // Insert user
    await db.insert(users).values({
      id,
      name,
      email,
      image: image_url ?? null,
    });

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
    if (id) {
      await db.delete(users).where(eq(users.id, id));
    }
    return new Response("User deleted", { status: 200 });
  }

  return new Response("Webhook received", { status: 200 });
}
