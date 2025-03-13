import request from 'supertest';
import { registerUser, loginUser } from '../auth'; // Import auth functions
import { NewUsers } from '../../shared/types';
import { getUserByEmail, createUser } from '../storage'; // Import storage functions
import * as appModule from '../index'; // Import the Express app
import { users, wallets, transactions, NewWallet } from '../../shared/schema';
import db from '../db';
import { createWallet, getWalletsByUserId } from '../storage/wallet';
import { eq } from 'drizzle-orm';

// Mock the sendgrid functions to avoid real emails during testing.
jest.mock('../../shared/email', () => ({
    sendWelcomeEmail: jest.fn(),
    sendPasswordResetEmail: jest.fn(),
    sendPasswordResetConfirmationEmail: jest.fn(),
}));

// Get the Express app from the imported module
const app = (appModule as any).default || appModule;

describe('Authentication Tests', () => {
    // Before each test, clear the database tables and reset the mock functions.
    beforeEach(async () => {
        // Delete transactions first (due to foreign key constraint)
        await db.delete(transactions);
        // Delete wallets next (due to foreign key constraint)
        await db.delete(wallets);
        // Then delete users
        await db.delete(users);
        jest.clearAllMocks();
    });

    // After all tests, clean up
    afterAll(async () => {
        // Delete transactions first (due to foreign key constraint)
        await db.delete(transactions);
        // Delete wallets next (due to foreign key constraint)
        await db.delete(wallets);
        // Then delete users
        await db.delete(users);

        // Give some time for connections to close
        await new Promise<void>((resolve) => {
            setTimeout(() => {
                resolve();
            }, 500);
        });
    });

    it('should register a new user successfully', async () => {
        const newUser = {
            email: 'test@example.com',
            password: 'password123',
        };

        const response = await request(app).post('/api/register').send(newUser);

        expect(response.statusCode).toBe(201);
        expect(response.body.user.email).toBe(newUser.email);
        expect(response.body.user.password).toBeUndefined(); // Password should not be returned
        expect(response.body.user.salt).toBeUndefined(); // Salt should not be returned

        // Verify user exists in the database
        const createdUser = await getUserByEmail(newUser.email);
        expect(createdUser).not.toBeNull();
        expect(createdUser!.email).toBe(newUser.email);
        expect(createdUser!.password).not.toBe(newUser.password); // Stored password should be hashed
    });

    it('should fail to register with an existing email', async () => {
        // First, register a user
        const newUser = {
            email: 'test@example.com',
            password: 'password123',
        };
        await registerUser(newUser as NewUsers);

        // Try to register again with the same email
        const response = await request(app).post('/api/register').send(newUser);

        expect(response.statusCode).toBe(409);
        expect(response.body.error).toBe('Email already registered');
    });

    it('should log in an existing user successfully', async () => {
        // First, register a user
        const newUser = {
            email: 'test@example.com',
            password: 'password123',
        };
        await registerUser(newUser as NewUsers);
        // Then try to log in
        const response = await request(app).post('/api/login').send(newUser);
        expect(response.statusCode).toBe(200);
        expect(response.body.message).toBe('Login successful');
    });

    it('should fail to log in with incorrect credentials', async () => {
        // First, register a user
        const newUser = {
            email: 'test@example.com',
            password: 'password123',
        };
        await registerUser(newUser as NewUsers);

        // Try to log in with incorrect password
        const response = await request(app).post('/api/login').send({
            email: 'test@example.com',
            password: 'wrongpassword',
        });

        expect(response.statusCode).toBe(401);
        expect(response.body.error).toBe('Invalid credentials');
    });
});

describe('Wallet API Tests', () => {
    let userId: string;
    // Before each test, clear the database and reset the mock functions.
    beforeEach(async () => {
        await db.delete(transactions);
        await db.delete(wallets);
        await db.delete(users);
        jest.clearAllMocks();

        // Create a test user
        const testUser = await registerUser({
            email: 'testuser@example.com',
            password: 'password123',
        } as NewUsers);
        userId = testUser.id;
    });

    // After all tests, close the database connection
    afterAll(async () => {
        await db.delete(transactions);
        await db.delete(wallets);
        await db.delete(users);
    });

    it('should get wallet balances for an authenticated user', async () => {
        // Create a wallet for the user
        const newWallet: NewWallet = {
            userId: userId,
            currency: 'USDT',
            balance: '100',
        };
        await createWallet(newWallet);

        // Log in the user (to establish a session)
        const loginResponse = await request(app)
            .post('/api/login')
            .send({ email: 'testuser@example.com', password: 'password123' });
        expect(loginResponse.statusCode).toBe(200);

        // Get the session cookie
        const cookie = loginResponse.headers['set-cookie'];

        // Make a request to /api/wallet with the cookie
        const response = await request(app)
            .get('/api/wallet')
            .set('Cookie', cookie); // Include the cookie

        expect(response.statusCode).toBe(200);
        expect(response.body.wallets).toBeDefined();
        expect(response.body.wallets.length).toBe(1);
        expect(response.body.wallets[0].currency).toBe('USDT');
        expect(response.body.wallets[0].balance).toBe('100');
    });

    it('should return 401 for unauthenticated user accessing /api/wallet', async () => {
        const response = await request(app).get('/api/wallet');
        expect(response.statusCode).toBe(401);
    });

    it('should create a new wallet for an authenticated user', async () => {
        // Log in the user
        const loginResponse = await request(app)
            .post('/api/login')
            .send({ email: 'testuser@example.com', password: 'password123' });
        const cookie = loginResponse.headers['set-cookie'];
        // Make a request to /api/wallet with the cookie
        const response = await request(app)
            .post('/api/wallet')
            .set('Cookie', cookie)
            .send({ currency: 'JOD' });

        expect(response.statusCode).toBe(201);
        expect(response.body.wallet).toBeDefined();
        expect(response.body.wallet.currency).toBe('JOD');
        expect(response.body.wallet.balance).toBe('0');

        // Verify that the wallet exists in the database
        const dbWallets = await getWalletsByUserId(userId);
        expect(dbWallets.some((w) => w.currency === 'JOD')).toBe(true);
    });

    it('should return 400 for missing currency when creating a wallet', async () => {
        // Log in the user
        const loginResponse = await request(app)
            .post('/api/login')
            .send({ email: 'testuser@example.com', password: 'password123' });
        const cookie = loginResponse.headers['set-cookie'];
        const response = await request(app)
            .post('/api/wallet')
            .set('Cookie', cookie)
            .send({}); // No currency provided

        expect(response.statusCode).toBe(400);
        expect(response.body.error).toBe('Currency is required');
    });

    it('should return 400 for invalid currency when creating a wallet', async () => {
        // Log in the user
        const loginResponse = await request(app)
            .post('/api/login')
            .send({ email: 'testuser@example.com', password: 'password123' });
        const cookie = loginResponse.headers['set-cookie'];
        const response = await request(app)
            .post('/api/wallet')
            .set('Cookie', cookie)
            .send({ currency: 'INVALID' });

        expect(response.statusCode).toBe(400);
        expect(response.body.error).toBe('Invalid currency');
    });

    it('should return 409 for an attempt of creating a duplicate wallet', async () => {
        // Log in the user
        const loginResponse = await request(app)
            .post('/api/login')
            .send({ email: 'testuser@example.com', password: 'password123' });
        const cookie = loginResponse.headers['set-cookie'];

        const newWallet: NewWallet = {
            userId: userId,
            currency: 'USDT',
            balance: '0',
        };
        await createWallet(newWallet);

        const response = await request(app)
            .post('/api/wallet')
            .set('Cookie', cookie)
            .send({ currency: 'USDT' });

        expect(response.statusCode).toBe(409);
    });
});

describe('Deposit API Tests', () => {
    let userId: string;
    let cookie: string;
    // Before each test, clear the database and reset the mock functions.
    beforeEach(async () => {
        await db.delete(transactions);
        await db.delete(wallets);
        await db.delete(users);
        jest.clearAllMocks();

        // Create a test user
        const testUser = await registerUser({
            email: 'testuser@example.com',
            password: 'password123',
        } as NewUsers);
        userId = testUser.id;

        // Create a USDT wallet for the user
        const newWallet: NewWallet = {
            userId: userId,
            currency: 'USDT',
            balance: '0',
        };
        await createWallet(newWallet);

        // Log in the user (to establish a session)
        const loginResponse = await request(app)
            .post('/api/login')
            .send({ email: 'testuser@example.com', password: 'password123' });
        cookie = loginResponse.headers['set-cookie'];
    });

    // After all tests, close the database connection
    afterAll(async () => {
        await db.delete(transactions);
        await db.delete(wallets);
        await db.delete(users);
    });

    it('should submit a deposit request for approval', async () => {
        const depositData = {
            amount: '100',
            transactionHash: 'test_transaction_hash',
            fileKey: 'test_file_key',
        };

        const response = await request(app)
            .post('/api/deposit/usdt')
            .set('Cookie', cookie)
            .send(depositData);

        expect(response.statusCode).toBe(201);
        expect(response.body.message).toBe(
            'Deposit request submitted for approval'
        );

        // Verify that a transaction record was created with status 'pending'
        const transactionRecords = await db
            .select()
            .from(transactions)
            .where(eq(transactions.userId, userId));
        expect(transactionRecords.length).toBe(1);
        expect(transactionRecords[0].status).toBe('pending');
        expect(transactionRecords[0].amount).toBe('100');
        expect(transactionRecords[0].transactionHash).toBe(
            'test_transaction_hash'
        );
        expect(transactionRecords[0].fileKey).toBe('test_file_key');
    });

    it('should return 400 for missing amount', async () => {
        const response = await request(app)
            .post('/api/deposit/usdt')
            .set('Cookie', cookie)
            .send({ transactionHash: 'test_hash' });

        expect(response.statusCode).toBe(400);
        expect(response.body.error).toBe('Invalid amount');
    });

    it('should return 400 for missing transaction hash', async () => {
        const response = await request(app)
            .post('/api/deposit/usdt')
            .set('Cookie', cookie)
            .send({ amount: '100' });

        expect(response.statusCode).toBe(400);
        expect(response.body.error).toBe('Transaction hash is required');
    });
    it('should return 400 for missing file Key', async () => {
        const response = await request(app)
            .post('/api/deposit/usdt')
            .set('Cookie', cookie)
            .send({ amount: '100', transactionHash: 'test_hash' });

        expect(response.statusCode).toBe(400);
    });
});

describe('Admin Deposits API Tests', () => {
    let adminUserId: string;
    let adminCookie: string;
    let regularUserId: string;

    beforeEach(async () => {
        // Clean up the database before each test
        await db.delete(transactions);
        await db.delete(wallets);
        await db.delete(users);
        jest.clearAllMocks();

        // Create an admin user
        const adminUser = await registerUser({
            email: 'admin@example.com',
            password: 'adminpassword',
        } as NewUsers);

        // Update admin status
        await db
            .update(users)
            .set({ isAdmin: true })
            .where(eq(users.id, adminUser.id));

        adminUserId = adminUser.id;

        // Log in the admin user
        const adminLoginResponse = await request(app)
            .post('/api/login')
            .send({ email: 'admin@example.com', password: 'adminpassword' });
        adminCookie = adminLoginResponse.headers['set-cookie'];

        // Create a regular user
        const regularUser = await registerUser({
            email: 'user@example.com',
            password: 'userpassword',
        } as NewUsers);
        regularUserId = regularUser.id;

        // Create a USDT wallet for the regular user
        const newWallet: NewWallet = {
            userId: regularUserId,
            currency: 'USDT',
            balance: '0',
        };
        await createWallet(newWallet);
    });

    afterAll(async () => {
        await db.delete(transactions);
        await db.delete(wallets);
        await db.delete(users);
    });

    it('should get pending deposit transactions for an admin', async () => {
        // Create a pending deposit transaction (simulate a user submitting a deposit)
        const depositData = {
            amount: '100',
            transactionHash: 'test_transaction_hash',
            fileKey: 'test_file_key',
        };

        // First, log in as a regular user to establish a session
        const userLoginResponse = await request(app)
            .post('/api/login')
            .send({ email: 'user@example.com', password: 'userpassword' });
        const userCookie = userLoginResponse.headers['set-cookie'];

        await request(app)
            .post('/api/deposit/usdt')
            .set('Cookie', userCookie) // Use regular user's cookie
            .send(depositData);

        // Now, make the request to get pending deposits as an admin
        const response = await request(app)
            .get('/api/admin/deposits')
            .set('Cookie', adminCookie); // Use admin cookie

        expect(response.statusCode).toBe(200);
        expect(response.body.deposits).toBeDefined();
        expect(response.body.deposits.length).toBeGreaterThan(0);
        expect(response.body.deposits[0].status).toBe('pending');
    });

    it('should return 401 for unauthenticated user accessing /api/admin/deposits', async () => {
        const response = await request(app).get('/api/admin/deposits');
        expect(response.statusCode).toBe(401);
    });

    it('should return 403 for non-admin user accessing /api/admin/deposits', async () => {
        // Log in the a regular user
        const userLoginResponse = await request(app)
            .post('/api/login')
            .send({ email: 'user@example.com', password: 'userpassword' });
        const userCookie = userLoginResponse.headers['set-cookie'];

        const response = await request(app)
            .get('/api/admin/deposits')
            .set('Cookie', userCookie); // Use non-admin cookie
        expect(response.statusCode).toBe(403);
    });
});

describe('USDT Deposit API Tests', () => {
    let userId: string;
    let cookie: string;
    // Before each test, clear the database, create a user, create a USDT wallet, and log in.
    beforeEach(async () => {
        await db.delete(transactions);
        await db.delete(wallets);
        await db.delete(users);
        jest.clearAllMocks();

        // Create a test user
        const testUser = await registerUser({
            email: 'testuser@example.com',
            password: 'password123',
        } as NewUsers);
        userId = testUser.id;
        
        // Create a USDT wallet for the user
        const newWallet: NewWallet = { userId: userId, currency: 'USDT', balance: '0' };
        await createWallet(newWallet);
        
        // Log in the user (to establish a session)
        const loginResponse = await request(app)
        .post('/api/login')
        .send({ email: 'testuser@example.com', password: 'password123' });
        cookie = loginResponse.headers['set-cookie'];
    });

    // After all tests, close the database connection
    afterAll(async () => {
        await db.delete(transactions);
        await db.delete(wallets);
        await db.delete(users);
    });

    it('should submit a deposit request for approval', async () => {
        const depositData = {
            amount: '100',
            transactionHash: 'test_transaction_hash',
            fileKey: 'test_file_key',
        };

        const response = await request(app)
            .post('/api/deposit/usdt')
            .set('Cookie', cookie)
            .send(depositData);

        expect(response.statusCode).toBe(201);
        expect(response.body.message).toBe('Deposit request submitted for approval');

        // Verify that a transaction record was created with status 'pending'
        const transactionRecords = await db.select().from(transactions).where(eq(transactions.userId, userId));
        expect(transactionRecords.length).toBe(1);
        expect(transactionRecords[0].status).toBe('pending');
        expect(transactionRecords[0].amount).toBe('100');
        expect(transactionRecords[0].transactionHash).toBe('test_transaction_hash');
        expect(transactionRecords[0].fileKey).toBe('test_file_key');
    });

    it('should return 400 for missing amount', async () => {
        const response = await request(app)
            .post('/api/deposit/usdt')
            .set('Cookie', cookie)
            .send({ transactionHash: 'test_hash', fileKey: 'test' });

        expect(response.statusCode).toBe(400);
        expect(response.body.error).toBe('Invalid amount');
    });

    it('should return 400 for missing fileKey', async () => {
        const response = await request(app)
            .post('/api/deposit/usdt')
            .set('Cookie', cookie)
            .send({ transactionHash: 'test_hash', amount: '50' });
    
        expect(response.statusCode).toBe(400);
        expect(response.body.error).toBe('File key is required');
    });

    it('should return 400 for missing transaction hash', async () => {
        const response = await request(app)
            .post('/api/deposit/usdt')
            .set('Cookie', cookie)
            .send({ amount: '100', fileKey: 'test' });

        expect(response.statusCode).toBe(400);
        expect(response.body.error).toBe('Transaction hash is required');
    });

    it('should return 400 for an user with no USDT wallet', async() => {
        await db.delete(wallets);
        const depositData = {
            amount: '100',
            transactionHash: 'test_transaction_hash',
            fileKey: 'test_file_key',
        };

        const response = await request(app)
            .post('/api/deposit/usdt')
            .set('Cookie', cookie)
            .send(depositData);
        expect(response.statusCode).toBe(400);
        expect(response.body.error).toBe('USDT wallet not found');
    });
});
