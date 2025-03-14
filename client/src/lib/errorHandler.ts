/**
 * Error types for client-side error handling
 */
export interface ApiError {
  message: string;
  code: string;
  errors?: Record<string, string[]>;
  stack?: string;
}

export interface ApiErrorResponse {
  error: ApiError;
}

/**
 * Parse API error responses into a consistent format
 * @param error The error to parse (from fetch or any other source)
 * @returns A formatted error object with consistent structure
 */
export async function parseApiError(error: any): Promise<ApiError> {
  try {
    // If the error is from a fetch response
    if (error.json && typeof error.json === 'function') {
      try {
        const data = await error.json();
        return data.error || {
          message: error.statusText || 'An error occurred',
          code: 'API_ERROR',
        };
      } catch (jsonError) {
        // If parsing JSON fails, return a generic error
        return {
          message: error.statusText || 'An error occurred',
          code: 'API_ERROR',
        };
      }
    }
    
    // If error is already in our format
    if (error.error && error.error.message) {
      return error.error;
    }
    
    // If error is an object with a message property
    if (error.message) {
      return {
        message: error.message,
        code: error.code || 'UNKNOWN_ERROR',
      };
    }
    
    // For any other type of error
    return {
      message: 'An unexpected error occurred',
      code: 'UNKNOWN_ERROR',
    };
  } catch {
    // Fallback error if anything goes wrong during parsing
    return {
      message: 'Failed to process error information',
      code: 'ERROR_PARSING_FAILED',
    };
  }
}

/**
 * Convert validation errors to form errors
 * @param apiError The API error response
 * @returns Form errors object or null if no validation errors
 */
export function getFormErrors(apiError: ApiError): Record<string, string> | null {
  if (!apiError.errors) {
    return null;
  }
  
  // Convert array of error messages to single messages
  const formErrors: Record<string, string> = {};
  
  Object.entries(apiError.errors).forEach(([field, messages]) => {
    formErrors[field] = messages.join('. ');
  });
  
  return formErrors;
}

/**
 * Get a user-friendly error message
 * @param error The error object
 * @returns A user-friendly error message
 */
export function getUserFriendlyMessage(error: ApiError | unknown): string {
  if (typeof error === 'object' && error !== null && 'message' in error) {
    return error.message as string;
  }
  
  if (typeof error === 'string') {
    return error;
  }
  
  return 'An unexpected error occurred. Please try again later.';
}

/**
 * Error handling constants for better user experience
 */
export const ERROR_MESSAGES = {
  // Authentication errors
  AUTHENTICATION_REQUIRED: 'Please log in to continue',
  INVALID_CREDENTIALS: 'Invalid email or password. Please try again.',
  SESSION_EXPIRED: 'Your session has expired. Please log in again.',
  
  // Authorization errors
  FORBIDDEN: 'You don\'t have permission to access this resource',
  ADMIN_REQUIRED: 'This action requires administrator privileges',
  
  // Validation errors
  VALIDATION_ERROR: 'Please check the form for errors',
  EMAIL_ALREADY_EXISTS: 'An account with this email already exists',
  WALLET_ALREADY_EXISTS: 'You already have a wallet for this currency',
  
  // Transaction errors
  INSUFFICIENT_FUNDS: 'Insufficient funds for this transaction',
  TRANSACTION_FAILED: 'Transaction failed. Please try again later.',
  
  // System errors
  NETWORK_ERROR: 'Network connection issue. Please check your internet connection.',
  SERVER_ERROR: 'Server error. Our team has been notified.',
  MAINTENANCE: 'System is currently under maintenance. Please try again later.',
  
  // Fallback error
  DEFAULT: 'An error occurred. Please try again or contact support.'
}; 