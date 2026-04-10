-- Cross-platform sync projects
CREATE TABLE IF NOT EXISTS "sync_projects" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "org_id" uuid NOT NULL REFERENCES "organizations"("id") ON DELETE CASCADE,
  "name" text NOT NULL,
  "description" text,
  "active" boolean NOT NULL DEFAULT true,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "sync_projects_org_id_idx"
  ON "sync_projects" ("org_id");

-- Repos within a sync project
CREATE TABLE IF NOT EXISTS "sync_project_repos" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "project_id" uuid NOT NULL REFERENCES "sync_projects"("id") ON DELETE CASCADE,
  "repo_full_name" text NOT NULL,
  "stack" text NOT NULL,
  "branch" text NOT NULL DEFAULT 'main',
  "created_at" timestamp NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "sync_project_repos_project_id_idx"
  ON "sync_project_repos" ("project_id");

CREATE UNIQUE INDEX IF NOT EXISTS "sync_project_repos_project_repo_uniq"
  ON "sync_project_repos" ("project_id", "repo_full_name");

-- Sync run history
CREATE TABLE IF NOT EXISTS "sync_runs" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "project_id" uuid NOT NULL REFERENCES "sync_projects"("id") ON DELETE CASCADE,
  "source_repo_full_name" text NOT NULL,
  "commit_sha" text NOT NULL,
  "branch" text NOT NULL,
  "status" text NOT NULL DEFAULT 'pending',
  "target_count" integer NOT NULL,
  "completed_count" integer DEFAULT 0,
  "failed_count" integer DEFAULT 0,
  "error" text,
  "started_at" timestamp,
  "completed_at" timestamp,
  "created_at" timestamp NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "sync_runs_project_id_idx"
  ON "sync_runs" ("project_id");

CREATE INDEX IF NOT EXISTS "sync_runs_created_at_idx"
  ON "sync_runs" ("created_at");
