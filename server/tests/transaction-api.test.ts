import request from 'supertest';
import * as appModule from '../index'; // Import the Express app
import { users, wallets, transactions } from '../../shared/schema';
import db from '../db';
import { eq, and } from 'drizzle-orm';
import { scryptSync, randomBytes } from 'crypto';

// Mock email and S3 functions
jest.mock('../../shared/email', () => ({
  sendTransactionNotificationEmail: jest.fn().mockResolvedValue(true),
}));

jest.mock('../s3', () => ({
  generateReadUrl: jest.fn().mockResolvedValue('https://fake-s3-url.com/screenshot.jpg'),
}));

// Get the Express app from the imported module
const app = (appModule as any).default || appModule;

// Helper function to hash a password
function hashPassword(password: string, salt: string) {
  return scryptSync(password, salt, 64).toString('hex');
}

describe('Transaction API Tests', () => {
  // Test user data
  let userId: string;
  let adminId: string;
  let userWalletId: string;
  let agent: any;
  let adminAgent: any;

  // Set up test users and authenticate before tests
  beforeAll(async () => {
    // Clear all data
    await db.delete(transactions);
    await db.delete(wallets);
    await db.delete(users);

    // Create a regular test user
    const salt = randomBytes(16).toString('hex');
    const regularUser = await db.insert(users).values({
      email: 'transaction-user@example.com',
      password: hashPassword('Password123!', salt),
      salt,
      firstName: 'Transaction',
      lastName: 'User',
      emailVerified: true,
      isAdmin: false,
      createdAt: new Date()
    }).returning().then(results => results[0]);

    userId = regularUser.id;

    // Create an admin test user
    const adminSalt = randomBytes(16).toString('hex');
    const adminUser = await db.insert(users).values({
      email: 'admin@example.com',
      password: hashPassword('AdminPass123!', adminSalt),
      salt: adminSalt,
      firstName: 'Admin',
      lastName: 'User',
      emailVerified: true,
      isAdmin: true,
      createdAt: new Date()
    }).returning().then(results => results[0]);

    adminId = adminUser.id;

    // Create a wallet for the regular user
    const wallet = await db.insert(wallets).values({
      userId: userId,
      currency: 'USDT',
      balance: '1000',
      createdAt: new Date(),
      updatedAt: new Date()
    }).returning().then(results => results[0]);

    userWalletId = wallet.id;

    // Set up authenticated agents
    agent = request.agent(app);
    await agent
      .post('/api/login')
      .send({
        email: 'transaction-user@example.com',
        password: 'Password123!'
      });

    adminAgent = request.agent(app);
    await adminAgent
      .post('/api/login')
      .send({
        email: 'admin@example.com',
        password: 'AdminPass123!'
      });
  });

  afterEach(async () => {
    // Clear transactions after each test
    await db.delete(transactions);
  });

  afterAll(async () => {
    // Clean up all data after tests
    await db.delete(transactions);
    await db.delete(wallets);
    await db.delete(users);
  });

  describe('Deposit Requests', () => {
    it('should create a deposit request', async () => {
      const depositData = {
        amount: '100.50',
        transactionHash: '0x123456789abcdef',
        fileKey: 'screenshot.jpg',
        walletId: userWalletId
      };

      const response = await agent
        .post('/api/deposits')
        .send(depositData);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('deposit');
      expect(response.body.deposit).toHaveProperty('userId', userId);
      expect(response.body.deposit).toHaveProperty('amount', '100.50');
      expect(response.body.deposit).toHaveProperty('status', 'pending');

      // Verify deposit was stored in database
      const depositInDb = await db
        .select()
        .from(transactions)
        .where(
          and(
            eq(transactions.type, 'deposit'),
            eq(transactions.userId, userId)
          )
        )
        .then(results => results[0]);

      expect(depositInDb).toBeTruthy();
      expect(depositInDb.amount).toBe('100.50');
      expect(depositInDb.status).toBe('pending');
    });

    it('should return 400 for missing required fields', async () => {
      const response = await agent
        .post('/api/deposits')
        .send({
          // Missing required fields
          amount: '100'
          // No transaction hash or file key
        });

      expect(response.status).toBe(400);
    });

    it('should return 400 for invalid amount', async () => {
      const response = await agent
        .post('/api/deposits')
        .send({
          amount: 'invalid',
          transactionHash: '0x123456789abcdef',
          fileKey: 'screenshot.jpg',
          walletId: userWalletId
        });

      expect(response.status).toBe(400);
    });

    it('should return 401 for unauthenticated user', async () => {
      const response = await request(app)
        .post('/api/deposits')
        .send({
          amount: '100',
          transactionHash: '0x123456789abcdef',
          fileKey: 'screenshot.jpg',
          walletId: userWalletId
        });

      expect(response.status).toBe(401);
    });
  });

  describe('Withdrawal Requests', () => {
    it('should create a withdrawal request', async () => {
      const withdrawalData = {
        amount: '50.25',
        walletId: userWalletId,
        destination: 'bank-account-123'
      };

      const response = await agent
        .post('/api/withdrawals')
        .send(withdrawalData);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('withdrawal');
      expect(response.body.withdrawal).toHaveProperty('userId', userId);
      expect(response.body.withdrawal).toHaveProperty('amount', '50.25');
      expect(response.body.withdrawal).toHaveProperty('status', 'pending');
      expect(response.body.withdrawal).toHaveProperty('destination', 'bank-account-123');

      // Verify withdrawal was stored in database
      const withdrawalInDb = await db
        .select()
        .from(transactions)
        .where(
          and(
            eq(transactions.type, 'withdrawal'),
            eq(transactions.userId, userId)
          )
        )
        .then(results => results[0]);

      expect(withdrawalInDb).toBeTruthy();
      expect(withdrawalInDb.amount).toBe('50.25');
      expect(withdrawalInDb.status).toBe('pending');
    });

    it('should return 400 for amount exceeding balance', async () => {
      const response = await agent
        .post('/api/withdrawals')
        .send({
          amount: '2000', // More than the wallet balance of 1000
          walletId: userWalletId,
          destination: 'bank-account-123'
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'Insufficient balance');
    });

    it('should return 400 for missing required fields', async () => {
      const response = await agent
        .post('/api/withdrawals')
        .send({
          // Missing amount
          walletId: userWalletId
        });

      expect(response.status).toBe(400);
    });
  });

  describe('Transaction History', () => {
    beforeEach(async () => {
      // Create some test transactions
      await db.insert(transactions).values([
        {
          id: 'tx-1',
          userId: userId,
          type: 'deposit',
          amount: '100',
          status: 'completed',
          walletId: userWalletId,
          transactionHash: '0x123',
          createdAt: new Date(Date.now() - 3600000), // 1 hour ago
          updatedAt: new Date()
        },
        {
          id: 'tx-2',
          userId: userId,
          type: 'withdrawal',
          amount: '50',
          status: 'pending',
          walletId: userWalletId,
          destination: 'bank-123',
          createdAt: new Date(Date.now() - 7200000), // 2 hours ago
          updatedAt: new Date()
        },
        {
          id: 'tx-3',
          userId: adminId, // Different user
          type: 'deposit',
          amount: '200',
          status: 'completed',
          walletId: userWalletId,
          transactionHash: '0x456',
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ]);
    });

    it('should retrieve user transaction history', async () => {
      const response = await agent.get('/api/transactions');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('transactions');
      expect(response.body.transactions).toHaveLength(2); // Only transactions for this user
      
      // Verify transactions are sorted by createdAt (newest first)
      expect(response.body.transactions[0].id).toBe('tx-1');
      expect(response.body.transactions[1].id).toBe('tx-2');
    });

    it('should filter transactions by type', async () => {
      const response = await agent.get('/api/transactions?type=deposit');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('transactions');
      expect(response.body.transactions).toHaveLength(1);
      expect(response.body.transactions[0].type).toBe('deposit');
    });

    it('should filter transactions by status', async () => {
      const response = await agent.get('/api/transactions?status=pending');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('transactions');
      expect(response.body.transactions).toHaveLength(1);
      expect(response.body.transactions[0].status).toBe('pending');
    });

    it('should return a specific transaction by ID', async () => {
      const response = await agent.get('/api/transactions/tx-1');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('transaction');
      expect(response.body.transaction).toHaveProperty('id', 'tx-1');
      expect(response.body.transaction).toHaveProperty('amount', '100');
    });

    it('should return 404 for non-existent transaction', async () => {
      const response = await agent.get('/api/transactions/non-existent');

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error', 'Transaction not found');
    });

    it('should deny access to another user\'s transaction', async () => {
      const response = await agent.get('/api/transactions/tx-3');

      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('error', 'Access denied');
    });

    it('should allow admin to view any transaction', async () => {
      const response = await adminAgent.get('/api/transactions/tx-1');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('transaction');
      expect(response.body.transaction).toHaveProperty('id', 'tx-1');
    });
  });

  describe('Admin Transaction Management', () => {
    let depositId: string;
    
    beforeEach(async () => {
      // Create a pending deposit
      const deposit = await db.insert(transactions).values({
        userId: userId,
        type: 'deposit',
        amount: '150',
        status: 'pending',
        walletId: userWalletId,
        transactionHash: '0x789',
        createdAt: new Date(),
        updatedAt: new Date()
      }).returning().then(results => results[0]);
      
      depositId = deposit.id;
    });

    it('should allow admin to approve a deposit', async () => {
      // Get original wallet balance
      const originalWallet = await db
        .select()
        .from(wallets)
        .where(eq(wallets.id, userWalletId))
        .then(results => results[0]);
        
      const originalBalance = parseFloat(originalWallet.balance);

      // Admin approves the deposit
      const response = await adminAgent
        .post(`/api/admin/deposits/${depositId}/approve`)
        .send();

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message', 'Deposit approved');
      
      // Verify deposit status is updated
      const updatedDeposit = await db
        .select()
        .from(transactions)
        .where(eq(transactions.id, depositId))
        .then(results => results[0]);
        
      expect(updatedDeposit.status).toBe('completed');
      
      // Verify wallet balance is increased
      const updatedWallet = await db
        .select()
        .from(wallets)
        .where(eq(wallets.id, userWalletId))
        .then(results => results[0]);
        
      const newBalance = parseFloat(updatedWallet.balance);
      const depositAmount = parseFloat(updatedDeposit.amount);
      
      expect(newBalance).toBe(originalBalance + depositAmount);
    });

    it('should allow admin to reject a deposit', async () => {
      // Admin rejects the deposit
      const response = await adminAgent
        .post(`/api/admin/deposits/${depositId}/reject`)
        .send({ reason: 'Invalid transaction hash' });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message', 'Deposit rejected');
      
      // Verify deposit status is updated
      const updatedDeposit = await db
        .select()
        .from(transactions)
        .where(eq(transactions.id, depositId))
        .then(results => results[0]);
        
      expect(updatedDeposit.status).toBe('rejected');
      expect(updatedDeposit.notes).toBe('Invalid transaction hash');
    });

    it('should deny non-admin from approving a deposit', async () => {
      const response = await agent
        .post(`/api/admin/deposits/${depositId}/approve`)
        .send();

      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('error');
    });
  });
}); 