import { Webhook } from "svix";
import { headers } from "next/headers";
import { WebhookEvent } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { user } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

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
    const { id, first_name, last_name, email_addresses } = evt.data;
    const name =
      [first_name, last_name].filter(Boolean).join(" ") ||
      email_addresses?.[0]?.email_address ||
      "Unknown";

    const email = email_addresses?.[0]?.email_address ?? null;

    await db.insert(user).values({
      id,
      name,
      email,
    });

    return new Response("User created", { status: 201 });
  }

  if (eventType === "user.updated") {
    const { id, first_name, last_name, email_addresses } = evt.data;
    const name =
      [first_name, last_name].filter(Boolean).join(" ") ||
      email_addresses?.[0]?.email_address ||
      "Unknown";

    const email = email_addresses?.[0]?.email_address ?? null;

    await db.update(user).set({ name, email }).where(eq(user.id, id));

    return new Response("User updated", { status: 200 });
  }

  if (eventType === "user.deleted") {
    const { id } = evt.data;
    if (id) {
      await db.delete(user).where(eq(user.id, id));
    }
    return new Response("User deleted", { status: 200 });
  }

  return new Response("Webhook received", { status: 200 });
}

