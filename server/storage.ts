import db from './db';
import { users } from '../shared/schema';
import { NewUsers, Users } from '../shared/types';
import { eq } from 'drizzle-orm';

/**
 * Creates a new user in the database
 * @param newUser - The user data to insert
 * @returns The created user with all fields (including generated ID)
 */
export async function createUser(newUser: NewUsers): Promise<Users> {
  const result = await db.insert(users).values(newUser).returning();
  return result[0];
}

/**
 * Finds a user by their email address
 * @param email - The email address to search for
 * @returns The user if found, null otherwise
 */
export async function getUserByEmail(email: string): Promise<Users | null> {
  const user = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .then((rows) => rows[0] ?? null);

  return user;
}

/**
 * Finds a user by their ID
 * @param id - The user ID to search for
 * @returns The user if found, null otherwise
 */
export async function getUserById(id: string): Promise<Users | null> {
  const user = await db
    .select()
    .from(users)
    .where(eq(users.id, id))
    .then((rows) => rows[0] ?? null);

  return user;
}
