-- Early access feature gate
CREATE TABLE IF NOT EXISTS "early_access_users" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" text NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "feature" text NOT NULL,
  "granted_at" timestamp NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS "early_access_users_user_feature_uniq"
  ON "early_access_users" ("user_id", "feature");

CREATE INDEX IF NOT EXISTS "early_access_users_feature_idx"
  ON "early_access_users" ("feature");
