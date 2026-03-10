import { db } from "@/lib/db";
import { waitlist } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { sendAcceptanceEmail } from "@/lib/email";
import { requireAdmin } from "@/lib/admin";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin();
  if (!admin) {
    return Response.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { id } = await params;
  const { action } = await req.json();

  if (action !== "accept" && action !== "reject") {
    return Response.json({ error: "Invalid action" }, { status: 400 });
  }

  const [entry] = await db
    .select()
    .from(waitlist)
    .where(eq(waitlist.id, id));

  if (!entry) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  if (action === "accept") {
    await db
      .update(waitlist)
      .set({ status: "accepted", acceptedAt: new Date() })
      .where(eq(waitlist.id, id));

    sendAcceptanceEmail(entry.name, entry.email);
    return Response.json({ success: true, action: "accepted" });
  }

  await db
    .update(waitlist)
    .set({ status: "rejected", rejectedAt: new Date() })
    .where(eq(waitlist.id, id));

  return Response.json({ success: true, action: "rejected" });
}
