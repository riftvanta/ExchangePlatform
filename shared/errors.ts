/**
 * USDT-JOD Exchange Error Handling System
 * This module defines the error types and utilities for consistent error handling across the application.
 */

/**
 * Base error class that all application errors extend from
 * Preserves stack trace and provides consistent error structure
 */
export class AppError extends Error {
  public readonly code: string;
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly context?: Record<string, any>;

  constructor({
    message,
    code = 'INTERNAL_ERROR',
    statusCode = 500,
    isOperational = true,
    context = {},
  }: {
    message: string;
    code?: string;
    statusCode?: number;
    isOperational?: boolean;
    context?: Record<string, any>;
  }) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.statusCode = statusCode;
    this.isOperational = isOperational; // Operational errors are expected and can be handled gracefully
    this.context = context;

    // Ensures proper stack trace for debugging (maintains proper error wrapping)
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Authentication errors (401 Unauthorized)
 */
export class AuthenticationError extends AppError {
  constructor({
    message = 'Authentication required',
    code = 'AUTHENTICATION_REQUIRED',
    context = {},
  }: {
    message?: string;
    code?: string;
    context?: Record<string, any>;
  } = {}) {
    super({
      message,
      code,
      statusCode: 401,
      isOperational: true,
      context,
    });
  }
}

/**
 * Authorization errors (403 Forbidden)
 */
export class AuthorizationError extends AppError {
  constructor({
    message = 'You do not have permission to perform this action',
    code = 'FORBIDDEN',
    context = {},
  }: {
    message?: string;
    code?: string;
    context?: Record<string, any>;
  } = {}) {
    super({
      message,
      code,
      statusCode: 403,
      isOperational: true,
      context,
    });
  }
}

/**
 * Validation errors (400 Bad Request)
 */
export class ValidationError extends AppError {
  public readonly errors: Record<string, string[]>;

  constructor({
    message = 'Validation failed',
    code = 'VALIDATION_ERROR',
    errors = {},
    context = {},
  }: {
    message?: string;
    code?: string;
    errors?: Record<string, string[]>;
    context?: Record<string, any>;
  } = {}) {
    super({
      message,
      code,
      statusCode: 400,
      isOperational: true,
      context,
    });
    this.errors = errors;
  }
}

/**
 * Not Found errors (404 Not Found)
 */
export class NotFoundError extends AppError {
  constructor({
    message = 'Resource not found',
    code = 'NOT_FOUND',
    resource,
    context = {},
  }: {
    message?: string;
    code?: string;
    resource?: string;
    context?: Record<string, any>;
  } = {}) {
    const formattedMessage = resource 
      ? `${resource} not found` 
      : message;
    
    super({
      message: formattedMessage,
      code,
      statusCode: 404,
      isOperational: true,
      context,
    });
  }
}

/**
 * Conflict errors (409 Conflict)
 */
export class ConflictError extends AppError {
  constructor({
    message = 'Resource already exists',
    code = 'CONFLICT',
    context = {},
  }: {
    message?: string;
    code?: string;
    context?: Record<string, any>;
  } = {}) {
    super({
      message,
      code,
      statusCode: 409,
      isOperational: true,
      context,
    });
  }
}

/**
 * Business Logic errors (422 Unprocessable Entity)
 * Used for errors related to business rules that prevent processing
 */
export class BusinessError extends AppError {
  constructor({
    message,
    code = 'BUSINESS_RULE_VIOLATION',
    context = {},
  }: {
    message: string;
    code?: string;
    context?: Record<string, any>;
  }) {
    super({
      message,
      code,
      statusCode: 422,
      isOperational: true,
      context,
    });
  }
}

/**
 * External service errors (502 Bad Gateway)
 * Used when an external API or service dependency fails
 */
export class ExternalServiceError extends AppError {
  constructor({
    message = 'External service error',
    code = 'EXTERNAL_SERVICE_ERROR',
    service,
    context = {},
  }: {
    message?: string;
    code?: string;
    service?: string;
    context?: Record<string, any>;
  } = {}) {
    const formattedMessage = service 
      ? `Error with external service: ${service}` 
      : message;
    
    super({
      message: formattedMessage,
      code,
      statusCode: 502,
      isOperational: true,
      context,
    });
  }
}

/**
 * Database errors 
 */
export class DatabaseError extends AppError {
  constructor({
    message = 'Database operation failed',
    code = 'DATABASE_ERROR',
    operation,
    context = {},
  }: {
    message?: string;
    code?: string;
    operation?: string;
    context?: Record<string, any>;
  } = {}) {
    const formattedMessage = operation 
      ? `Database operation failed: ${operation}` 
      : message;
    
    super({
      message: formattedMessage,
      code,
      statusCode: 500,
      isOperational: false, // Database errors are often not operational
      context,
    });
  }
}

/**
 * Wallet specific errors
 */
export class WalletError extends AppError {
  constructor({
    message,
    code = 'WALLET_ERROR',
    context = {},
  }: {
    message: string;
    code?: string;
    context?: Record<string, any>;
  }) {
    super({
      message,
      code,
      statusCode: 400,
      isOperational: true,
      context,
    });
  }
}

/**
 * Transaction specific errors
 */
export class TransactionError extends AppError {
  constructor({
    message,
    code = 'TRANSACTION_ERROR',
    context = {},
  }: {
    message: string;
    code?: string;
    context?: Record<string, any>;
  }) {
    super({
      message,
      code,
      statusCode: 400,
      isOperational: true,
      context,
    });
  }
}

/**
 * Error utility functions
 */

/**
 * Safely extract error message from any type of thrown error
 * @param error The caught error object
 * @returns A proper error message string
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof AppError) {
    return error.message;
  }
  
  if (error instanceof Error) {
    return error.message;
  }
  
  if (typeof error === 'string') {
    return error;
  }
  
  return 'An unknown error occurred';
}

/**
 * Create a standardized error response object
 * @param error The error object
 * @returns A standardized error response object
 */
export function createErrorResponse(error: unknown) {
  if (error instanceof AppError) {
    return {
      error: {
        message: error.message,
        code: error.code,
        ...(error instanceof ValidationError && { errors: error.errors }),
        ...(process.env.NODE_ENV !== 'production' && { stack: error.stack }),
      }
    };
  }
  
  if (error instanceof Error) {
    return {
      error: {
        message: error.message || 'An unexpected error occurred',
        code: 'INTERNAL_ERROR',
        ...(process.env.NODE_ENV !== 'production' && { stack: error.stack }),
      }
    };
  }
  
  return {
    error: {
      message: 'An unexpected error occurred',
      code: 'INTERNAL_ERROR',
    }
  };
} 