import React from 'react';
import Button from '@mui/joy/Button';
import { getJoyProps } from '../../styles/compatibility';

// Define props interface that includes all props from Joy UI Button
// plus a className prop for compatibility with existing code
interface AppButtonProps extends React.ComponentProps<typeof Button> {
  className?: string;
  children: React.ReactNode;
}

/**
 * A Joy UI based button component that maintains compatibility with existing className patterns
 * This component can be used as a drop-in replacement for existing buttons
 */
export default function AppButton({ 
  className, 
  children,
  variant,
  color,
  size,
  ...props 
}: AppButtonProps) {
  // Get Joy UI props from the className
  const joyProps = getJoyProps(className);
  
  return (
    <Button
      // Apply props in order of priority:
      // 1. Explicit props passed to the component (highest priority)
      // 2. Props derived from className via compatibility layer
      // 3. Default props (lowest priority)
      variant={variant || joyProps.variant || 'solid'}
      color={color || joyProps.color || 'primary'}
      size={size || joyProps.size || 'md'}
      {...props}
    >
      {children}
    </Button>
  );
} 