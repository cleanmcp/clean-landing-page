-- Add seat_limit to organizations (null = unlimited)
ALTER TABLE "organizations" ADD COLUMN IF NOT EXISTS "seat_limit" integer;

-- Backfill existing orgs based on their current tier
UPDATE "organizations" SET "seat_limit" = 1 WHERE "tier" = 'free' OR "tier" IS NULL;
UPDATE "organizations" SET "seat_limit" = 4 WHERE "tier" = 'pro';
-- enterprise stays NULL (unlimited)
