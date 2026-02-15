import { NextRequest, NextResponse } from "next/server";
import { verifyLicenseKey } from "@/lib/license";
import { db } from "@/lib/db";
import { organizations, orgTokens } from "@/lib/db/schema";
import { generateOrgToken } from "@/lib/org-tokens";
import { audit } from "@/lib/audit";
import { eq } from "drizzle-orm";

// ── Simple in-memory rate limiter (5 req/min per license key) ────────

const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 5;
const RATE_WINDOW_MS = 60_000;

function isRateLimited(key: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(key);

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(key, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return false;
  }

  entry.count++;
  return entry.count > RATE_LIMIT;
}

// ── POST /api/cli/provision ──────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    // 1. Extract JWT from Authorization header
    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Missing or invalid Authorization header" },
        { status: 401 }
      );
    }

    const token = authHeader.slice(7);

    // 2. Rate limit by token
    if (isRateLimited(token)) {
      return NextResponse.json(
        { error: "Rate limit exceeded — try again in a minute" },
        { status: 429 }
      );
    }

    // 3. Verify ES256 signature
    let claims;
    try {
      claims = verifyLicenseKey(token);
    } catch {
      return NextResponse.json(
        { error: "Invalid license" },
        { status: 401 }
      );
    }

    // 4. Look up org by license key
    const [org] = await db
      .select({
        id: organizations.id,
        slug: organizations.slug,
        tier: organizations.tier,
      })
      .from(organizations)
      .where(eq(organizations.licenseKey, token))
      .limit(1);

    if (!org) {
      return NextResponse.json(
        { error: "Invalid license" },
        { status: 401 }
      );
    }

    // 5. Generate an org token for gateway auth
    const { plainToken, tokenHash } = generateOrgToken();

    const [orgToken] = await db
      .insert(orgTokens)
      .values({
        orgId: org.id,
        name: "cli-provisioned",
        tokenHash,
      })
      .returning({ id: orgTokens.id });

    // Audit
    audit({
      orgId: org.id,
      action: "token.created",
      resourceType: "org_token",
      resourceId: orgToken.id,
      metadata: { source: "cli-provision" },
    });

    // 6. Return org token + org info
    return NextResponse.json({
      orgToken: plainToken,
      orgSlug: org.slug,
      tier: claims.tier,
      maxRepos: claims.max_repos,
      maxUsers: claims.max_users,
    });
  } catch (error) {
    console.error("Provision failed:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
