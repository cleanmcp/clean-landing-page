-- Add hosting mode to organizations
ALTER TABLE "organizations" ADD COLUMN "hosting_mode" text DEFAULT 'self-hosted';

-- GitHub App installations for cloud users
CREATE TABLE IF NOT EXISTS "github_installations" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "org_id" uuid NOT NULL REFERENCES "organizations"("id") ON DELETE CASCADE,
  "installation_id" integer NOT NULL,
  "account_login" text NOT NULL,
  "account_type" text NOT NULL,
  "account_avatar_url" text,
  "active" boolean NOT NULL DEFAULT true,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "github_installations_org_id_idx" ON "github_installations" ("org_id");
CREATE INDEX IF NOT EXISTS "github_installations_installation_id_idx" ON "github_installations" ("installation_id");

-- Cloud repos selected for indexing
CREATE TABLE IF NOT EXISTS "cloud_repos" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "org_id" uuid NOT NULL REFERENCES "organizations"("id") ON DELETE CASCADE,
  "installation_id" uuid REFERENCES "github_installations"("id") ON DELETE SET NULL,
  "full_name" text NOT NULL,
  "default_branch" text DEFAULT 'main',
  "language" text,
  "private" boolean NOT NULL DEFAULT false,
  "status" text NOT NULL DEFAULT 'pending',
  "entity_count" integer,
  "last_indexed_at" timestamp,
  "error" text,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "cloud_repos_org_id_idx" ON "cloud_repos" ("org_id");
CREATE INDEX IF NOT EXISTS "cloud_repos_installation_id_idx" ON "cloud_repos" ("installation_id");
CREATE INDEX IF NOT EXISTS "cloud_repos_full_name_idx" ON "cloud_repos" ("full_name");
