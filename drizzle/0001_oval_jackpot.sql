CREATE TABLE "org_tokens" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"name" text DEFAULT 'default' NOT NULL,
	"token_hash" text NOT NULL,
	"last_seen_at" timestamp,
	"revoked_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "org_tokens_token_hash_unique" UNIQUE("token_hash")
);
--> statement-breakpoint
ALTER TABLE "tunnels" ADD COLUMN "engine_api_key" text;--> statement-breakpoint
ALTER TABLE "org_tokens" ADD CONSTRAINT "org_tokens_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "org_tokens_org_id_idx" ON "org_tokens" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "org_tokens_token_hash_idx" ON "org_tokens" USING btree ("token_hash");