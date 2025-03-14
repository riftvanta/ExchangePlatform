ALTER TABLE "users" ADD COLUMN "email_verified" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "verification_token" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "verification_token_expiry" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "reset_password_token" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "reset_password_expiry" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "transactions" DROP COLUMN "wallet_address";