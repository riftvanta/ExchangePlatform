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

app.use(
  session({
    store: new PostgresStore({
      conString: process.env.DATABASE_URL,
      createTableIfMissing: true
    }),
    secret: process.env.SESSION_SECRET!,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', // Use secure cookies in production
      maxAge: 1000 * 60 * 60 * 24, // 24 hours
    },
  })
);

// Mount the routers
app.use(uploadRouter); // Mount the upload router first
app.use('/api', router);

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});