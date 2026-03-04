import { NextRequest, NextResponse } from "next/server";
import { verifyLicenseKey } from "@/lib/license";
import { db } from "@/lib/db";
import { organizations, apiKeys } from "@/lib/db/schema";
import { generateApiKey } from "@/lib/api-keys";
import { syncKeyToEngine } from "@/lib/engine-sync";
import { audit } from "@/lib/audit";
import { eq } from "drizzle-orm";

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Missing or invalid Authorization header" },
        { status: 401 }
      );
    }

    const token = authHeader.slice(7);

    let claims;
    try {
      claims = verifyLicenseKey(token);
    } catch {
      return NextResponse.json({ error: "Invalid license" }, { status: 401 });
    }

    const [org] = await db
      .select({ id: organizations.id, slug: organizations.slug })
      .from(organizations)
      .where(eq(organizations.licenseKey, token))
      .limit(1);

    if (!org) {
      return NextResponse.json({ error: "Invalid license" }, { status: 401 });
    }

    const { plainKey, keyPrefix, keyHash } = await generateApiKey("prod");

    const [apiKey] = await db
      .insert(apiKeys)
      .values({
        createdById: null,
        orgId: org.id,
        name: "cli-auto-created",
        keyPrefix,
        keyHash,
        scopes: ["search", "index"],
      })
      .returning({ id: apiKeys.id });

    audit({
      orgId: org.id,
      userId: null,
      action: "key.created",
      resourceType: "api_key",
      resourceId: apiKey.id,
      metadata: { name: "cli-auto-created", source: "cli-create-key" },
    });

    await syncKeyToEngine(org.id, "create", {
      id: apiKey.id,
      orgId: org.id,
      keyPrefix,
      keyHash,
      scopes: ["search", "index"],
      name: "cli-auto-created",
      expiresAt: null,
    });

    return NextResponse.json({ key: plainKey, keyPrefix });
  } catch (error) {
    console.error("CLI create-key failed:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
