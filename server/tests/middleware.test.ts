import request from 'supertest';
import express, { Router, Request, Response, NextFunction } from 'express';
import { isAdmin } from '../middleware/isAdmin';
import session from 'express-session';
import db from '../db';
import { users, wallets, transactions } from '../../shared/schema';
import { createUser } from '../storage';
import { NewUsers } from '../../shared/types';

// Mock the sendgrid functions to avoid real emails during testing.
jest.mock('../../shared/email', () => ({
    sendWelcomeEmail: jest.fn(),
    sendPasswordResetEmail: jest.fn(),
    sendPasswordResetConfirmationEmail: jest.fn(),
}));

// Session middleware configuration
declare module 'express-session' {
    interface Session {
        userId: string;
    }
}

// Create a test app with the middleware and a test route
const testApp = express();
testApp.use(express.json());

// Mock express-session
testApp.use(
    session({
        secret: 'test_secret', // Use a test secret
        resave: false,
        saveUninitialized: true,
        cookie: { secure: false }, // For testing, don't require HTTPS
    })
);

// Create a middleware to set session data for testing
const setSessionData = (userId: string | null) => {
    return (req: Request, res: Response, next: NextFunction) => {
        if (userId) {
            req.session.userId = userId;
        }
        next();
    };
};

const router = Router();
router.get('/test-admin', isAdmin, (req, res) => {
    res.status(200).json({ message: 'Admin access granted' });
});
testApp.use('/api', router); // Mount the router

describe('isAdmin Middleware Tests', () => {
    beforeEach(async () => {
        // Clean up the database before each test
        await db.delete(transactions);
        await db.delete(wallets);
        await db.delete(users);
    });

    it('should allow access for an admin user', async () => {
        // Create an admin user
        const adminUser: NewUsers = {
            email: 'admin@example.com',
            password: 'adminpassword',
            salt: 'testsalt', // Required field
            isAdmin: true, // Set isAdmin to true
        };

        const createdUser = await createUser(adminUser);

        // Add a middleware to set the session for this test
        const adminApp = express();
        adminApp.use(express.json());
        adminApp.use(
            session({
                secret: 'test_secret',
                resave: false,
                saveUninitialized: true,
                cookie: { secure: false },
            })
        );
        adminApp.use(setSessionData(createdUser.id)); // Set the userId in session
        adminApp.use('/api', router);

        // Make the request with the session that has admin user ID
        const response = await request(adminApp).get('/api/test-admin');
        expect(response.statusCode).toBe(200);
        expect(response.body.message).toBe('Admin access granted');
    });

    it('should deny access for a non-admin user', async () => {
        const nonAdminUser: NewUsers = {
            email: 'user@example.com',
            password: 'userpassword',
            salt: 'testsalt', // Required field
            isAdmin: false, // Set isAdmin to false
        };

        const createdUser = await createUser(nonAdminUser);

        // Add a middleware to set the session for this test
        const nonAdminApp = express();
        nonAdminApp.use(express.json());
        nonAdminApp.use(
            session({
                secret: 'test_secret',
                resave: false,
                saveUninitialized: true,
                cookie: { secure: false },
            })
        );
        nonAdminApp.use(setSessionData(createdUser.id)); // Set the userId in session
        nonAdminApp.use('/api', router);

        // Make the request with the session that has non-admin user ID
        const response = await request(nonAdminApp).get('/api/test-admin');
        expect(response.statusCode).toBe(403);
        expect(response.body.error).toBe('Forbidden');
    });

    it('should deny access for an unauthenticated user', async () => {
        // Use the original app without setting any session data
        const response = await request(testApp).get('/api/test-admin');
        expect(response.statusCode).toBe(401);
        expect(response.body.error).toBe('Authentication required');
    });
});
