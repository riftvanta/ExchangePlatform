/**
 * Manual migration script for creating the deposit_addresses table
 * 
 * Run with: ts-node scripts/migrate-deposit-addresses.ts
 */
import db from '../server/db';
import * as fs from 'fs';
import * as path from 'path';

async function runMigration() {
  try {
    console.log('Starting manual migration for deposit_addresses table...');
    
    // SQL for creating the deposit_addresses table
    const sql = `
      CREATE TABLE IF NOT EXISTS "deposit_addresses" (
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

      ALTER TABLE "deposit_addresses" 
      ADD CONSTRAINT "deposit_addresses_user_id_users_id_fk" 
      FOREIGN KEY ("user_id") REFERENCES "users"("id") 
      ON DELETE no action 
      ON UPDATE no action;
    `;
    
    // Execute the SQL directly
    await db.execute(sql);
    
    console.log('Migration completed successfully!');
    console.log('deposit_addresses table has been created.');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

// Run the migration
runMigration(); 