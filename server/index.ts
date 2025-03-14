import express from 'express';
import * as dotenv from 'dotenv';
import router from './routes';
import uploadRouter from './routes/upload';
import session from 'express-session';
import pgSession from 'connect-pg-simple';
import hdWalletService from './services/hdWalletService';
import depositMonitorService from './services/depositMonitorService';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import http from 'http';
import socketService from './services/socketService';

// Load environment variables
dotenv.config();

// Create the session store
const PostgresStore = pgSession(session);

// Create Express app
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(express.json());

// Session configuration with improved security and persistence
app.use(
    session({
        store: new PostgresStore({
            conString: process.env.DATABASE_URL,
            createTableIfMissing: true,
            tableName: 'session', // Match the tableName with your SQL schema
        }),
        secret: process.env.SESSION_SECRET!,
        resave: false,
        saveUninitialized: false,
        cookie: {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production', // Use secure cookies in production
            maxAge: 1000 * 60 * 60 * 24 * 7, // Extended to 7 days for better persistence
            sameSite: 'lax', // Protection against CSRF while allowing normal navigation
            path: '/', // Ensure cookie is available throughout the application
        },
        name: 'usdt_jod_sid', // Custom name to identify our session cookie
    })
);

// Mount the routers
app.use(uploadRouter); // Mount the upload router first
app.use('/api', router);

// Error handling middleware (must be after route handlers)
app.use('*', notFoundHandler); // Handle 404 errors for any route not matched
app.use(errorHandler); // Global error handler

// Initialize services
const initializeServices = async () => {
    try {
        // Initialize HD wallet service
        await hdWalletService.init();
        console.log('HD Wallet service initialized successfully');
        
        // Always start deposit monitor service regardless of environment
        depositMonitorService.start();
        console.log('Deposit monitor service started');
    } catch (error) {
        console.error('Failed to initialize services:', error);
    }
};

// Start server if not being imported for testing
if (require.main === module) {
    // Create HTTP server using Express app
    const server = http.createServer(app);
    
    // Initialize socket service with HTTP server and session middleware
    const sessionMiddleware = session({
        store: new PostgresStore({
            conString: process.env.DATABASE_URL,
            createTableIfMissing: true,
            tableName: 'session',
        }),
        secret: process.env.SESSION_SECRET!,
        resave: false,
        saveUninitialized: false,
        cookie: {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 1000 * 60 * 60 * 24 * 7,
            sameSite: 'lax',
            path: '/',
        },
        name: 'usdt_jod_sid',
    });
    
    // Initialize socket service
    socketService.init(server, sessionMiddleware);
    
    // Listen on HTTP server instead of Express app
    server.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
        
        // Initialize services after server starts
        initializeServices();
    });
} else {
    // For testing, just export the app
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT} (test mode)`);
    });
}

// Export the app for testing
export default app;
