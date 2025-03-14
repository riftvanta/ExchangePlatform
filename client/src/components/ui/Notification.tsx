import React from 'react';
import { toast, ToastOptions, ToastContainer, TypeOptions, ToastPosition } from 'react-toastify';
import { Box, Typography } from './index';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import InfoIcon from '@mui/icons-material/Info';
import WarningIcon from '@mui/icons-material/Warning';
import CloseIcon from '@mui/icons-material/Close';

// Define the theme-based colors for notifications
const notificationColors = {
  success: {
    background: 'var(--joy-palette-success-softBg)',
    border: 'var(--joy-palette-success-outlinedBorder)',
    color: 'var(--joy-palette-success-plainColor)',
    iconColor: 'var(--joy-palette-success-plainColor)',
  },
  error: {
    background: 'var(--joy-palette-danger-softBg)',
    border: 'var(--joy-palette-danger-outlinedBorder)',
    color: 'var(--joy-palette-danger-plainColor)',
    iconColor: 'var(--joy-palette-danger-plainColor)',
  },
  info: {
    background: 'var(--joy-palette-primary-softBg)',
    border: 'var(--joy-palette-primary-outlinedBorder)',
    color: 'var(--joy-palette-primary-plainColor)',
    iconColor: 'var(--joy-palette-primary-plainColor)',
  },
  warning: {
    background: 'var(--joy-palette-warning-softBg)',
    border: 'var(--joy-palette-warning-outlinedBorder)',
    color: 'var(--joy-palette-warning-plainColor)',
    iconColor: 'var(--joy-palette-warning-plainColor)',
  },
};

interface NotificationProps {
  message: string;
  title?: string;
  type?: 'success' | 'error' | 'info' | 'warning';
  autoClose?: number | false;
  position?: ToastOptions['position'];
  closeOnClick?: boolean;
  pauseOnHover?: boolean;
  draggable?: boolean;
  icon?: React.ReactNode;
}

// Custom content component for toasts
const ToastContent = ({ 
  message, 
  title, 
  type = 'info',
  icon 
}: { 
  message: string; 
  title?: string; 
  type: 'success' | 'error' | 'info' | 'warning';
  icon?: React.ReactNode;
}) => {
  // Default icons by type
  const getDefaultIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircleIcon />;
      case 'error':
        return <ErrorIcon />;
      case 'warning':
        return <WarningIcon />;
      case 'info':
      default:
        return <InfoIcon />;
    }
  };

  const displayIcon = icon || getDefaultIcon();
  const colors = notificationColors[type];

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 1.5,
      }}
    >
      <Box
        sx={{
          color: colors.iconColor,
          pt: 0.25,
        }}
      >
        {displayIcon}
      </Box>
      <Box sx={{ flex: 1 }}>
        {title && (
          <Typography
            level="title-sm"
            sx={{ color: colors.color, mb: 0.5 }}
          >
            {title}
          </Typography>
        )}
        <Typography
          level="body-sm"
          sx={{ color: colors.color }}
        >
          {message}
        </Typography>
      </Box>
    </Box>
  );
};

// Custom close button for toasts
const CloseButton = ({ closeToast }: { closeToast?: () => void }) => (
  <Box
    onClick={closeToast}
    sx={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      cursor: 'pointer',
      color: 'var(--joy-palette-text-tertiary)',
      '&:hover': {
        color: 'var(--joy-palette-text-primary)',
      },
      pt: 0.25,
    }}
  >
    <CloseIcon fontSize="small" />
  </Box>
);

// Toast Container component styled with Joy UI
export const NotificationContainer = () => (
  <ToastContainer
    position="top-right"
    hideProgressBar
    closeButton={CloseButton}
    toastClassName={(context) => {
      const type = context?.type || 'default';
      const validType = ['success', 'error', 'info', 'warning'].includes(type) 
        ? type as keyof typeof notificationColors 
        : 'info';
      
      return 'bg-transparent shadow-none p-0 min-h-0 mb-3';
    }}
    className="p-0"
    theme="light"
  />
);

// Function to show notifications
export const showNotification = ({
  message,
  title,
  type = 'info',
  autoClose = 5000,
  position = 'top-right',
  closeOnClick = true,
  pauseOnHover = true,
  draggable = false,
  icon,
}: NotificationProps) => {
  const content = (
    <ToastContent
      message={message}
      title={title}
      type={type}
      icon={icon}
    />
  );

  const toastOptions: ToastOptions = {
    autoClose,
    position,
    closeOnClick,
    pauseOnHover,
    draggable,
    closeButton: true,
    style: {
      background: notificationColors[type].background,
      border: `1px solid ${notificationColors[type].border}`,
      borderRadius: '8px',
      padding: '12px',
      width: '100%',
      maxWidth: '400px',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
    },
  };

  switch (type) {
    case 'success':
      return toast.success(content, toastOptions);
    case 'error':
      return toast.error(content, toastOptions);
    case 'warning':
      return toast.warning(content, toastOptions);
    case 'info':
    default:
      return toast.info(content, toastOptions);
  }
};

export default {
  success: (message: string, title?: string, options?: Partial<NotificationProps>) => 
    showNotification({ message, title, type: 'success', ...options }),
  error: (message: string, title?: string, options?: Partial<NotificationProps>) => 
    showNotification({ message, title, type: 'error', ...options }),
  warning: (message: string, title?: string, options?: Partial<NotificationProps>) => 
    showNotification({ message, title, type: 'warning', ...options }),
  info: (message: string, title?: string, options?: Partial<NotificationProps>) => 
    showNotification({ message, title, type: 'info', ...options }),
}; 