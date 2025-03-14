import { Request, Response, NextFunction, ErrorRequestHandler } from 'express';
import { 
  AppError, 
  createErrorResponse, 
  getErrorMessage,
  ValidationError
} from '../../shared/errors';

/**
 * Global error handling middleware for Express
 * Catches all errors and formats them consistently before sending to client
 */
export const errorHandler: ErrorRequestHandler = (
  err: Error | AppError | unknown,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next: NextFunction
) => {
  // Log the error for debugging and monitoring
  console.error('Error caught by global handler:', err);
  
  // Process Drizzle ORM database errors
  if (err instanceof Error && err.message.includes('duplicate key value violates unique constraint')) {
    // Handle database constraint violations
    if (err.message.includes('user_currency_unique')) {
      res.status(409).json(createErrorResponse(
        new ValidationError({
          message: 'You already have a wallet for this currency',
          code: 'WALLET_ALREADY_EXISTS',
          errors: { currency: ['Wallet already exists for this currency'] }
        })
      ));
      return;
    }
    
    if (err.message.includes('users_email_key')) {
      res.status(409).json(createErrorResponse(
        new ValidationError({
          message: 'Account with this email already exists',
          code: 'EMAIL_ALREADY_EXISTS',
          errors: { email: ['Account with this email already exists'] }
        })
      ));
      return;
    }
  }

  // If AppError, use its status code
  if (err instanceof AppError) {
    res.status(err.statusCode).json(createErrorResponse(err));
    return;
  }

  // For regular Errors, treat as 500 Internal Server Error
  if (err instanceof Error) {
    const errorResponse = createErrorResponse(err);
    
    // Only include stack trace in non-production environments
    if (process.env.NODE_ENV !== 'production') {
      errorResponse.error.stack = err.stack;
    }
    
    res.status(500).json(errorResponse);
    return;
  }

  // For unknown error types, return a generic error
  res.status(500).json({
    error: {
      message: 'An unexpected error occurred',
      code: 'INTERNAL_ERROR',
    },
  });
};

/**
 * Handle 404 Not Found errors for routes that don't exist
 */
export function notFoundHandler(req: Request, res: Response) {
  res.status(404).json({
    error: {
      message: `Route not found: ${req.method} ${req.originalUrl}`,
      code: 'ROUTE_NOT_FOUND',
    },
  });
}

/**
 * Async error wrapper to avoid try-catch blocks in routes
 * @param fn An async route handler function
 * @returns A wrapped route handler that catches errors
 */
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
} 