CREATE TABLE "deposit_addresses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"currency" text NOT NULL,
	"network" text NOT NULL,
	"address" text NOT NULL,
	"path" text NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"label" text,
	"last_used" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "deposit_addresses_address_unique" UNIQUE("address")
);
--> statement-breakpoint
ALTER TABLE "transactions" ADD COLUMN "deposit_address" text;--> statement-breakpoint
ALTER TABLE "deposit_addresses" ADD CONSTRAINT "deposit_addresses_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;