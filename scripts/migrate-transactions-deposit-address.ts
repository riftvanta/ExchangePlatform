import { Pool } from 'pg';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function migrateTransactionsTable() {
  console.log('Starting migration for transactions table...');
  
  // Create a new PostgreSQL client
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  });
  
  try {
    // Connect to the database
    const client = await pool.connect();
    
    try {
      // Check if the column already exists
      const checkColumnQuery = `
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'transactions' 
        AND column_name = 'deposit_address';
      `;
      
      const checkResult = await client.query(checkColumnQuery);
      
      if (checkResult.rows.length === 0) {
        console.log('deposit_address column does not exist, adding it...');
        
        // Add the deposit_address column to the transactions table
        const alterTableQuery = `
          ALTER TABLE transactions 
          ADD COLUMN deposit_address TEXT;
        `;
        
        await client.query(alterTableQuery);
        console.log('deposit_address column added to transactions table');
      } else {
        console.log('deposit_address column already exists in transactions table');
      }
      
      console.log('Migration completed successfully');
    } finally {
      // Release the client back to the pool
      client.release();
    }
  } catch (error) {
    console.error('Error during migration:', error);
    throw error;
  } finally {
    // Close the pool
    await pool.end();
  }
}

// Run the migration
migrateTransactionsTable()
  .then(() => {
    console.log('Migration script completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Migration script failed:', error);
    process.exit(1);
  }); 