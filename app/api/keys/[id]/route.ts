import { NextRequest, NextResponse } from "next/server";
import { getAuthContext } from "@/lib/auth";
import { db } from "@/lib/db";
import { apiKeys } from "@/lib/db/schema";
import { audit } from "@/lib/audit";
import { syncKeyToEngine } from "@/lib/engine-sync";
import { eq, and, isNull } from "drizzle-orm";

// DELETE /api/keys/[id] - Revoke an API key
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const ctx = await getAuthContext();
    if (!ctx) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Check if key exists and belongs to the current user
    const [key] = await db
      .select()
      .from(apiKeys)
      .where(
        and(
          eq(apiKeys.id, id),
          eq(apiKeys.createdById, ctx.userId),
          isNull(apiKeys.revokedAt)
        )
      )
      .limit(1);

    if (!key) {
      return NextResponse.json(
        { error: "API key not found" },
        { status: 404 }
      );
    }

    // Soft delete by setting revokedAt
    await db
      .update(apiKeys)
      .set({ revokedAt: new Date() })
      .where(eq(apiKeys.id, id));

    // Audit log
    audit({
      orgId: key.orgId,
      userId: ctx.userId,
      apiKeyId: id,
      action: "key.revoked",
      resourceType: "api_key",
      resourceId: id,
      metadata: { name: key.name },
    });

    // Sync revocation to the self-hosted engine
    if (key.orgId) {
      await syncKeyToEngine(key.orgId, "revoke", { id });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to revoke API key:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
