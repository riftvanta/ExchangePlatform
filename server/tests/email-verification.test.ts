import request from 'supertest';
import * as appModule from '../index'; // Import the Express app
import { users } from '../../shared/schema';
import db from '../db';
import { eq } from 'drizzle-orm';
import { createEmailVerificationToken } from '../email';

// Mock the sendgrid functions to avoid real emails during testing
jest.mock('../../shared/email', () => ({
    sendVerificationEmail: jest.fn(),
    sendWelcomeEmail: jest.fn(),
    sendPasswordResetEmail: jest.fn(),
    sendPasswordResetConfirmationEmail: jest.fn(),
}));

// For direct imports in route handlers
jest.mock('../email', () => ({
    ...jest.requireActual('../email'),
    createEmailVerificationToken: jest.fn().mockImplementation(async (userId) => {
        return 'test-verification-token';
    }),
    verifyEmail: jest.fn().mockImplementation(async (token) => {
        if (token === 'valid-token') {
            return { success: true, userId: 'test-user-id' };
        } else {
            throw new Error('Invalid or expired token');
        }
    }),
}));

// Mock the auth module to bypass login
jest.mock('../auth', () => ({
    ...jest.requireActual('../auth'),
    loginUser: jest.fn().mockImplementation(async () => {
        return {
            id: 'test-user-id',
            email: 'test@example.com',
            password: 'hashed-password',
            firstName: 'Test',
            lastName: 'User',
            emailVerified: false,
            isAdmin: false,
        };
    }),
}));

// Get the Express app from the imported module
const app = (appModule as any).default || appModule;

describe('Email Verification Tests', () => {
    // Test user session data
    let testUserId: string;
    let agent: any;

    // Before each test, set up the test environment
    beforeEach(async () => {
        // Delete test users
        await db.delete(users);

        // Create a test user
        const testUser = await db.insert(users).values({
            email: 'test@example.com',
            password: 'hashed-password',
            salt: 'test-salt',
            firstName: 'Test',
            lastName: 'User',
            emailVerified: false,
            isAdmin: false,
            createdAt: new Date(),
        }).returning().then(results => results[0]);

        testUserId = testUser.id;

        // Set up an agent to maintain session cookies
        agent = request.agent(app);

        // Login to create a session
        const loginResponse = await agent
            .post('/api/login')
            .send({
                email: 'test@example.com',
                password: 'password123'
            });
            
        // Verify login was successful
        expect(loginResponse.status).toBe(200);
    });

    describe('Resend Verification Endpoint', () => {
        it('should resend a verification email', async () => {
            const response = await agent
                .post('/api/resend-verification')
                .send({ email: 'test@example.com' });

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('message', 'Verification email sent');
            
            // Check that the user has a verification token in the database
            const updatedUser = await db.select()
                .from(users)
                .where(eq(users.id, testUserId))
                .then(results => results[0]);
                
            expect(updatedUser).toHaveProperty('verificationToken');
            expect(updatedUser.verificationTokenExpiry).toBeTruthy();
        });

        it('should return error for already verified email', async () => {
            // Update user to be verified
            await db.update(users)
                .set({ emailVerified: true })
                .where(eq(users.id, testUserId));

            const response = await agent
                .post('/api/resend-verification')
                .send({ email: 'test@example.com' });

            expect(response.status).toBe(400);
            expect(response.body).toHaveProperty('error', 'Email is already verified');
        });

        it('should return error for unauthenticated request', async () => {
            // Use a new agent without session
            const unauthAgent = request(app);
            
            const response = await unauthAgent
                .post('/api/resend-verification')
                .send({ email: 'test@example.com' });

            expect(response.status).toBe(401);
            expect(response.body).toHaveProperty('error', 'Authentication required');
        });
    });

    describe('Verify Email Endpoint', () => {
        it('should verify a user email with valid token', async () => {
            // Add verification token to user
            await db.update(users)
                .set({ 
                    verificationToken: 'valid-token',
                    verificationTokenExpiry: new Date(Date.now() + 3600000) // 1 hour from now
                })
                .where(eq(users.id, testUserId));

            const response = await request(app)
                .get('/api/verify-email')
                .query({ token: 'valid-token' });

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('message', 'Email verified successfully');
            
            // Check that the user is now verified
            const updatedUser = await db.select()
                .from(users)
                .where(eq(users.id, testUserId))
                .then(results => results[0]);
                
            expect(updatedUser.emailVerified).toBe(true);
        });

        it('should return error for invalid token', async () => {
            const response = await request(app)
                .get('/api/verify-email')
                .query({ token: 'invalid-token' });

            expect(response.status).toBe(400);
            expect(response.body).toHaveProperty('error');
        });
    });
}); 