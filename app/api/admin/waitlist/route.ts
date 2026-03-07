import { db } from "@/lib/db";
import { waitlist } from "@/lib/db/schema";
import { desc } from "drizzle-orm";
import { requireAdmin } from "@/lib/admin";

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) {
    return Response.json({ error: "Unauthorized" }, { status: 403 });
  }

  const entries = await db
    .select()
    .from(waitlist)
    .orderBy(desc(waitlist.createdAt))
    .limit(500);

  return Response.json(entries);
}
