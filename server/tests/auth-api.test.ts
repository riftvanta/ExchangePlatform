import request from 'supertest';
import * as appModule from '../index'; // Import the Express app
import { users } from '../../shared/schema';
import db from '../db';
import { eq } from 'drizzle-orm';
import { scryptSync, randomBytes } from 'crypto';

// Mock email functions to prevent sending real emails during tests
jest.mock('../../shared/email', () => ({
  sendVerificationEmail: jest.fn().mockResolvedValue(true),
  sendWelcomeEmail: jest.fn().mockResolvedValue(true),
  sendPasswordResetEmail: jest.fn().mockResolvedValue(true),
  sendPasswordResetConfirmationEmail: jest.fn().mockResolvedValue(true),
}));

// Get the Express app from the imported module
const app = (appModule as any).default || appModule;

// Helper function to hash a password
function hashPassword(password: string, salt: string) {
  return scryptSync(password, salt, 64).toString('hex');
}

describe('Authentication API Tests', () => {
  beforeEach(async () => {
    // Clear the users table before each test
    await db.delete(users);
  });

  describe('Register Endpoint', () => {
    it('should register a new user successfully', async () => {
      const newUser = {
        email: 'test@example.com',
        password: 'Password123!',
        firstName: 'Test',
        lastName: 'User'
      };

      const response = await request(app)
        .post('/api/register')
        .send(newUser);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('user');
      expect(response.body.user).toHaveProperty('email', newUser.email);
      expect(response.body.user).toHaveProperty('firstName', newUser.firstName);
      expect(response.body.user).toHaveProperty('lastName', newUser.lastName);
      
      // Verify user was stored in the database
      const storedUser = await db
        .select()
        .from(users)
        .where(eq(users.email, newUser.email))
        .then(results => results[0]);
      
      expect(storedUser).toBeTruthy();
      expect(storedUser.email).toBe(newUser.email);
      expect(storedUser.emailVerified).toBe(false);
    });

    it('should return error for existing email', async () => {
      // First create a user
      const salt = randomBytes(16).toString('hex');
      await db.insert(users).values({
        email: 'existing@example.com',
        password: hashPassword('password123', salt),
        salt,
        firstName: 'Existing',
        lastName: 'User',
        emailVerified: true,
        isAdmin: false,
        createdAt: new Date()
      });

      // Try to register with the same email
      const response = await request(app)
        .post('/api/register')
        .send({
          email: 'existing@example.com',
          password: 'Password123!',
          firstName: 'Test',
          lastName: 'User'
        });

      expect(response.status).toBe(409);
      expect(response.body).toHaveProperty('error', 'Email already registered');
    });

    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/register')
        .send({
          // Missing email and password
          firstName: 'Test',
          lastName: 'User'
        });

      expect(response.status).toBe(400);
    });
  });

  describe('Login Endpoint', () => {
    beforeEach(async () => {
      // Create a test user for login tests
      const salt = randomBytes(16).toString('hex');
      await db.insert(users).values({
        email: 'login@example.com',
        password: hashPassword('Password123!', salt),
        salt,
        firstName: 'Login',
        lastName: 'User',
        emailVerified: true,
        isAdmin: false,
        createdAt: new Date()
      });
    });

    it('should login successfully with valid credentials', async () => {
      const response = await request(app)
        .post('/api/login')
        .send({
          email: 'login@example.com',
          password: 'Password123!'
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('user');
      expect(response.body.user).toHaveProperty('email', 'login@example.com');
      expect(response.body.user).not.toHaveProperty('password');
      expect(response.body.user).not.toHaveProperty('salt');
    });

    it('should return error for invalid password', async () => {
      const response = await request(app)
        .post('/api/login')
        .send({
          email: 'login@example.com',
          password: 'WrongPassword!'
        });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error', 'Invalid email or password');
    });

    it('should return error for non-existent user', async () => {
      const response = await request(app)
        .post('/api/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'Password123!'
        });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error', 'Invalid email or password');
    });
  });

  describe('Logout Endpoint', () => {
    it('should logout successfully', async () => {
      // First login to create a session
      const agent = request.agent(app);
      
      await agent
        .post('/api/login')
        .send({
          email: 'login@example.com',
          password: 'Password123!'
        });

      // Then attempt to logout
      const response = await agent.post('/api/logout');
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message', 'Logged out successfully');
    });
  });

  describe('Password Reset Flow', () => {
    beforeEach(async () => {
      // Create a test user for password reset tests
      const salt = randomBytes(16).toString('hex');
      await db.insert(users).values({
        email: 'reset@example.com',
        password: hashPassword('OldPassword123!', salt),
        salt,
        firstName: 'Reset',
        lastName: 'User',
        emailVerified: true,
        isAdmin: false,
        createdAt: new Date()
      });
    });

    it('should create a password reset token', async () => {
      const response = await request(app)
        .post('/api/forgot-password')
        .send({
          email: 'reset@example.com'
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message');
      
      // Verify reset token was stored in the database
      const user = await db
        .select()
        .from(users)
        .where(eq(users.email, 'reset@example.com'))
        .then(results => results[0]);
      
      expect(user.resetPasswordToken).toBeTruthy();
      expect(user.resetPasswordExpiry).toBeTruthy();
    });

    it('should reset password with valid token', async () => {
      // First request a password reset token
      await request(app)
        .post('/api/forgot-password')
        .send({
          email: 'reset@example.com'
        });
      
      // Get the token from the database
      const user = await db
        .select()
        .from(users)
        .where(eq(users.email, 'reset@example.com'))
        .then(results => results[0]);
      
      // Now reset the password
      const response = await request(app)
        .post('/api/reset-password')
        .send({
          token: user.resetPasswordToken,
          newPassword: 'NewPassword123!'
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message', 'Password reset successful');
      
      // Verify password was changed by trying to login
      const loginResponse = await request(app)
        .post('/api/login')
        .send({
          email: 'reset@example.com',
          password: 'NewPassword123!'
        });
      
      expect(loginResponse.status).toBe(200);
    });

    it('should reject invalid reset token', async () => {
      const response = await request(app)
        .post('/api/reset-password')
        .send({
          token: 'invalid-token',
          newPassword: 'NewPassword123!'
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });
  });
}); 