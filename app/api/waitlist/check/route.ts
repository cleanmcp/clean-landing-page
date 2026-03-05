import { db } from "@/lib/db";
import { waitlist } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

// Check if an email is on the accepted waitlist
export async function POST(req: Request) {
  const { email } = await req.json();
  if (!email) {
    return Response.json({ error: "email required" }, { status: 400 });
  }

  const [entry] = await db
    .select({ status: waitlist.status })
    .from(waitlist)
    .where(and(eq(waitlist.email, email.toLowerCase()), eq(waitlist.status, "accepted")))
    .limit(1);

  return Response.json({ accepted: !!entry });
}
