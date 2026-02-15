import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { getAuthContext } from "@/lib/auth";
import { db } from "@/lib/db";
import { invites } from "@/lib/db/schema";
import { eq, and, isNull } from "drizzle-orm";

// POST /api/invites - Create an invite link
export async function POST(request: NextRequest) {
  try {
    const ctx = await getAuthContext();
    if (!ctx) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (ctx.role !== "OWNER" && ctx.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const role = body.role === "ADMIN" && ctx.role === "OWNER" ? "ADMIN" : "MEMBER";
    const maxUses = body.maxUses ? Number(body.maxUses) : null;
    const email = body.email || null;

    let expiresAt: Date | null = null;
    if (body.expiresInDays) {
      expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + Number(body.expiresInDays));
    }

    const token = randomBytes(24).toString("hex");

    const [invite] = await db
      .insert(invites)
      .values({
        orgId: ctx.orgId,
        createdById: ctx.userId,
        token,
        role,
        email,
        maxUses,
        expiresAt,
      })
      .returning();

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin;
    const inviteUrl = `${baseUrl}/invite/${token}`;

    return NextResponse.json({
      invite: {
        id: invite.id,
        token: invite.token,
        inviteUrl,
        role: invite.role,
        email: invite.email,
        expiresAt: invite.expiresAt?.toISOString() ?? null,
        maxUses: invite.maxUses,
      },
    });
  } catch (error) {
    console.error("POST /api/invites failed:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// GET /api/invites - List active invites for org
export async function GET() {
  try {
    const ctx = await getAuthContext();
    if (!ctx) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (ctx.role !== "OWNER" && ctx.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const activeInvites = await db
      .select()
      .from(invites)
      .where(and(eq(invites.orgId, ctx.orgId), isNull(invites.revokedAt)));

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "";

    return NextResponse.json({
      invites: activeInvites.map((inv) => ({
        id: inv.id,
        token: inv.token,
        inviteUrl: `${baseUrl}/invite/${inv.token}`,
        role: inv.role,
        email: inv.email,
        maxUses: inv.maxUses,
        useCount: inv.useCount,
        expiresAt: inv.expiresAt?.toISOString() ?? null,
        createdAt: inv.createdAt.toISOString(),
      })),
    });
  } catch (error) {
    console.error("GET /api/invites failed:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE /api/invites - Revoke an invite
export async function DELETE(request: NextRequest) {
  try {
    const ctx = await getAuthContext();
    if (!ctx) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (ctx.role !== "OWNER" && ctx.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await request.json();
    if (!id) {
      return NextResponse.json(
        { error: "Invite ID is required" },
        { status: 400 }
      );
    }

    await db
      .update(invites)
      .set({ revokedAt: new Date() })
      .where(and(eq(invites.id, id), eq(invites.orgId, ctx.orgId)));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/invites failed:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
