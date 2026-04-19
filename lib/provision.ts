import { db } from "@/lib/db";
import { organizations } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { generateLicenseKey } from "@/lib/license";
import { getCreditConfig } from "@/lib/tier-limits";

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

/**
 * Idempotently grant a free-tier org its license key + starting credits.
 * Safe to call repeatedly: existing license is reused; credits are only
 * initialised if `credit_period_start` is null.
 */
export async function provisionFreeTier(orgId: string): Promise<{ licenseKey: string }> {
  const [existing] = await db
    .select({
      licenseKey: organizations.licenseKey,
      licenseJti: organizations.licenseJti,
      licenseExpiresAt: organizations.licenseExpiresAt,
      creditPeriodStart: organizations.creditPeriodStart,
    })
    .from(organizations)
    .where(eq(organizations.id, orgId))
    .limit(1);

  let licenseKey = existing?.licenseKey ?? null;
  let licenseJti = existing?.licenseJti ?? null;
  let licenseExpiresAt = existing?.licenseExpiresAt ?? null;

  if (!licenseKey) {
    licenseKey = generateLicenseKey({ customerId: orgId, tier: "free", months: 12 });
    const claims = JSON.parse(Buffer.from(licenseKey.split(".")[1], "base64").toString());
    licenseJti = claims.jti;
    licenseExpiresAt = new Date(claims.exp * 1000);
  }

  const config = getCreditConfig("free");
  const now = new Date();
  const initCredits = existing?.creditPeriodStart == null;

  await db
    .update(organizations)
    .set({
      tier: "free",
      licenseKey,
      licenseJti,
      licenseExpiresAt,
      licenseRevoked: false,
      hostingMode: "cloud",
      creditGrantMonthly: config.grantMonthly,
      creditsPerSearch: config.creditsPerSearch,
      creditRolloverCap: config.rolloverCap,
      overageCap: config.overageCap,
      ...(initCredits
        ? {
            creditBalance: config.grantMonthly,
            creditPeriodStart: now,
            creditPeriodEnd: new Date(now.getTime() + THIRTY_DAYS_MS),
            overageUsed: 0,
          }
        : {}),
    })
    .where(eq(organizations.id, orgId));

  return { licenseKey };
}
