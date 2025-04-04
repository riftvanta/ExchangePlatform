import {
    Router,
    Request,
    Response,
    RequestHandler,
    NextFunction,
} from 'express';
import { registerUser, loginUser } from './auth';
import { NewUsers, Users, TransactionType, TransactionStatus } from '../shared/types';
import { getUserByEmail, getUserById } from './storage';
import { getWalletsByUserId, createWallet } from './storage/wallet';
import { NewWallet, transactions, NewTransaction } from '../shared/schema';
import Decimal from 'decimal.js';
import db from './db';
import { wallets } from '../shared/schema';
import { eq, and } from 'drizzle-orm';
import { isAdmin } from './middleware/isAdmin';
import { generateReadUrl } from './s3';
import { 
    verifyEmail, 
    createPasswordResetToken, 
    verifyPasswordResetToken,
    createEmailVerificationToken 
} from './email';
import { 
    sendVerificationConfirmationEmail, 
    sendPasswordResetEmail,
    sendPasswordResetConfirmationEmail,
    sendTransactionNotificationEmail,
    sendVerificationEmail
} from '../shared/email';
import { scryptSync, randomBytes } from 'crypto';
import { users } from '../shared/schema';
import depositAddressRouter from './routes/depositAddress'; // Import deposit address router
import socketService from './services/socketService';

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
 * Session validation endpoint
 * Validates if the user's session is active and refreshes it
 */
router.get('/validate-session', (async (req: Request, res: Response) => {
    try {
        // Check if userId exists in session
        if (!req.session.userId) {
            res.status(401).json({ 
                error: 'Not authenticated',
                isAuthenticated: false 
            });
            return;
        }

        // Get the user from the database
        const user = await getUserById(req.session.userId);

        // If user not found, clear session and return unauthorized
        if (!user) {
            req.session.destroy((err) => {
                if (err) {
                    console.error('Error destroying invalid session:', err);
                }
            });
            res.status(401).json({ 
                error: 'User not found',
                isAuthenticated: false 
            });
            return;
        }

        // Renew the session by touching it (session middleware will update expire time)
        req.session.touch();
        
        // Return success with sanitized user data
        const { password, salt, twoFactorSecret, ...userWithoutSensitiveData } = user;
        res.status(200).json({ 
            isAuthenticated: true,
            user: userWithoutSensitiveData
        });
    } catch (error) {
        console.error('Session validation error:', error);
        res.status(500).json({ 
            error: 'Internal server error',
            isAuthenticated: false 
        });
    }
}) as RequestHandler);

/**
 * Endpoint to fetch the current authenticated user
 */
router.get('/me', isAuthenticated, (async (req: Request, res: Response) => {
    try {
        // Get the user from the database
        const user = await getUserById(req.session.userId!);

        // If user not found, clear session and return unauthorized
        if (!user) {
            req.session.destroy((err) => {
                if (err) {
                    console.error('Error destroying invalid session:', err);
                }
            });
            return res.status(401).json({ error: 'User not found' });
        }

        // Return success with sanitized user data
        const { password, salt, twoFactorSecret, ...userWithoutSensitiveData } = user;
        res.json({ user: userWithoutSensitiveData });
    } catch (error) {
        console.error('Error fetching user data:', error);
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
        const { amount, transactionHash, fileKey, depositAddress } = req.body;

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

        // Verify deposit address if provided
        if (depositAddress) {
            const hdWalletService = (await import('./services/hdWalletService')).default;
            const isValidAddress = await hdWalletService.verifyAddressOwnership(
                depositAddress,
                userId
            );
            
            if (!isValidAddress) {
                return res.status(400).json({ 
                    error: 'Invalid deposit address for this user' 
                });
            }
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
            depositAddress: depositAddress, // Include the deposit address
        };

        const insertedTransaction = await db
            .insert(transactions)
            .values(newTransaction)
            .returning();

        // DO NOT UPDATE WALLET BALANCE HERE - Admin will approve first

        // Get user's email for notification
        const user = await getUserById(userId);
        
        if (user) {
            // Send email notification for pending deposit
            await sendTransactionNotificationEmail(
                user.email,
                'deposit',
                'pending',
                amount,
                'USDT'
            );
        }

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

        // Check if user has enough balance
        const currentBalance = new Decimal(usdtWallet.balance);
        const withdrawalAmount = new Decimal(amount);

        if (withdrawalAmount.greaterThan(currentBalance)) {
            return res.status(400).json({ error: 'Insufficient balance' });
        }

        // Create a new transaction record with 'pending' status
        // IMPORTANT: Do NOT deduct from wallet balance until admin approval
        const newTransaction: NewTransaction = {
            userId: userId,
            walletId: usdtWallet.id,
            type: 'withdrawal',
            currency: 'USDT',
            amount: amount,
            transactionHash: walletAddress, // Store wallet address in transactionHash field
            status: 'pending', // Initial status is 'pending'
        };

        const insertedTransaction = await db
            .insert(transactions)
            .values(newTransaction)
            .returning();

        // Get user's email for notification
        const user = await getUserById(userId);
        
        if (user) {
            // Send email notification for pending withdrawal
            await sendTransactionNotificationEmail(
                user.email,
                'withdrawal',
                'pending',
                amount,
                'USDT'
            );
        }

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
            .where(
                and(
                    eq(transactions.status, 'pending'),
                    eq(transactions.type, 'deposit')
                )
            );
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

            // Verify deposit address ownership if a deposit address is provided
            if (transaction.depositAddress) {
                const hdWalletService = (await import('./services/hdWalletService')).default;
                const isValidAddress = await hdWalletService.verifyAddressOwnership(
                    transaction.depositAddress,
                    transaction.userId
                );
                
                if (!isValidAddress) {
                    return res.status(400).json({ 
                        error: 'Invalid deposit address for this user' 
                    });
                }
                
                // Mark the address as used
                await hdWalletService.markAddressAsUsed(transaction.depositAddress);
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

            // Emit real-time update via Socket.IO
            socketService.emitTransactionUpdate(transaction.userId, {
                transactionId,
                status: 'approved',
                type: 'deposit',
                amount: transaction.amount,
                currency: transaction.currency,
                updatedAt: new Date()
            });

            // Get user's email for notification
            const user = await getUserById(transaction.userId);
            
            if (user) {
                // Send email notification
                await sendTransactionNotificationEmail(
                    user.email,
                    'deposit',
                    'approved',
                    transaction.amount,
                    transaction.currency
                );
            }

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

            // Update transaction status with rejection reason
            await db
                .update(transactions)
                .set({
                    status: 'rejected',
                    rejectionReason,
                    updatedAt: new Date(),
                })
                .where(eq(transactions.id, transactionId));

            // Emit real-time update via Socket.IO
            socketService.emitTransactionUpdate(transaction.userId, {
                transactionId,
                status: 'rejected',
                type: 'deposit',
                amount: transaction.amount,
                currency: transaction.currency,
                updatedAt: new Date(),
                rejectionReason
            });

            // Get user's email for notification
            const user = await getUserById(transaction.userId);
            
            if (user) {
                // Send email notification
                await sendTransactionNotificationEmail(
                    user.email,
                    'deposit',
                    'rejected',
                    transaction.amount,
                    transaction.currency,
                    rejectionReason
                );
            }

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
 * Email verification endpoint
 * Verifies a user's email with the provided token
 */
router.get('/verify-email', (async (req: Request, res: Response) => {
    try {
        const token = req.query.token as string;

        if (!token) {
            return res.status(400).json({ error: 'Verification token is required' });
        }

        const verified = await verifyEmail(token);

        if (!verified) {
            return res.status(400).json({ 
                error: 'Invalid or expired verification token' 
            });
        }

        // Email has been verified successfully
        res.status(200).json({ 
            message: 'Email verified successfully' 
        });
    } catch (error) {
        console.error('Email verification error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}) as RequestHandler);

/**
 * Resend verification email endpoint
 */
router.post('/resend-verification', isAuthenticated, (async (req: Request, res: Response) => {
    try {
        const userId = req.session.userId!;
        
        // Get user details
        const user = await getUserById(userId);
        
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        // Check if user's email is already verified
        const userRecord = await db.select()
            .from(users)
            .where(eq(users.id, userId))
            .then(results => results[0]);
            
        if (userRecord.emailVerified) {
            return res.status(400).json({ 
                error: 'Email is already verified' 
            });
        }
        
        // Generate and store a new verification token
        const verificationToken = await createEmailVerificationToken(userId);
        
        // Send verification email
        await sendVerificationEmail(
            user.email,
            verificationToken,
            user.firstName || undefined
        );
        
        res.status(200).json({ 
            message: 'Verification email sent' 
        });
    } catch (error) {
        console.error('Resend verification error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}) as RequestHandler);

/**
 * Request password reset endpoint
 */
router.post('/forgot-password', (async (req: Request, res: Response) => {
    try {
        const { email } = req.body;
        
        if (!email) {
            return res.status(400).json({ error: 'Email is required' });
        }
        
        // Find user by email
        const user = await getUserByEmail(email);
        
        // We don't want to reveal if an email exists in our database for security reasons
        // So we return a success message even if the email doesn't exist
        if (!user) {
            return res.status(200).json({ 
                message: 'If your email exists in our system, you will receive a password reset link shortly' 
            });
        }
        
        // Generate and store a password reset token
        const resetToken = await createPasswordResetToken(user.id);
        
        // Send password reset email
        await sendPasswordResetEmail(email, resetToken);
        
        res.status(200).json({ 
            message: 'If your email exists in our system, you will receive a password reset link shortly' 
        });
    } catch (error) {
        console.error('Password reset request error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}) as RequestHandler);

/**
 * Reset password endpoint
 */
router.post('/reset-password', (async (req: Request, res: Response) => {
    try {
        const { token, password } = req.body;
        
        if (!token || !password) {
            return res.status(400).json({ 
                error: 'Token and password are required' 
            });
        }
        
        // Verify reset token and get user ID
        const userId = await verifyPasswordResetToken(token);
        
        if (!userId) {
            return res.status(400).json({ 
                error: 'Invalid or expired reset token' 
            });
        }
        
        // Get user details
        const user = await getUserById(userId);
        
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        // Generate a new salt
        const salt = randomBytes(16).toString('hex');
        
        // Hash the new password with the salt
        const hashedPassword = scryptSync(password, salt, 64).toString('hex');
        
        // Update user with new password and clear reset token
        await db.update(users)
            .set({
                password: hashedPassword,
                salt: salt,
                resetPasswordToken: null,
                resetPasswordExpiry: null
            })
            .where(eq(users.id, userId));
        
        // Send password reset confirmation email
        await sendPasswordResetConfirmationEmail(user.email);
        
        res.status(200).json({ 
            message: 'Password reset successfully' 
        });
    } catch (error) {
        console.error('Password reset error:', error);
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
        // Fetch all pending withdrawal transactions
        const pendingWithdrawals = await db
            .select()
            .from(transactions)
            .where(
                and(
                    eq(transactions.status, 'pending'),
                    eq(transactions.type, 'withdrawal')
                )
            )
            .orderBy(transactions.createdAt);

        // Group transactions by user for processing
        const withdrawalsByUser = pendingWithdrawals.reduce((acc, withdrawal) => {
            if (!acc[withdrawal.userId]) {
                acc[withdrawal.userId] = [];
            }
            acc[withdrawal.userId].push(withdrawal);
            return acc;
        }, {} as Record<string, typeof pendingWithdrawals>);

        // Enhance withdrawals with wallet data and approval status
        const enhancedWithdrawals = [];
        
        for (const userId in withdrawalsByUser) {
            const userWithdrawals = withdrawalsByUser[userId];
            
            // Get user's wallets
            const userWallets = await getWalletsByUserId(userId);
            
            // Calculate running balance for each transaction
            let runningBalance = new Decimal(0);
            
            // Find USDT wallet for the user
            const usdtWallet = userWallets.find(wallet => wallet.currency === 'USDT');
            
            if (usdtWallet) {
                // Start with current wallet balance
                runningBalance = new Decimal(usdtWallet.balance);
                
                // Sort withdrawals by creation date (oldest first)
                const sortedWithdrawals = [...userWithdrawals].sort((a, b) => 
                    new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
                );
                
                // Process each withdrawal to determine if it can be approved
                for (const withdrawal of sortedWithdrawals) {
                    const withdrawalAmount = new Decimal(withdrawal.amount);
                    const currentBalance = runningBalance.toString();
                    const canApprove = runningBalance.greaterThanOrEqualTo(withdrawalAmount);
                    
                    // After checking if we can approve, subtract from running balance
                    if (canApprove) {
                        runningBalance = runningBalance.minus(withdrawalAmount);
                    }
                    
                    // Add enhanced data to the withdrawal
                    enhancedWithdrawals.push({
                        ...withdrawal,
                        currentBalance: usdtWallet.balance,
                        availableBalance: runningBalance.toString(),
                        canApprove,
                        walletAddress: withdrawal.transactionHash  // The address is stored in transactionHash
                    });
                }
            } else {
                // If USDT wallet not found, mark all withdrawals as not approvable
                for (const withdrawal of userWithdrawals) {
                    enhancedWithdrawals.push({
                        ...withdrawal,
                        currentBalance: '0',
                        availableBalance: '0',
                        canApprove: false,
                        walletAddress: withdrawal.transactionHash
                    });
                }
            }
        }
        
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
            
            // Get user's USDT wallet
            const userWallets = await getWalletsByUserId(transaction.userId);
            const wallet = userWallets.find(w => w.currency === 'USDT');
            
            if (!wallet) {
                return res.status(400).json({ error: 'User\'s USDT wallet not found' });
            }
            
            // Check if wallet has sufficient balance
            const currentBalance = new Decimal(wallet.balance);
            const withdrawalAmount = new Decimal(transaction.amount);
            
            if (withdrawalAmount.greaterThan(currentBalance)) {
                return res.status(400).json({ error: 'Insufficient funds in user\'s wallet' });
            }

            // NOW deduct the amount from the wallet (only after admin approval)
            const newBalance = currentBalance.minus(withdrawalAmount).toString();
            await db
                .update(wallets)
                .set({ balance: newBalance, updatedAt: new Date() })
                .where(eq(wallets.id, wallet.id));

            // Update transaction status
            await db
                .update(transactions)
                .set({ status: 'approved', updatedAt: new Date() })
                .where(eq(transactions.id, transactionId));

            // Emit real-time update via Socket.IO
            socketService.emitTransactionUpdate(transaction.userId, {
                transactionId,
                status: 'approved',
                type: 'withdrawal',
                amount: transaction.amount,
                currency: transaction.currency,
                updatedAt: new Date()
            });

            // Get user's email for notification
            const user = await getUserById(transaction.userId);
            
            if (user) {
                // Send email notification
                await sendTransactionNotificationEmail(
                    user.email,
                    'withdrawal',
                    'approved',
                    transaction.amount,
                    transaction.currency
                );
            }

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

            // Validate rejectionReason
            if (!rejectionReason) {
                return res
                    .status(400)
                    .json({ error: 'Rejection reason is required' });
            }

            // Get the user's wallet for notification purposes only
            const userWallets = await getWalletsByUserId(transaction.userId);
            const wallet = userWallets.find(
                (w) => w.id === transaction.walletId
            );

            if (!wallet) {
                return res.status(400).json({ error: 'Wallet not found' });
            }

            // No need to modify the wallet balance since funds were never deducted
            // for pending withdrawals - they're only deducted upon approval

            // Update transaction status with rejection reason
            await db
                .update(transactions)
                .set({
                    status: 'rejected',
                    rejectionReason,
                    updatedAt: new Date(),
                })
                .where(eq(transactions.id, transactionId));

            // Emit real-time update via Socket.IO
            socketService.emitTransactionUpdate(transaction.userId, {
                transactionId,
                status: 'rejected',
                type: 'withdrawal',
                amount: transaction.amount,
                currency: transaction.currency,
                updatedAt: new Date(),
                rejectionReason
            });

            // Get user's email for notification
            const user = await getUserById(transaction.userId);
            
            if (user) {
                // Send email notification
                await sendTransactionNotificationEmail(
                    user.email,
                    'withdrawal',
                    'rejected',
                    transaction.amount,
                    transaction.currency,
                    rejectionReason
                );
            }

            res.status(200).json({ 
                message: 'Withdrawal rejected', 
                details: {
                    transactionId,
                    amount: transaction.amount,
                    currency: transaction.currency,
                    userId: transaction.userId,
                    rejectionReason: rejectionReason
                }
            });
        } catch (error) {
            console.error('Reject withdrawal error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }) as RequestHandler
);

/**
 * Cancel a pending transaction (user can only cancel their own pending transactions)
 */
router.post('/transactions/:transactionId/cancel', isAuthenticated, (async (req: Request, res: Response) => {
    try {
        const { transactionId } = req.params;
        const userId = req.session.userId as string;

        // Find the transaction
        const transaction = await db
            .select()
            .from(transactions)
            .where(eq(transactions.id, transactionId))
            .then((rows) => rows[0] ?? null);

        if (!transaction) {
            return res.status(404).json({ error: 'Transaction not found' });
        }

        // Verify ownership - users can only cancel their own transactions
        if (transaction.userId !== userId) {
            return res.status(403).json({ error: 'You can only cancel your own transactions' });
        }

        // Check if the transaction is pending
        if (transaction.status !== 'pending') {
            return res.status(400).json({ error: 'Only pending transactions can be cancelled' });
        }

        // Update transaction status to cancelled
        await db
            .update(transactions)
            .set({ 
                status: 'cancelled' as const, 
                updatedAt: new Date(),
                rejectionReason: 'Cancelled by user'
            })
            .where(eq(transactions.id, transactionId));

        // Emit real-time update via Socket.IO
        socketService.emitTransactionUpdate(userId, {
            transactionId,
            status: 'cancelled',
            type: transaction.type,
            amount: transaction.amount,
            currency: transaction.currency,
            updatedAt: new Date(),
            rejectionReason: 'Cancelled by user'
        });

        // Get user's email for notification
        const user = await getUserById(userId);
        
        if (user) {
            // Send email notification
            await sendTransactionNotificationEmail(
                user.email,
                transaction.type as 'deposit' | 'withdrawal',
                'cancelled',
                transaction.amount,
                transaction.currency,
                'Cancelled by user'
            );
        }

        res.status(200).json({ 
            message: `${transaction.type.charAt(0).toUpperCase() + transaction.type.slice(1)} cancelled successfully`,
            details: {
                transactionId,
                amount: transaction.amount,
                currency: transaction.currency,
                type: transaction.type
            }
        });
    } catch (error) {
        console.error('Cancel transaction error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}) as RequestHandler);

/**
 * Health check endpoint for Docker and monitoring
 */
router.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok', time: new Date().toISOString() });
});

/**
 * Register the deposit address router
 * This provides endpoints for creating and managing unique deposit addresses
 */
router.use('/deposit-address', depositAddressRouter);

export default router;
