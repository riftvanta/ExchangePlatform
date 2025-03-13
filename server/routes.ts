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
import { eq, and, lt } from 'drizzle-orm';
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

        // Validate input
        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

        const authenticatedUser = await loginUser(email, password);

        // Store user ID in session
        req.session.userId = authenticatedUser.id;

        // Sanitize user data before sending response - exclude all sensitive fields
        const { password: _, salt, twoFactorSecret, ...userWithoutSensitiveData } = authenticatedUser;

        // Send success response with user data (excluding sensitive info)
        res.status(200).json({ 
            message: 'Login successful',
            user: userWithoutSensitiveData
        });
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
            const { rejectionReason } = req.body;

            // Validate input
            if (!rejectionReason) {
                return res.status(400).json({ error: 'Rejection reason is required' });
            }

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

            // Update transaction status
            await db
                .update(transactions)
                .set({ 
                    status: 'rejected', 
                    updatedAt: new Date(),
                    rejectionReason: rejectionReason || 'No reason provided'
                })
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

/**
 * USDT Withdrawal endpoint
 * Handles withdrawals of USDT from user wallet (requires admin approval)
 */
router.post('/withdraw/usdt', isAuthenticated, (async (
    req: Request,
    res: Response
) => {
    try {
        const userId = req.session.userId as string;
        const { amount, walletAddress } = req.body;

        // Validate input
        if (
            !amount ||
            typeof amount !== 'string' ||
            !/^\d+(\.\d+)?$/.test(amount)
        ) {
            return res.status(400).json({ error: 'Invalid amount' });
        }
        if (!walletAddress) {
            return res
                .status(400)
                .json({ error: 'Wallet address is required' });
        }

        // Get USDT wallet
        const userWallets = await getWalletsByUserId(userId);
        const usdtWallet = userWallets.find(
            (wallet) => wallet.currency === 'USDT'
        );

        if (!usdtWallet) {
            return res.status(400).json({ error: 'USDT wallet not found' });
        }

        // Check if user has sufficient balance
        const currentBalance = new Decimal(usdtWallet.balance);
        const withdrawAmount = new Decimal(amount);

        if (withdrawAmount.gt(currentBalance)) {
            return res.status(400).json({ error: 'Insufficient balance' });
        }

        // Generate a unique transaction hash for this withdrawal
        const transactionHash = `WITHDRAW-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;

        // Create a new transaction record
        const newTransaction: NewTransaction = {
            userId: userId,
            walletId: usdtWallet.id,
            type: 'withdrawal',
            currency: 'USDT',
            amount: amount,
            transactionHash: transactionHash,
            status: 'pending', // Initial status is 'pending'
            walletAddress: walletAddress, // Store the destination wallet address
        };

        const insertedTransaction = await db
            .insert(transactions)
            .values(newTransaction)
            .returning();

        // DO NOT UPDATE WALLET BALANCE HERE - Admin will approve first

        res.status(201).json({
            message: 'Withdrawal request submitted for approval',
            transaction: insertedTransaction[0],
        });
    } catch (error) {
        console.error('Withdrawal error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}) as RequestHandler);

/**
 * Get user's withdrawal requests
 */
router.get('/withdrawals', isAuthenticated, (async (
    req: Request,
    res: Response
) => {
    try {
        const userId = req.session.userId as string;
        
        const userWithdrawals = await db
            .select()
            .from(transactions)
            .where(
                and(
                    eq(transactions.userId, userId),
                    eq(transactions.type, 'withdrawal')
                )
            );
            
        res.status(200).json({ withdrawals: userWithdrawals });
    } catch (error) {
        console.error('Get withdrawals error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}) as RequestHandler);

/**
 * Get pending withdrawal transactions (admin only)
 */
router.get('/admin/withdrawals', isAuthenticated, isAdmin, (async (
    req: Request,
    res: Response
) => {
    try {
        const pendingWithdrawals = await db
            .select({
                transaction: transactions,
                availableBalance: wallets.balance,
            })
            .from(transactions)
            .leftJoin(wallets, eq(transactions.walletId, wallets.id))
            .where(
                and(
                    eq(transactions.type, 'withdrawal'),
                    eq(transactions.status, 'pending')
                )
            );

        // For each user with pending withdrawals, calculate the total pending amount
        const usersPendingTotals = new Map<string, Decimal>();

        // First pass: gather all pending withdrawal amounts by user
        pendingWithdrawals.forEach(({ transaction }) => {
            const userId = transaction.userId;
            const amount = new Decimal(transaction.amount);
            
            if (usersPendingTotals.has(userId)) {
                usersPendingTotals.set(userId, usersPendingTotals.get(userId)!.plus(amount));
            } else {
                usersPendingTotals.set(userId, amount);
            }
        });

        // Second pass: enhance each transaction with available balance after all pending withdrawals
        const enhancedWithdrawals = pendingWithdrawals.map(({ transaction, availableBalance }) => {
            const userId = transaction.userId;
            const totalPending = usersPendingTotals.get(userId) || new Decimal(0);
            const currentBalance = new Decimal(availableBalance || '0');
            const availableAfterPending = currentBalance.minus(totalPending).toString();
            
            // Check if this specific withdrawal can be approved based on current available balance
            // and considering all other pending withdrawals that would be processed before this one
            const pendingBeforeThis = pendingWithdrawals
                .filter(pw => 
                    pw.transaction.userId === userId && 
                    new Date(pw.transaction.createdAt) < new Date(transaction.createdAt)
                )
                .reduce((acc, curr) => acc.plus(new Decimal(curr.transaction.amount)), new Decimal(0));
            
            const availableForThis = currentBalance.minus(pendingBeforeThis);
            const canApprove = availableForThis.gte(new Decimal(transaction.amount));

            return {
                ...transaction,
                currentBalance: availableBalance,
                availableBalance: availableAfterPending,
                canApprove
            };
        });

        res.status(200).json({ withdrawals: enhancedWithdrawals });
    } catch (error) {
        console.error('Get pending withdrawals error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}) as RequestHandler);

/**
 * Approve a pending withdrawal transaction (admin only)
 */
router.post(
    '/admin/withdrawals/:transactionId/approve',
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

            // Check other pending withdrawals with earlier timestamps
            const earlierPendingWithdrawals = await db
                .select()
                .from(transactions)
                .where(
                    and(
                        eq(transactions.userId, transaction.userId),
                        eq(transactions.type, 'withdrawal'),
                        eq(transactions.status, 'pending'),
                        eq(transactions.currency, transaction.currency),
                        lt(transactions.createdAt, transaction.createdAt)
                    )
                );
            
            // Calculate total amount of earlier pending withdrawals
            const totalEarlierPending = earlierPendingWithdrawals.reduce(
                (total, tx) => total.plus(new Decimal(tx.amount)),
                new Decimal(0)
            );
            
            // Check if user has sufficient balance after accounting for earlier pending withdrawals
            const currentBalance = new Decimal(wallet.balance);
            const withdrawAmount = new Decimal(transaction.amount);
            const availableBalance = currentBalance.minus(totalEarlierPending);
            
            if (withdrawAmount.gt(availableBalance)) {
                return res.status(400).json({ 
                    error: 'Insufficient balance after considering earlier pending withdrawals',
                    availableBalance: availableBalance.toString(),
                    requestedAmount: withdrawAmount.toString()
                });
            }

            // Update wallet balance
            const newBalance = currentBalance.minus(withdrawAmount).toString();

            await db
                .update(wallets)
                .set({ balance: newBalance, updatedAt: new Date() })
                .where(eq(wallets.id, wallet.id));

            // Update transaction status
            await db
                .update(transactions)
                .set({ status: 'approved', updatedAt: new Date() })
                .where(eq(transactions.id, transactionId));

            res.status(200).json({ message: 'Withdrawal approved' });
        } catch (error) {
            console.error('Approve withdrawal error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }) as RequestHandler
);

/**
 * Reject a pending withdrawal transaction (admin only)
 */
router.post(
    '/admin/withdrawals/:transactionId/reject',
    isAuthenticated,
    isAdmin,
    (async (req: Request, res: Response) => {
        try {
            const { transactionId } = req.params;
            const { rejectionReason } = req.body;

            // Validate input
            if (!rejectionReason) {
                return res.status(400).json({ error: 'Rejection reason is required' });
            }

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

            // Update transaction status
            await db
                .update(transactions)
                .set({ 
                    status: 'rejected', 
                    updatedAt: new Date(),
                    rejectionReason: rejectionReason || 'No reason provided'
                })
                .where(eq(transactions.id, transactionId));

            res.status(200).json({ message: 'Withdrawal rejected' });
        } catch (error) {
            console.error('Reject withdrawal error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }) as RequestHandler
);

export default router;
