import { createWallet, getWalletsByUserId } from '../storage/wallet';
import db from '../db';
import { users, wallets, NewWallet } from '../../shared/schema';
import { eq } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';

// Mock the sendgrid functions to avoid real emails during testing.
jest.mock('../../shared/email', () => ({
    sendWelcomeEmail: jest.fn(),
    sendPasswordResetEmail: jest.fn(),
    sendPasswordResetConfirmationEmail: jest.fn(),
}));

// Add a special test to run all wallet tests in sequence
// This ensures tests don't interfere with each other
describe('Wallet Storage Functions Tests', () => {
    it('should test all wallet functionality', async () => {
        // Clean up the database before starting
        await db.delete(wallets);
        await db.delete(users);

        try {
            // Create a test user
            const result = await db
                .insert(users)
                .values({
                    email: 'testuser@example.com',
                    password: 'password',
                    salt: 'salt',
                })
                .returning();
            const userId = result[0].id;

            // Test 1: Create a new wallet
            const newWallet: NewWallet = {
                userId: userId,
                currency: 'USDT',
                balance: '0',
            };

            const createdWallet = await createWallet(newWallet);

            expect(createdWallet).toBeDefined();
            expect(createdWallet.userId).toBe(userId);
            expect(createdWallet.currency).toBe('USDT');
            expect(createdWallet.balance).toBe('0');
            expect(createdWallet.id).toBeDefined(); // Check that an ID was generated

            // Verify that the wallet exists in the database
            const dbWallet = await db
                .select()
                .from(wallets)
                .where(eq(wallets.id, createdWallet.id))
                .then((rows) => rows[0] ?? null);
            expect(dbWallet).toBeDefined();
            expect(dbWallet!.userId).toBe(userId);
            expect(dbWallet!.currency).toBe('USDT');
            expect(dbWallet!.balance).toBe('0');

            // Test 2: Get wallets by user ID
            // First, check that we can retrieve the wallet we just created
            const initialWallets = await getWalletsByUserId(userId);
            expect(initialWallets.length).toBe(1);
            expect(initialWallets[0].currency).toBe('USDT');

            // Create another wallet
            const wallet2: NewWallet = {
                userId: userId,
                currency: 'JOD',
                balance: '50',
            };
            await createWallet(wallet2);

            // Now test the getWalletsByUserId function
            const userWallets = await getWalletsByUserId(userId);

            expect(userWallets).toBeDefined();
            expect(userWallets.length).toBe(2);
            expect(userWallets.some((w) => w.currency === 'USDT')).toBe(true);
            expect(userWallets.some((w) => w.currency === 'JOD')).toBe(true);

            // Test 3: Return an empty array if the user has no wallets
            // Generate a random valid UUID that doesn't exist in the database
            const nonExistentUserId = uuidv4();
            const emptyWallets = await getWalletsByUserId(nonExistentUserId);
            expect(emptyWallets).toEqual([]);

            // Test 4: Should not create wallets with duplicate user_id and currency
            const duplicateWallet: NewWallet = {
                userId: userId,
                currency: 'USDT', // Same as the first wallet
                balance: '0',
            };

            // This should throw an error due to the unique constraint
            await expect(createWallet(duplicateWallet)).rejects.toThrow();
        } finally {
            // Clean up the database after tests
            await db.delete(wallets);
            await db.delete(users);
        }
    });
});
