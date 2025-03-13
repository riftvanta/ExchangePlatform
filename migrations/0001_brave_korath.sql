ALTER TABLE "users" ALTER COLUMN "two_factor_enabled" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "salt" text NOT NULL;