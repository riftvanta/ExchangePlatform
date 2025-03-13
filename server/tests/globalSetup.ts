import db from '../db';
import { users, wallets, transactions } from '../../shared/schema';

module.exports = async () => {
  // Connect to the database (if not already connected)
    console.log('Setting up test environment');
    try {
        // Drop tables to ensure a clean state.
        await db.delete(transactions);
        await db.delete(wallets);
        await db.delete(users);
        console.log("Tables dropped successfully");
    } catch(error) {
        console.log("Error droping tables: ", error)
    }
}; 