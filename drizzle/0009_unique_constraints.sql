-- Prevent duplicate repos per org
CREATE UNIQUE INDEX IF NOT EXISTS "cloud_repos_org_full_name_uniq"
  ON "cloud_repos" ("org_id", "full_name");

-- Prevent duplicate GitHub installations per org
CREATE UNIQUE INDEX IF NOT EXISTS "github_installations_org_installation_uniq"
  ON "github_installations" ("org_id", "installation_id");
