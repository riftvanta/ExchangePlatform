import React from 'react';
import { ApiError, ERROR_MESSAGES, getUserFriendlyMessage } from '../lib/errorHandler';

/**
 * Props for the ErrorDisplay component
 */
interface ErrorDisplayProps {
  error: ApiError | string | null;
  variant?: 'alert' | 'inline' | 'toast';
  className?: string;
  onDismiss?: () => void;
}

/**
 * A reusable component for displaying errors to users
 * @param error The error to display
 * @param variant The visual styling variant
 * @param className Additional CSS classes
 * @param onDismiss Optional callback for dismissing the error
 */
const ErrorDisplay: React.FC<ErrorDisplayProps> = ({
  error,
  variant = 'alert',
  className = '',
  onDismiss,
}) => {
  if (!error) return null;

  let message: string;
  let errorCode: string | undefined;
  
  if (typeof error === 'string') {
    message = error;
  } else {
    message = getUserFriendlyMessage(error);
    errorCode = error.code;
    
    // Use friendly message mapping if available
    if (errorCode && ERROR_MESSAGES[errorCode as keyof typeof ERROR_MESSAGES]) {
      message = ERROR_MESSAGES[errorCode as keyof typeof ERROR_MESSAGES];
    }
  }

  // Different styling based on variant
  let variantClasses = '';
  let icon = null;
  
  switch (variant) {
    case 'inline':
      variantClasses = 'text-red-500 text-sm py-1';
      icon = (
        <svg className="inline-block w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
        </svg>
      );
      break;
    case 'toast':
      variantClasses = 'bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded fixed top-4 right-4 z-50 shadow-md max-w-md';
      icon = (
        <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
        </svg>
      );
      break;
    case 'alert':
    default:
      variantClasses = 'bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative';
      icon = (
        <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
        </svg>
      );
  }

  return (
    <div className={`error-display ${variantClasses} ${className}`} role="alert">
      <div className="flex items-center">
        {icon}
        <span>{message}</span>
      </div>
      
      {onDismiss && variant !== 'inline' && (
        <button
          className="absolute top-0 bottom-0 right-0 px-4 py-3"
          onClick={onDismiss}
          aria-label="Close"
        >
          <svg className="fill-current h-6 w-6 text-red-500" role="button" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
        </button>
      )}
    </div>
  );
};

export default ErrorDisplay; 