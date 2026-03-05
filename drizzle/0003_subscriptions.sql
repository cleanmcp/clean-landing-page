-- Add stripe_customer_id to organizations
ALTER TABLE "organizations" ADD COLUMN "stripe_customer_id" text;
CREATE INDEX "organizations_stripe_customer_id_idx" ON "organizations" ("stripe_customer_id");

--> statement-breakpoint

-- subscriptions table
CREATE TABLE "subscriptions" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "stripe_subscription_id" text NOT NULL,
  "stripe_customer_id" text NOT NULL,
  "org_id" uuid REFERENCES "organizations"("id") ON DELETE SET NULL,
  "user_id" text NOT NULL REFERENCES "users"("id") ON DELETE RESTRICT,
  "status" text NOT NULL,
  "plan" text NOT NULL,
  "stripe_price_id" text NOT NULL,
  "current_period_start" timestamp NOT NULL,
  "current_period_end" timestamp NOT NULL,
  "cancel_at_period_end" boolean NOT NULL DEFAULT false,
  "canceled_at" timestamp,
  "trial_end" timestamp,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "subscriptions_stripe_subscription_id_unique" UNIQUE("stripe_subscription_id")
);

CREATE INDEX "subscriptions_org_id_idx" ON "subscriptions" ("org_id");
CREATE INDEX "subscriptions_user_id_idx" ON "subscriptions" ("user_id");
CREATE INDEX "subscriptions_stripe_customer_id_idx" ON "subscriptions" ("stripe_customer_id");
CREATE INDEX "subscriptions_status_idx" ON "subscriptions" ("status");

--> statement-breakpoint

-- payment_transactions table
CREATE TABLE "payment_transactions" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "subscription_id" uuid REFERENCES "subscriptions"("id") ON DELETE SET NULL,
  "stripe_invoice_id" text NOT NULL,
  "stripe_payment_intent_id" text,
  "org_id" uuid REFERENCES "organizations"("id") ON DELETE SET NULL,
  "user_id" text REFERENCES "users"("id") ON DELETE SET NULL,
  "amount_paid" integer NOT NULL,
  "currency" text NOT NULL DEFAULT 'usd',
  "status" text NOT NULL,
  "billing_reason" text,
  "period_start" timestamp,
  "period_end" timestamp,
  "paid_at" timestamp,
  "created_at" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "payment_transactions_stripe_invoice_id_unique" UNIQUE("stripe_invoice_id")
);

CREATE INDEX "payment_transactions_subscription_id_idx" ON "payment_transactions" ("subscription_id");
CREATE INDEX "payment_transactions_org_id_idx" ON "payment_transactions" ("org_id");
CREATE INDEX "payment_transactions_user_id_idx" ON "payment_transactions" ("user_id");

--> statement-breakpoint

-- stripe_webhook_events table (idempotency guard)
CREATE TABLE "stripe_webhook_events" (
  "id" text PRIMARY KEY NOT NULL,
  "type" text NOT NULL,
  "processed_at" timestamp DEFAULT now() NOT NULL
);
