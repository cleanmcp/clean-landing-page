import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { waitlist } from "@/lib/db/schema";
import { eq, and, isNull, lte, gte } from "drizzle-orm";
import { sendFollowUpEmail } from "@/lib/email";

/**
 * GET /api/cron/followup — Send follow-up emails to users accepted ~7 days ago.
 *
 * Protected by a shared secret in the Authorization header.
 * Set up a daily cron (e.g. GitHub Actions, external cron service, or
 * Vercel Cron) to hit this endpoint once per day.
 */
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const expected = process.env.CRON_SECRET;

  if (!expected || authHeader !== `Bearer ${expected}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Find users accepted between 7 and 8 days ago who haven't received a follow-up
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const eightDaysAgo = new Date(now.getTime() - 8 * 24 * 60 * 60 * 1000);

  const entries = await db
    .select()
    .from(waitlist)
    .where(
      and(
        eq(waitlist.status, "accepted"),
        isNull(waitlist.followUpSentAt),
        lte(waitlist.acceptedAt, sevenDaysAgo),
        gte(waitlist.acceptedAt, eightDaysAgo),
      ),
    );

  let sent = 0;
  for (const entry of entries) {
    await sendFollowUpEmail(entry.name, entry.email);
    await db
      .update(waitlist)
      .set({ followUpSentAt: new Date() })
      .where(eq(waitlist.id, entry.id));
    sent++;
  }

  return NextResponse.json({ sent, total: entries.length });
}
