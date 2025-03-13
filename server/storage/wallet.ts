import db from '../db';
import { wallets, Wallet, NewWallet } from '../../shared/schema';
import { eq } from 'drizzle-orm';

/**
 * Retrieves all wallets belonging to a specific user
 * @param userId - The ID of the user whose wallets to fetch
 * @returns An array of wallet objects
 */
export async function getWalletsByUserId(userId: string): Promise<Wallet[]> {
    const result = await db
        .select()
        .from(wallets)
        .where(eq(wallets.userId, userId));

    return result;
}

/**
 * Creates a new wallet in the database
 * @param newWallet - The wallet data to insert
 * @returns The created wallet with all fields (including generated ID)
 */
export async function createWallet(newWallet: NewWallet): Promise<Wallet> {
    const result = await db.insert(wallets).values(newWallet).returning();

    return result[0];
}
