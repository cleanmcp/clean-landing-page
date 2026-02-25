-- Change api_keys.created_by_id to nullable with SET NULL on user delete
-- Previously: NOT NULL, ON DELETE CASCADE
-- Now: nullable, ON DELETE SET NULL

-- Drop the existing foreign key constraint
ALTER TABLE "api_keys" DROP CONSTRAINT IF EXISTS "api_keys_created_by_id_users_id_fk";--> statement-breakpoint

-- Allow nulls
ALTER TABLE "api_keys" ALTER COLUMN "created_by_id" DROP NOT NULL;--> statement-breakpoint

-- Re-add the foreign key with ON DELETE SET NULL
ALTER TABLE "api_keys" ADD CONSTRAINT "api_keys_created_by_id_users_id_fk"
  FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id")
  ON DELETE SET NULL ON UPDATE NO ACTION;
