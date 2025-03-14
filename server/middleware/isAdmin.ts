import { Request, Response, NextFunction } from 'express';
import { getUserById } from '../storage'; // Import getUserById
import { AuthorizationError } from '../../shared/errors';

/**
 * Middleware to check if user is an admin
 * Requires isAuthenticated middleware to run first
 */
export const isAdmin = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        // We need to have userId in the session
        if (!req.session.userId) {
            throw new AuthorizationError({
                message: 'Authentication required to access admin resources',
                code: 'ADMIN_AUTH_REQUIRED'
            });
        }

        // Get user from database
        const user = await getUserById(req.session.userId);

        // Check if user is admin
        if (!user || !user.isAdmin) {
            throw new AuthorizationError({
                message: 'Admin privileges required to access this resource',
                code: 'ADMIN_PRIVILEGES_REQUIRED',
                context: { userId: req.session.userId }
            });
        }

        // If user is admin, call next middleware
        next();
    } catch (error) {
        next(error);
    }
};
