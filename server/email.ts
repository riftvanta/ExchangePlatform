import sgMail from '@sendgrid/mail';
import * as dotenv from 'dotenv';
import { randomBytes } from 'crypto';
import { users } from '../shared/schema';
import db from './db';
import { eq } from 'drizzle-orm';

// Load environment variables
dotenv.config();

// Configure SendGrid with API key
sgMail.setApiKey(process.env.SENDGRID_API_KEY || '');

/**
 * Generates a random token for email verification or password reset
 * @returns A random token
 */
export function generateToken(): string {
  return randomBytes(32).toString('hex');
}

/**
 * Creates and stores an email verification token for a user
 * @param userId - The ID of the user to generate a token for
 * @returns The generated verification token
 */
export async function createEmailVerificationToken(userId: string): Promise<string> {
  const token = generateToken();
  const expiry = new Date();
  expiry.setHours(expiry.getHours() + 24); // Token valid for 24 hours

  await db.update(users)
    .set({
      verificationToken: token,
      verificationTokenExpiry: expiry
    })
    .where(eq(users.id, userId));

  return token;
}

/**
 * Creates and stores a password reset token for a user
 * @param userId - The ID of the user to generate a reset token for
 * @returns The generated reset token
 */
export async function createPasswordResetToken(userId: string): Promise<string> {
  const token = generateToken();
  const expiry = new Date();
  expiry.setHours(expiry.getHours() + 1); // Reset token valid for 1 hour

  await db.update(users)
    .set({
      resetPasswordToken: token,
      resetPasswordExpiry: expiry
    })
    .where(eq(users.id, userId));

  return token;
}

/**
 * Verifies a user's email using the verification token
 * @param token - The verification token to validate
 * @returns Boolean indicating if the verification was successful
 */
export async function verifyEmail(token: string): Promise<boolean> {
  const now = new Date();
  
  // Find user with the given token that hasn't expired
  const result = await db.select()
    .from(users)
    .where(
      eq(users.verificationToken, token)
    );

  if (result.length === 0) {
    return false;
  }

  const user = result[0];
  
  // Check if token is expired
  if (!user.verificationTokenExpiry || user.verificationTokenExpiry < now) {
    return false;
  }

  // Update user record as verified
  await db.update(users)
    .set({
      emailVerified: true,
      verificationToken: null,
      verificationTokenExpiry: null
    })
    .where(eq(users.id, user.id));

  return true;
}

/**
 * Verifies a password reset token
 * @param token - The reset token to validate
 * @returns The user ID if valid, null otherwise
 */
export async function verifyPasswordResetToken(token: string): Promise<string | null> {
  const now = new Date();
  
  // Find user with the given token that hasn't expired
  const result = await db.select()
    .from(users)
    .where(
      eq(users.resetPasswordToken, token)
    );

  if (result.length === 0) {
    return null;
  }

  const user = result[0];
  
  // Check if token is expired
  if (!user.resetPasswordExpiry || user.resetPasswordExpiry < now) {
    return null;
  }

  return user.id;
}

/**
 * Sends an email
 * @param to - Recipient email address
 * @param subject - Email subject
 * @param text - Plain text content
 * @param html - HTML content
 */
export async function sendEmail(to: string, subject: string, text: string, html: string): Promise<void> {
  const msg = {
    to,
    from: process.env.FROM_EMAIL || 'no-reply@example.com',
    subject,
    text,
    html,
  };

  try {
    await sgMail.send(msg);
  } catch (error) {
    console.error('Error sending email:', error);
    throw new Error('Failed to send email');
  }
}
