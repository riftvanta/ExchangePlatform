import request from 'supertest';
import { registerUser, loginUser } from '../auth'; // Import auth functions
import { NewUsers } from '../../shared/types';
import { getUserByEmail } from '../storage'; // Import storage functions
import * as appModule from '../index'; // Import the Express app
import { users, wallets, transactions } from '../../shared/schema';
import db from '../db';

// Mock the sendgrid functions to avoid real emails during testing.
jest.mock('../../shared/email', () => ({
  sendWelcomeEmail: jest.fn(),
  sendPasswordResetEmail: jest.fn(),
  sendPasswordResetConfirmationEmail: jest.fn()
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

    const response = await request(app)
      .post('/api/register')
      .send(newUser);

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
    const response = await request(app)
      .post('/api/register')
      .send(newUser);

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
    const response = await request(app)
      .post('/api/login')
      .send(newUser);
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
    const response = await request(app)
      .post('/api/login')
      .send({
        email: 'test@example.com',
        password: 'wrongpassword',
      });

    expect(response.statusCode).toBe(401);
    expect(response.body.error).toBe('Invalid credentials');
  });
}); 