import { db } from "@/lib/db";
import { waitlist } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { sendAcceptanceEmail } from "@/lib/email";

const ADMIN_SECRET = process.env.ADMIN_SECRET || "admin";

function isAuthorized(req: Request) {
  const token = req.headers.get("x-admin-secret");
  return token === ADMIN_SECRET;
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isAuthorized(req)) {
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
