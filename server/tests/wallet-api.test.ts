import request from 'supertest';
import * as appModule from '../index'; // Import the Express app
import { users, wallets } from '../../shared/schema';
import db from '../db';
import { eq } from 'drizzle-orm';
import { scryptSync, randomBytes } from 'crypto';

// Get the Express app from the imported module
const app = (appModule as any).default || appModule;

// Helper function to hash a password
function hashPassword(password: string, salt: string) {
  return scryptSync(password, salt, 64).toString('hex');
}

describe('Wallet API Tests', () => {
  // Test user data
  let userId: string;
  let adminId: string;
  let agent: any;
  let adminAgent: any;

  // Set up test users and authenticate before tests
  beforeAll(async () => {
    // Clear all data
    await db.delete(wallets);
    await db.delete(users);

    // Create a regular test user
    const salt = randomBytes(16).toString('hex');
    const regularUser = await db.insert(users).values({
      email: 'wallet-user@example.com',
      password: hashPassword('Password123!', salt),
      salt,
      firstName: 'Wallet',
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

    // Set up authenticated agents
    agent = request.agent(app);
    await agent
      .post('/api/login')
      .send({
        email: 'wallet-user@example.com',
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
    // Clear wallets after each test
    await db.delete(wallets);
  });

  afterAll(async () => {
    // Clean up all data after tests
    await db.delete(wallets);
    await db.delete(users);
  });

  describe('Wallet Creation', () => {
    it('should create a new wallet for an authenticated user', async () => {
      const response = await agent
        .post('/api/wallets')
        .send({ currency: 'USDT' });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('wallet');
      expect(response.body.wallet).toHaveProperty('currency', 'USDT');
      expect(response.body.wallet).toHaveProperty('balance', '0');
      expect(response.body.wallet).toHaveProperty('userId', userId);

      // Verify wallet was created in database
      const walletInDb = await db
        .select()
        .from(wallets)
        .where(eq(wallets.userId, userId))
        .then(results => results[0]);

      expect(walletInDb).toBeTruthy();
      expect(walletInDb.currency).toBe('USDT');
    });

    it('should return 401 for unauthenticated user', async () => {
      const response = await request(app)
        .post('/api/wallets')
        .send({ currency: 'USDT' });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error', 'Authentication required');
    });

    it('should return 400 for missing currency', async () => {
      const response = await agent
        .post('/api/wallets')
        .send({}); // Missing currency

      expect(response.status).toBe(400);
    });

    it('should return 400 for invalid currency', async () => {
      const response = await agent
        .post('/api/wallets')
        .send({ currency: 'INVALID' });

      expect(response.status).toBe(400);
    });

    it('should return 409 for duplicate wallet currency', async () => {
      // First create a wallet
      await agent
        .post('/api/wallets')
        .send({ currency: 'USDT' });

      // Try to create another with the same currency
      const response = await agent
        .post('/api/wallets')
        .send({ currency: 'USDT' });

      expect(response.status).toBe(409);
      expect(response.body).toHaveProperty('error', 'Wallet for this currency already exists');
    });
  });

  describe('Wallet Retrieval', () => {
    beforeEach(async () => {
      // Create test wallets
      await db.insert(wallets).values([
        {
          id: 'wallet-1',
          userId: userId,
          currency: 'USDT',
          balance: '1000',
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: 'wallet-2',
          userId: userId,
          currency: 'JOD',
          balance: '500',
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: 'wallet-3',
          userId: adminId,
          currency: 'USDT',
          balance: '2000',
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ]);
    });

    it('should retrieve all wallets for the authenticated user', async () => {
      const response = await agent.get('/api/wallets');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('wallets');
      expect(response.body.wallets).toHaveLength(2);
      
      // Verify wallets belong to the user
      response.body.wallets.forEach((wallet: any) => {
        expect(wallet.userId).toBe(userId);
      });
      
      // Verify both currencies are included
      const currencies = response.body.wallets.map((w: any) => w.currency);
      expect(currencies).toContain('USDT');
      expect(currencies).toContain('JOD');
    });

    it('should retrieve a specific wallet by ID', async () => {
      const response = await agent.get('/api/wallets/wallet-1');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('wallet');
      expect(response.body.wallet).toHaveProperty('id', 'wallet-1');
      expect(response.body.wallet).toHaveProperty('currency', 'USDT');
      expect(response.body.wallet).toHaveProperty('balance', '1000');
    });

    it('should return 404 for non-existent wallet', async () => {
      const response = await agent.get('/api/wallets/non-existent-id');

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error', 'Wallet not found');
    });

    it('should return 403 when accessing another user\'s wallet', async () => {
      // Regular user trying to access admin's wallet
      const response = await agent.get('/api/wallets/wallet-3');

      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('error', 'Access denied');
    });

    it('should allow admin to access any wallet', async () => {
      // Admin accessing regular user's wallet
      const response = await adminAgent.get('/api/wallets/wallet-1');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('wallet');
      expect(response.body.wallet).toHaveProperty('id', 'wallet-1');
    });
  });

  describe('Wallet Balance Query', () => {
    beforeEach(async () => {
      // Create test wallet
      await db.insert(wallets).values({
        id: 'balance-wallet',
        userId: userId,
        currency: 'USDT',
        balance: '1500.50',
        createdAt: new Date(),
        updatedAt: new Date()
      });
    });

    it('should return accurate wallet balance', async () => {
      const response = await agent.get('/api/wallets/balance-wallet/balance');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('balance', '1500.50');
      expect(response.body).toHaveProperty('currency', 'USDT');
    });

    it('should return balance for specific currency', async () => {
      const response = await agent.get('/api/balances/USDT');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('balance', '1500.50');
      expect(response.body).toHaveProperty('currency', 'USDT');
    });

    it('should return 404 for non-existent currency balance', async () => {
      const response = await agent.get('/api/balances/BTC');

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error', 'No wallet found for this currency');
    });
  });
}); 