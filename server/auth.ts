import { scryptSync, randomBytes } from 'crypto';
import { createUser, getUserByEmail } from './storage';
import { NewUsers, Users } from '../shared/types';
import { createEmailVerificationToken } from './email';
import { sendVerificationEmail, sendWelcomeEmail } from '../shared/email';
import { users } from '../shared/schema';
import db from './db';
import { eq } from 'drizzle-orm';
import { 
  AuthenticationError, 
  ValidationError,
  ConflictError
} from '../shared/errors';

/**
 * Generates a salt for password hashing
 * @returns A random hexadecimal string to use as salt
 */
function generateSalt(): string {
  return randomBytes(16).toString('hex');
}

/**
 * Hashes a password with the provided salt
 * @param password The plain text password
 * @param salt The salt to use for hashing
 * @returns The hashed password
 */
function hashPassword(password: string, salt: string): string {
  return scryptSync(password, salt, 64).toString('hex');
}

/**
 * Registers a new user with secure password hashing
 * @param newUserData - The user data including email and password
 * @returns The created user
 * @throws Error if the email is already registered
 */
export async function registerUser(userData: NewUsers) {
  // Perform validation
  const errors: Record<string, string[]> = {};
  
  // Validate email
  if (!userData.email || !userData.email.includes('@')) {
    errors.email = errors.email || [];
    errors.email.push('Valid email address is required');
  }
  
  // Validate password
  if (!userData.password || userData.password.length < 8) {
    errors.password = errors.password || [];
    errors.password.push('Password must be at least 8 characters');
  }
  
  // Validate names
  if (userData.firstName && userData.firstName.length < 2) {
    errors.firstName = errors.firstName || [];
    errors.firstName.push('First name must be at least 2 characters');
  }
  
  if (userData.lastName && userData.lastName.length < 2) {
    errors.lastName = errors.lastName || [];
    errors.lastName.push('Last name must be at least 2 characters');
  }
  
  // If there are validation errors, throw a ValidationError
  if (Object.keys(errors).length > 0) {
    throw new ValidationError({
      message: 'Please correct the errors in your form',
      errors,
    });
  }

  try {
    // Check if email already exists
    const existingUser = await db
      .select({ id: users.id, email: users.email })
      .from(users)
      .where(eq(users.email, userData.email))
      .then((users) => users[0] || null);

    if (existingUser) {
      throw new ConflictError({
        message: 'Email already registered',
        code: 'EMAIL_ALREADY_EXISTS',
        context: { email: userData.email }
      });
    }

    // Generate salt and hash password
    const salt = generateSalt();
    const hashedPassword = hashPassword(userData.password, salt);

    // Insert user with hashed password and salt
    const createdUsers = await db
      .insert(users)
      .values({
        ...userData,
        password: hashedPassword,
        salt: salt,
        isAdmin: false, // Default to non-admin for security
        emailVerified: false, // Email must be verified
      })
      .returning();

    // Generate and store email verification token
    const verificationToken = await createEmailVerificationToken(createdUsers[0].id);

    // Send verification email
    await sendVerificationEmail(
      createdUsers[0].email, 
      verificationToken,
      createdUsers[0].firstName || undefined
    );

    // Also send welcome email
    await sendWelcomeEmail(
      createdUsers[0].email,
      createdUsers[0].firstName || undefined
    );

    return createdUsers[0];
  } catch (error) {
    // Re-throw the error if it's already one of our custom errors
    if (error instanceof ConflictError) {
      throw error;
    }
    
    // Otherwise, handle database errors or any other errors
    console.error('User registration error:', error);
    throw new Error('User registration failed');
  }
}

/**
 * Authenticates a user by email and password
 * @param email - The user's email address
 * @param password - The user's password
 * @returns The authenticated user
 * @throws Error if credentials are invalid
 */
export async function loginUser(email: string, password: string): Promise<Users> {
  // Validate input
  if (!email || !password) {
    throw new ValidationError({
      message: 'Email and password are required',
      errors: {
        email: !email ? ['Email is required'] : [],
        password: !password ? ['Password is required'] : [],
      }
    });
  }

  // Find user by email
  const user = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .then((users) => users[0] || null);

  // Check if user exists
  if (!user) {
    throw new AuthenticationError({
      message: 'Invalid email or password',
      code: 'INVALID_CREDENTIALS',
      context: { email }
    });
  }

  // Hash the provided password with the user's salt
  const hashedPassword = hashPassword(password, user.salt);

  // Check if passwords match
  if (hashedPassword !== user.password) {
    throw new AuthenticationError({
      message: 'Invalid email or password',
      code: 'INVALID_CREDENTIALS',
      context: { email }
    });
  }

  // Return the authenticated user
  return user;
}
