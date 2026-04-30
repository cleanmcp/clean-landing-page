-- Agent-product metering: add columns to `subscriptions` and a `usage_events` table.
-- Existing cloud rows auto-tag as product='cloud' via the DEFAULT, so no backfill
-- is required and there is no downtime.

ALTER TABLE "subscriptions"
  ADD COLUMN IF NOT EXISTS "product" text NOT NULL DEFAULT 'cloud',
  ADD COLUMN IF NOT EXISTS "tier_key" text,
  ADD COLUMN IF NOT EXISTS "tokens_used_this_period" integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "tokens_limit" integer;

CREATE INDEX IF NOT EXISTS "subscriptions_user_product_status_idx"
  ON "subscriptions" ("user_id", "product", "status");

CREATE TABLE IF NOT EXISTS "usage_events" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "subscription_id" uuid,
  "user_id" text NOT NULL,
  "session_id" text,
  "idempotency_key" text UNIQUE,
  "input_tokens" integer,
  "output_tokens" integer,
  "cache_read_tokens" integer,
  "cache_creation_tokens" integer,
  "billable_tokens" integer NOT NULL,
  "is_byok" boolean NOT NULL DEFAULT false,
  "created_at" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "usage_events_subscription_id_fk"
    FOREIGN KEY ("subscription_id") REFERENCES "subscriptions"("id") ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS "usage_events_subscription_id_idx"
  ON "usage_events" ("subscription_id");
CREATE INDEX IF NOT EXISTS "usage_events_user_id_idx"
  ON "usage_events" ("user_id");
CREATE INDEX IF NOT EXISTS "usage_events_created_at_idx"
  ON "usage_events" ("created_at");
