-- Add consumable credit balance to organizations.
-- Each search costs credits_per_search credits. Balance is deducted on use.
ALTER TABLE organizations ADD COLUMN credit_balance INTEGER NOT NULL DEFAULT 1000;
ALTER TABLE organizations ADD COLUMN credits_per_search INTEGER NOT NULL DEFAULT 20;
