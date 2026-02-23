import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { organizations } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

// GET /api/license/status?jti=<uuid>
// Public endpoint — no auth needed (jti is unguessable UUID).
// Called by engines to verify their license is still active.
export async function GET(request: NextRequest) {
  const jti = request.nextUrl.searchParams.get("jti");
  if (!jti) {
    return NextResponse.json({ active: false, reason: "missing jti" });
  }

  const [org] = await db
    .select({
      licenseRevoked: organizations.licenseRevoked,
      licenseExpiresAt: organizations.licenseExpiresAt,
    })
    .from(organizations)
    .where(eq(organizations.licenseJti, jti))
    .limit(1);

  if (!org) {
    return NextResponse.json({ active: false, reason: "unknown" });
  }

  if (org.licenseRevoked) {
    return NextResponse.json({ active: false, reason: "revoked" });
  }

  if (org.licenseExpiresAt && new Date() > org.licenseExpiresAt) {
    return NextResponse.json({ active: false, reason: "expired" });
  }

  return NextResponse.json({ active: true });
}
