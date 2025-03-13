import { scryptSync, randomBytes } from 'crypto';
import { createUser, getUserByEmail } from './storage';
import { NewUsers, Users } from '../shared/types';

/**
 * Registers a new user with secure password hashing
 * @param newUserData - The user data including email and password
 * @returns The created user
 * @throws Error if the email is already registered
 */
export async function registerUser(newUserData: NewUsers) {
    try {
        // Generate a random salt
        const salt = randomBytes(16).toString('hex');

        // Hash the password with the salt using scrypt
        const hashedPassword = scryptSync(
            newUserData.password as string,
            salt,
            64
        ).toString('hex');

        // Create a new user object with the hashed password
        const newUser = {
            ...newUserData,
            password: hashedPassword,
            salt,
        };

        // Save the user to the database
        const user = await createUser(newUser);

        return user;
    } catch (error: any) {
        // Check if the error is due to a duplicate email
        if (
            error.message &&
            error.message.includes(
                'duplicate key value violates unique constraint'
            ) &&
            error.message.includes('users_email_unique')
        ) {
            throw new Error('Email already registered');
        }

        // Re-throw any other errors
        throw error;
    }
}

/**
 * Authenticates a user by email and password
 * @param email - The user's email address
 * @param password - The user's password
 * @returns The authenticated user
 * @throws Error if credentials are invalid
 */
export async function loginUser(
    email: string,
    password: string
): Promise<Users> {
    // Retrieve user from the database
    const user = await getUserByEmail(email);

    // If user not found, throw error
    if (!user) {
        throw new Error('Invalid credentials');
    }

    // Hash the provided password with the stored salt
    const hashedPassword = scryptSync(password, user.salt, 64).toString('hex');

    // Compare the hashed password with the stored password
    if (hashedPassword !== user.password) {
        throw new Error('Invalid credentials');
    }

    // Return the user if authentication is successful
    return user;
}
