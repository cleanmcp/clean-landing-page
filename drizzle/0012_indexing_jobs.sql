-- Add metadata columns to cloud_repos
ALTER TABLE "cloud_repos" ADD COLUMN IF NOT EXISTS "description" text;
ALTER TABLE "cloud_repos" ADD COLUMN IF NOT EXISTS "primary_language" text;
ALTER TABLE "cloud_repos" ADD COLUMN IF NOT EXISTS "tags" jsonb;

-- Create indexing_jobs priority queue table
CREATE TABLE IF NOT EXISTS "indexing_jobs" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "org_id" uuid NOT NULL REFERENCES "organizations"("id") ON DELETE CASCADE,
  "repo_full_name" text NOT NULL,
  "branch" text NOT NULL DEFAULT 'main',
  "installation_id" integer,
  "priority" integer NOT NULL DEFAULT 10,
  "status" text NOT NULL DEFAULT 'pending',
  "worker_id" text,
  "started_at" timestamp,
  "completed_at" timestamp,
  "current_phase" text,
  "phase_progress" integer DEFAULT 0,
  "files_processed" integer DEFAULT 0,
  "files_total" integer DEFAULT 0,
  "entities_found" integer DEFAULT 0,
  "error" text,
  "entity_count" integer,
  "triggered_by" text,
  "api_key_id" uuid,
  "force_reindex" boolean DEFAULT false,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now()
);

-- Priority queue index (the queue itself — pending jobs ordered by priority then age)
CREATE INDEX IF NOT EXISTS "indexing_jobs_queue_idx"
  ON "indexing_jobs" ("priority" DESC, "created_at" ASC)
  WHERE status = 'pending';

-- Org lookup
CREATE INDEX IF NOT EXISTS "indexing_jobs_org_status_idx"
  ON "indexing_jobs" ("org_id", "status");

-- Dedup: only one active job per org+repo+branch
CREATE UNIQUE INDEX IF NOT EXISTS "indexing_jobs_active_uniq"
  ON "indexing_jobs" ("org_id", "repo_full_name", "branch")
  WHERE status IN ('pending', 'running');
