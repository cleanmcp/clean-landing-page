ALTER TABLE "organizations" ADD COLUMN "license_jti" text;--> statement-breakpoint
ALTER TABLE "organizations" ADD COLUMN "license_revoked" boolean DEFAULT false;
