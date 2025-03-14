import React from 'react';
import { toast, ToastOptions, ToastContainer as ToastifyContainer } from 'react-toastify';
import { motion, AnimatePresence, HTMLMotionProps } from 'framer-motion';
import { cva, type VariantProps } from 'class-variance-authority';
import { 
  InformationCircleIcon, 
  CheckCircleIcon, 
  ExclamationCircleIcon, 
  ExclamationTriangleIcon, 
  XMarkIcon 
} from '@heroicons/react/20/solid';

// Custom toast variants using class-variance-authority
const toastVariants = cva(
  "flex w-full p-4 rounded-md shadow-md border text-sm",
  {
    variants: {
      variant: {
        info: "bg-primary-50 text-primary-800 border-primary-200",
        success: "bg-success-50 text-success-800 border-success-200",
        warning: "bg-warning-50 text-warning-800 border-warning-200",
        error: "bg-error-50 text-error-800 border-error-200",
      },
    },
    defaultVariants: {
      variant: "info",
    },
  }
);

// Toast component props
export interface ToastProps 
  extends Omit<HTMLMotionProps<"div">, 'animate' | 'initial' | 'exit' | 'variants'>,
    VariantProps<typeof toastVariants> {
  message: string;
  onClose?: () => void;
}

// Animation variants
const toastAnimationVariants = {
  initial: { opacity: 0, y: -10, scale: 0.95 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, scale: 0.95, transition: { duration: 0.1 } }
};

// Toast component
export const ToastComponent: React.FC<ToastProps> = ({ 
  message, 
  variant, 
  className, 
  onClose, 
  ...props 
}) => {
  // Default icons based on variant
  const getIcon = () => {
    switch (variant) {
      case 'info':
        return <InformationCircleIcon className="h-5 w-5 text-primary-500 flex-shrink-0" />;
      case 'success':
        return <CheckCircleIcon className="h-5 w-5 text-success-500 flex-shrink-0" />;
      case 'warning':
        return <ExclamationTriangleIcon className="h-5 w-5 text-warning-500 flex-shrink-0" />;
      case 'error':
        return <ExclamationCircleIcon className="h-5 w-5 text-error-500 flex-shrink-0" />;
      default:
        return <InformationCircleIcon className="h-5 w-5 text-primary-500 flex-shrink-0" />;
    }
  };

  return (
    <motion.div
      initial="initial"
      animate="animate"
      exit="exit"
      variants={toastAnimationVariants}
      className={toastVariants({ variant, className })}
      {...props}
    >
      <div className="flex w-full">
        <div className="flex-shrink-0 mr-3">
          {getIcon()}
        </div>
        <div className="flex-1 pt-0.5">
          {message}
        </div>
        {onClose && (
          <div className="ml-auto pl-3">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex rounded-md p-1.5 focus:outline-none focus:ring-2 focus:ring-offset-2"
              aria-label="Dismiss"
            >
              <XMarkIcon className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
};

// Toast container component that wraps ToastContainer
export const ToastContainer: React.FC = () => {
  return (
    <ToastifyContainer
      position="top-right"
      autoClose={5000}
      hideProgressBar={false}
      newestOnTop
      closeOnClick
      rtl={false}
      pauseOnFocusLoss
      draggable
      pauseOnHover
    />
  );
};

// Toast utilities for showing different types of toasts
interface ToastUtils {
  info: (message: string, options?: ToastOptions) => React.ReactText;
  success: (message: string, options?: ToastOptions) => React.ReactText;
  warning: (message: string, options?: ToastOptions) => React.ReactText;
  error: (message: string, options?: ToastOptions) => React.ReactText;
}

// Custom toast function with our styled component
export const customToast: ToastUtils = {
  info: (message, options = {}) => 
    toast.info(
      <ToastComponent message={message} variant="info" />,
      options
    ),
  success: (message, options = {}) => 
    toast.success(
      <ToastComponent message={message} variant="success" />,
      options
    ),
  warning: (message, options = {}) => 
    toast.warning(
      <ToastComponent message={message} variant="warning" />,
      options
    ),
  error: (message, options = {}) => 
    toast.error(
      <ToastComponent message={message} variant="error" />,
      options
    ),
};

// Re-export toast for convenience
export { toast }; 