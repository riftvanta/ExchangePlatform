import {
    pgTable,
    uuid,
    text,
    timestamp,
    boolean,
    varchar,
    jsonb,
    unique,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

/**
 * Users table schema
 * Defines the structure for storing user information
 */
export const users = pgTable('users', {
    id: uuid('id').primaryKey().defaultRandom(),
    email: text('email').notNull().unique(),
    password: text('password').notNull(),
    salt: text('salt').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true })
        .notNull()
        .defaultNow(),
    twoFactorEnabled: boolean('two_factor_enabled').notNull().default(false),
    twoFactorSecret: text('two_factor_secret'),
    firstName: text('first_name'),
    lastName: text('last_name'),
    isAdmin: boolean('is_admin').notNull().default(false),
    emailVerified: boolean('email_verified').notNull().default(false),
    verificationToken: text('verification_token'),
    verificationTokenExpiry: timestamp('verification_token_expiry', { withTimezone: true }),
    resetPasswordToken: text('reset_password_token'),
    resetPasswordExpiry: timestamp('reset_password_expiry', { withTimezone: true }),
});

// Create a session table for connect-pg-simple
export const sessions = pgTable('sessions', {
    sid: varchar('sid').primaryKey(),
    sess: jsonb('sess').notNull(),
    expire: timestamp('expire', { mode: 'date' }).notNull(),
});

/**
 * Wallets table schema
 * Defines the structure for storing user wallet information
 */
export const wallets = pgTable(
    'wallets',
    {
        id: uuid('id').primaryKey().defaultRandom(),
        userId: uuid('user_id')
            .notNull()
            .references(() => users.id),
        currency: text('currency').notNull(),
        balance: text('balance').notNull(),
        createdAt: timestamp('created_at', { withTimezone: true })
            .notNull()
            .defaultNow(),
        updatedAt: timestamp('updated_at', { withTimezone: true })
            .notNull()
            .defaultNow(),
    },
    (table) => {
        return {
            userCurrencyUnique: unique('user_currency_unique').on(
                table.userId,
                table.currency
            ),
        };
    }
);

/**
 * Transactions table schema
 * Defines the structure for storing transaction information
 */
export const transactions = pgTable('transactions', {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
        .notNull()
        .references(() => users.id),
    walletId: uuid('wallet_id')
        .notNull()
        .references(() => wallets.id),
    type: text('type').notNull(), // e.g., 'deposit', 'withdrawal'
    currency: text('currency').notNull(),
    amount: text('amount').notNull(),
    transactionHash: text('transaction_hash').notNull(),
    status: text('status').notNull().default('pending'), // 'pending', 'approved', 'rejected'
    createdAt: timestamp('created_at', { withTimezone: true })
        .notNull()
        .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
        .notNull()
        .defaultNow(),
    fileKey: text('file_key'),
    rejectionReason: text('rejection_reason'),
});

export const usersRelations = relations(users, ({ many }) => ({
    wallets: many(wallets),
    transactions: many(transactions),
}));

export const walletsRelations = relations(wallets, ({ one, many }) => ({
    user: one(users, {
        fields: [wallets.userId],
        references: [users.id],
    }),
    transactions: many(transactions),
}));

export const transactionsRelations = relations(transactions, ({ one }) => ({
    user: one(users, {
        fields: [transactions.userId],
        references: [users.id],
    }),
    wallet: one(wallets, {
        fields: [transactions.walletId],
        references: [wallets.id],
    }),
}));

// Type definitions
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Wallet = typeof wallets.$inferSelect;
export type NewWallet = typeof wallets.$inferInsert;
export type Transaction = typeof transactions.$inferSelect;
export type NewTransaction = typeof transactions.$inferInsert;

export default users;
