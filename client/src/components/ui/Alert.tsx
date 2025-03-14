import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { 
  InformationCircleIcon, 
  CheckCircleIcon, 
  ExclamationCircleIcon, 
  ExclamationTriangleIcon, 
  XMarkIcon 
} from '@heroicons/react/20/solid';

export const alertVariants = cva(
  "relative w-full rounded-lg border p-4 mb-4",
  {
    variants: {
      variant: {
        default: "bg-white border-neutral-200 text-neutral-800",
        info: "bg-blue-50 border-blue-200 text-blue-800",
        success: "bg-success-50 border-success-200 text-success-800",
        warning: "bg-warning-50 border-warning-200 text-warning-800",
        error: "bg-error-50 border-error-200 text-error-800",
      },
      dismissible: {
        true: "pr-12", // Extra padding on the right for the close button
      },
    },
    defaultVariants: {
      variant: "default",
      dismissible: false,
    },
  }
);

export interface AlertProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof alertVariants> {
  title?: string;
  icon?: React.ReactNode;
  onDismiss?: () => void;
}

export const Alert = ({
  className = '',
  variant = 'default',
  dismissible = false,
  title,
  children,
  icon,
  onDismiss,
  ...props
}: AlertProps) => {
  // Default icons based on variant
  const getDefaultIcon = () => {
    switch (variant) {
      case 'info':
        return <InformationCircleIcon className="h-5 w-5 text-primary-400" aria-hidden="true" />;
      case 'success':
        return <CheckCircleIcon className="h-5 w-5 text-success-400" aria-hidden="true" />;
      case 'warning':
        return <ExclamationTriangleIcon className="h-5 w-5 text-warning-400" aria-hidden="true" />;
      case 'error':
        return <ExclamationCircleIcon className="h-5 w-5 text-error-400" aria-hidden="true" />;
      default:
        return <InformationCircleIcon className="h-5 w-5 text-primary-400" aria-hidden="true" />;
    }
  };

  return (
    <div
      role="alert"
      className={alertVariants({ variant, dismissible, className })}
      {...props}
    >
      <div className="flex">
        {(icon || getDefaultIcon()) && (
          <div className="flex-shrink-0 mr-3">
            {icon || getDefaultIcon()}
          </div>
        )}
        <div className={onDismiss ? 'flex-1' : ''}>
          {title && (
            <h3 className="text-sm font-medium mb-1">{title}</h3>
          )}
          <div className="text-sm">
            {children}
          </div>
        </div>
        {dismissible && onDismiss && (
          <div className="absolute top-4 right-4">
            <div className="-my-1.5">
              <button
                type="button"
                onClick={onDismiss}
                className="inline-flex rounded-md p-1.5 text-neutral-500 hover:bg-neutral-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
                aria-label="Close alert"
              >
                <XMarkIcon className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Alert; 