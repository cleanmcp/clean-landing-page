-- Update credit defaults to match new pricing model.
-- 1 credit = 1 basic search (engine charges 1/3/5 by depth).
-- Free tier gets 10 credits/month.
ALTER TABLE organizations ALTER COLUMN credit_balance SET DEFAULT 10;
ALTER TABLE organizations ALTER COLUMN credits_per_search SET DEFAULT 1;
