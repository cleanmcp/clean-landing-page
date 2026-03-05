import { db } from "@/lib/db";
import { waitlist } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { sendWaitlistNotification } from "@/lib/email";

export async function POST(req: Request) {
  try {
    const { name, email } = await req.json();

    if (!name || !email) {
      return Response.json({ error: "Name and email are required" }, { status: 400 });
    }

    // Check if already on waitlist
    const existing = await db
      .select({ id: waitlist.id })
      .from(waitlist)
      .where(eq(waitlist.email, email.toLowerCase()))
      .limit(1);

    if (existing.length > 0) {
      return Response.json({ error: "You're already on the waitlist!" }, { status: 409 });
    }

    // Insert into waitlist
    await db.insert(waitlist).values({
      name: name.trim(),
      email: email.toLowerCase().trim(),
    });

    // Send notification to admin (fire-and-forget)
    sendWaitlistNotification(name.trim(), email.toLowerCase().trim());

    return Response.json({ success: true }, { status: 201 });
  } catch (err) {
    console.error("Waitlist signup error:", err);
    return Response.json({ error: "Something went wrong" }, { status: 500 });
  }
}
