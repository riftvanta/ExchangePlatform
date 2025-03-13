import {
    Router,
    Request,
    Response,
    RequestHandler,
    NextFunction,
} from 'express';
import { registerUser, loginUser } from './auth';
import { NewUsers, Users } from '../shared/types';
import { getUserByEmail, getUserById } from './storage';
import { getWalletsByUserId, createWallet } from './storage/wallet';
import { NewWallet, transactions, NewTransaction } from '../shared/schema';
import Decimal from 'decimal.js';
import db from './db';
import { wallets } from '../shared/schema';
import { eq } from 'drizzle-orm';
import { isAdmin } from './middleware/isAdmin';
import { generateReadUrl } from './s3';

const router = Router();

/**
 * Middleware to check if user is authenticated
 */
const isAuthenticated = (async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    if (req.session.userId) {
        return next();
    }
    return res.status(401).json({ error: 'Authentication required' });
}) as RequestHandler;

/**
 * User registration endpoint
 * Creates a new user account
 */
router.post('/register', (async (req: Request, res: Response) => {
    try {
        // Get the request body and parse it to NewUsers type
        const userData = req.body as NewUsers;

        // Register the user
        const createdUser = await registerUser(userData);

        // Set session userId after successful registration
        req.session.userId = createdUser.id;

        // Send success response with sanitized user data
        const { password, salt, ...userWithoutSensitiveData } = createdUser;
        res.status(201).json({ user: userWithoutSensitiveData });
    } catch (error: any) {
        // Handle specific errors
        if (error.message === 'Email already registered') {
            return res.status(409).json({ error: 'Email already registered' });
        }

        // Handle any other errors
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}) as RequestHandler);

/**
 * User login endpoint
 * Authenticates a user and returns a success message
 */
router.post('/login', (async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body;

        const authenticatedUser = await loginUser(email, password);

        // Store user ID in session
        req.session.userId = authenticatedUser.id;

        // Send success response without user data
        res.status(200).json({ message: 'Login successful' });
    } catch (error: any) {
        if (error.message === 'Invalid credentials') {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        console.error('Login error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}) as RequestHandler);

/**
 * User logout endpoint
 * Destroys the session
 */
router.post('/logout', (async (req: Request, res: Response) => {
    req.session.destroy((err) => {
        if (err) {
            console.error('Logout error:', err);
            return res.status(500).json({ error: 'Internal server error' });
        }

        res.clearCookie('connect.sid');
        res.status(200).json({ message: 'Logged out successfully' });
    });
}) as RequestHandler);

/**
 * Get current user endpoint
 * Returns the currently authenticated user
 */
router.get('/me', isAuthenticated, (async (req: Request, res: Response) => {
    try {
        const userId = req.session.userId;
        const user = await getUserById(userId!);

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Send response with sanitized user data
        const { password, salt, ...userWithoutSensitiveData } = user;

        res.status(200).json({ user: userWithoutSensitiveData });
    } catch (error) {
        console.error('Get current user error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}) as RequestHandler);

/**
 * Get user wallets
 * Returns all wallets for the authenticated user
 */
router.get('/wallet', isAuthenticated, (async (req: Request, res: Response) => {
    try {
        const userId = req.session.userId as string; // Get userId from session
        const userWallets = await getWalletsByUserId(userId);
        res.status(200).json({ wallets: userWallets });
    } catch (error) {
        console.error('Get wallets error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}) as RequestHandler);

/**
 * Create a new wallet for the authenticated user
 */
router.post('/wallet', isAuthenticated, (async (
    req: Request,
    res: Response
) => {
    try {
        const userId = req.session.userId as string;
        const { currency } = req.body;

        // Validate input
        if (!currency) {
            return res.status(400).json({ error: 'Currency is required' });
        }

        if (currency !== 'USDT' && currency !== 'JOD') {
            return res.status(400).json({ error: 'Invalid currency' });
        }

        // Create new wallet object
        const newWallet: NewWallet = {
            userId: userId,
            currency: currency,
            balance: '0', // Initialize new wallets with a balance of 0
        };

        // Create wallet in database
        const createdWallet = await createWallet(newWallet);

        // Return created wallet
        res.status(201).json({ wallet: createdWallet });
    } catch (error: any) {
        console.error('Create wallet error:', error);
        if (
            error.message &&
            error.message.includes(
                'duplicate key value violates unique constraint'
            ) &&
            error.message.includes('user_currency_unique')
        ) {
            return res
                .status(409)
                .json({ error: 'Wallet already exists for this currency' });
        }

        res.status(500).json({ error: 'Internal server error' });
    }
}) as RequestHandler);

/**
 * USDT Deposit endpoint
 * Handles deposits of USDT into user wallet (requires admin approval)
 */
router.post('/deposit/usdt', isAuthenticated, (async (
    req: Request,
    res: Response
) => {
    try {
        const userId = req.session.userId as string;
        const { amount, transactionHash, fileKey } = req.body;

        // Validate input
        if (
            !amount ||
            typeof amount !== 'string' ||
            !/^\d+(\.\d+)?$/.test(amount)
        ) {
            return res.status(400).json({ error: 'Invalid amount' });
        }
        if (!transactionHash) {
            return res
                .status(400)
                .json({ error: 'Transaction hash is required' });
        }
        if (!fileKey) {
            return res.status(400).json({ error: 'File key is required' });
        }

        // Get USDT wallet
        const userWallets = await getWalletsByUserId(userId);
        const usdtWallet = userWallets.find(
            (wallet) => wallet.currency === 'USDT'
        );

        if (!usdtWallet) {
            return res.status(400).json({ error: 'USDT wallet not found' });
        }

        // Create a new transaction record
        const newTransaction: NewTransaction = {
            userId: userId,
            walletId: usdtWallet.id,
            type: 'deposit',
            currency: 'USDT',
            amount: amount,
            transactionHash: transactionHash,
            status: 'pending', // Initial status is 'pending'
            fileKey: fileKey,
        };

        const insertedTransaction = await db
            .insert(transactions)
            .values(newTransaction)
            .returning();

        // DO NOT UPDATE WALLET BALANCE HERE - Admin will approve first

        res.status(201).json({
            message: 'Deposit request submitted for approval',
            transaction: insertedTransaction[0],
        });
    } catch (error) {
        console.error('Deposit error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}) as RequestHandler);

/**
 * Get pending deposit transactions (admin only)
 */
router.get('/admin/deposits', isAuthenticated, isAdmin, (async (
    req: Request,
    res: Response
) => {
    try {
        const pendingDeposits = await db
            .select()
            .from(transactions)
            .where(eq(transactions.status, 'pending'));
        res.status(200).json({ deposits: pendingDeposits });
    } catch (error) {
        console.error('Get pending deposits error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}) as RequestHandler);

/**
 * Approve a pending deposit transaction (admin only)
 */
router.post(
    '/admin/deposits/:transactionId/approve',
    isAuthenticated,
    isAdmin,
    (async (req: Request, res: Response) => {
        try {
            const { transactionId } = req.params;

            // Find the transaction
            const transaction = await db
                .select()
                .from(transactions)
                .where(eq(transactions.id, transactionId))
                .then((rows) => rows[0] ?? null);

            if (!transaction) {
                return res.status(404).json({ error: 'Transaction not found' });
            }

            // Check if the transaction is pending
            if (transaction.status !== 'pending') {
                return res
                    .status(400)
                    .json({ error: 'Transaction is not pending' });
            }

            // Get the user's wallet
            const userWallets = await getWalletsByUserId(transaction.userId);
            const wallet = userWallets.find(
                (w) => w.currency === transaction.currency
            );

            if (!wallet) {
                return res.status(400).json({ error: 'Wallet not found' });
            }

            // Update wallet balance
            const currentBalance = new Decimal(wallet.balance);
            const depositAmount = new Decimal(transaction.amount);
            const newBalance = currentBalance.plus(depositAmount).toString();

            await db
                .update(wallets)
                .set({ balance: newBalance, updatedAt: new Date() })
                .where(eq(wallets.id, wallet.id));

            // Update transaction status
            await db
                .update(transactions)
                .set({ status: 'approved', updatedAt: new Date() })
                .where(eq(transactions.id, transactionId));

            res.status(200).json({ message: 'Deposit approved' });
        } catch (error) {
            console.error('Approve deposit error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }) as RequestHandler
);

/**
 * Reject a pending deposit transaction (admin only)
 */
router.post(
    '/admin/deposits/:transactionId/reject',
    isAuthenticated,
    isAdmin,
    (async (req: Request, res: Response) => {
        try {
            const { transactionId } = req.params;
            const { rejectionReason } = req.body; // Get rejectionReason from body

            // Find the transaction
            const transaction = await db
                .select()
                .from(transactions)
                .where(eq(transactions.id, transactionId))
                .then((rows) => rows[0] ?? null);

            if (!transaction) {
                return res.status(404).json({ error: 'Transaction not found' });
            }

            // Check if the transaction is pending
            if (transaction.status !== 'pending') {
                return res
                    .status(400)
                    .json({ error: 'Transaction is not pending' });
            }

            // Validate rejectionReason if status is rejected
            if (!rejectionReason) {
                return res
                    .status(400)
                    .json({ error: 'Rejection reason is required' });
            }

            // Update transaction status and rejectionReason
            await db
                .update(transactions)
                .set({
                    status: 'rejected',
                    updatedAt: new Date(),
                    rejectionReason: rejectionReason,
                }) // Set rejectionReason
                .where(eq(transactions.id, transactionId));

            res.status(200).json({ message: 'Deposit rejected' });
        } catch (error) {
            console.error('Reject deposit error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }) as RequestHandler
);

/**
 * Get user transactions
 * Returns all transactions for the authenticated user
 */
router.get('/transactions', isAuthenticated, (async (
    req: Request,
    res: Response
) => {
    try {
        const userId = req.session.userId as string;
        const userTransactions = await db
            .select()
            .from(transactions)
            .where(eq(transactions.userId, userId));
        res.status(200).json({ transactions: userTransactions });
    } catch (error) {
        console.error('Get transactions error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}) as RequestHandler);

/**
 * Get presigned URL for deposit image (admin only)
 */
router.get(
    '/admin/deposits/:transactionId/image',
    isAuthenticated,
    isAdmin,
    (async (req: Request, res: Response) => {
        try {
            const { transactionId } = req.params;

            // Find the transaction
            const transaction = await db
                .select()
                .from(transactions)
                .where(eq(transactions.id, transactionId))
                .then((rows) => rows[0] ?? null);

            if (!transaction) {
                return res.status(404).json({ error: 'Transaction not found' });
            }

            // Check if fileKey exists
            if (!transaction.fileKey) {
                return res
                    .status(404)
                    .json({ error: 'No image found for this transaction' });
            }

            // Generate presigned URL for reading the image
            const presignedUrl = await generateReadUrl(transaction.fileKey);

            res.status(200).json({ imageUrl: presignedUrl });
        } catch (error) {
            console.error('Get deposit image error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }) as RequestHandler
);

export default router;
