import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '../shared/schema';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Get database connection string from environment variables
const DATABASE_URL = process.env.DATABASE_URL;

// Ensure DATABASE_URL is defined
if (!DATABASE_URL) {
    throw new Error(
        'DATABASE_URL environment variable is missing. Please add it to your .env file.'
    );
}

// Create postgres client with limited connections for development
const client = postgres(DATABASE_URL, { max: 20 });

// Initialize drizzle with the client and schema
const db = drizzle(client, { schema });

export default db;
