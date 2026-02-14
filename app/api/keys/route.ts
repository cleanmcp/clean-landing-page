import { NextRequest, NextResponse } from "next/server";
import { getAuthContext } from "@/lib/auth";
import { db } from "@/lib/db";
import { apiKeys } from "@/lib/db/schema";
import { generateApiKey } from "@/lib/api-keys";
import { audit } from "@/lib/audit";
import { eq, isNull, and, desc } from "drizzle-orm";

// GET /api/keys - List all API keys for the user
export async function GET() {
  try {
    const ctx = await getAuthContext();
    if (!ctx) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userKeys = await db
      .select()
      .from(apiKeys)
      .where(
        and(eq(apiKeys.createdById, ctx.userId), isNull(apiKeys.revokedAt))
      )
      .orderBy(desc(apiKeys.createdAt));

    const keys = userKeys.map((k) => ({
      id: k.id,
      name: k.name,
      keyPrefix: k.keyPrefix,
      scopes: k.scopes,
      lastUsedAt: k.lastUsedAt?.toISOString() ?? null,
      expiresAt: k.expiresAt?.toISOString() ?? null,
      createdAt: k.createdAt.toISOString(),
    }));

    return NextResponse.json({ keys });
  } catch (error) {
    console.error("Failed to fetch API keys:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/keys - Create a new API key
export async function POST(request: NextRequest) {
  try {
    const ctx = await getAuthContext();
    if (!ctx) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const rawBody = await request.text();
    if (rawBody.length > 10000) {
      return NextResponse.json(
        { error: "Request too large" },
        { status: 413 }
      );
    }
    const body = JSON.parse(rawBody);
    const { name, scopes } = body;

    if (!name || typeof name !== "string") {
      return NextResponse.json(
        { error: "Name is required" },
        { status: 400 }
      );
    }

    if (!scopes || !Array.isArray(scopes) || scopes.length === 0) {
      return NextResponse.json(
        { error: "At least one scope is required" },
        { status: 400 }
      );
    }

    // Validate scopes
    const validScopes = ["search", "index", "admin"];
    if (!scopes.every((s: string) => validScopes.includes(s))) {
      return NextResponse.json({ error: "Invalid scope" }, { status: 400 });
    }

    // Generate the API key
    const { plainKey, keyPrefix, keyHash } = await generateApiKey("prod");

    // Store the key in database
    const [apiKey] = await db
      .insert(apiKeys)
      .values({
        createdById: ctx.userId,
        orgId: ctx.orgId,
        name,
        keyPrefix,
        keyHash,
        scopes,
      })
      .returning({ id: apiKeys.id });

    // Audit log
    audit({
      orgId: ctx.orgId,
      userId: ctx.userId,
      apiKeyId: apiKey.id,
      action: "key.created",
      resourceType: "api_key",
      resourceId: apiKey.id,
      metadata: { name, scopes },
    });

    // Return the plain key (only time it's shown)
    return NextResponse.json({ key: plainKey });
  } catch (error) {
    console.error("Failed to create API key:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
