import { db } from "@/lib/db";
import { waitlist } from "@/lib/db/schema";
import { desc } from "drizzle-orm";

const ADMIN_SECRET = process.env.ADMIN_SECRET;
if (!ADMIN_SECRET) {
  console.error("[admin] ADMIN_SECRET env var is not set — admin routes will reject all requests");
}

function isAuthorized(req: Request) {
  if (!ADMIN_SECRET) return false;
  const token = req.headers.get("x-admin-secret");
  return token === ADMIN_SECRET;
}

export async function GET(req: Request) {
  if (!isAuthorized(req)) {
    return Response.json({ error: "Unauthorized" }, { status: 403 });
  }

  const entries = await db
    .select()
    .from(waitlist)
    .orderBy(desc(waitlist.createdAt));

  return Response.json(entries);
}
