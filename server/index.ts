import express from 'express';
import * as dotenv from 'dotenv';
import router from './routes';
import uploadRouter from './routes/upload';
import session from 'express-session';
import pgSession from 'connect-pg-simple';

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

// Start server if not being imported for testing
if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
}

// Export the app for testing
export default app;
