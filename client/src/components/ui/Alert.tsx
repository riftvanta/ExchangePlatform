import React from 'react';
import Alert from '@mui/joy/Alert';
import { getJoyProps } from '../../styles/compatibility';

// Define props interface
interface AppAlertProps extends React.ComponentProps<typeof Alert> {
  className?: string;
  children: React.ReactNode;
}

/**
 * A Joy UI based Alert component that maintains compatibility with existing className patterns
 * This component can be used as a drop-in replacement for existing alerts
 */
export default function AppAlert({ 
  className, 
  children,
  color,
  variant,
  size,
  ...props 
}: AppAlertProps) {
  // Get Joy UI props from the className
  const joyProps = getJoyProps(className);
  
  // Map existing alert classes to Joy UI color props
  let alertColor = color || joyProps.color;
  
  // If not explicitly defined and contains certain text in className, infer the color
  if (!alertColor && className) {
    if (className.includes('success')) alertColor = 'success';
    else if (className.includes('error')) alertColor = 'danger';
    else if (className.includes('warning')) alertColor = 'warning';
    else if (className.includes('info')) alertColor = 'primary';
  }
  
  return (
    <Alert
      variant={variant || joyProps.variant || 'soft'}
      color={alertColor || 'primary'}
      size={size || joyProps.size || 'md'}
      {...props}
    >
      {children}
    </Alert>
  );
} 