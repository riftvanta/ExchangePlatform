import { Request, Response, NextFunction, RequestHandler } from 'express';

/**
 * Middleware to check if user is authenticated
 * Used to protect routes that require authentication
 */
export const isAuthenticated = (async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (req.session.userId) {
    return next();
  }
  return res.status(401).json({ error: 'Authentication required' });
}) as RequestHandler; 