import React from 'react';
import Input from '@mui/joy/Input';
import { getJoyProps } from '../../styles/compatibility';

interface AppInputProps extends Omit<React.ComponentProps<typeof Input>, 'size'> {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

/**
 * A Joy UI based Input component that maintains compatibility with existing input elements
 * This component can be used as a drop-in replacement for existing input fields
 */
export default function AppInput({ 
  className, 
  size = 'md',
  variant = 'outlined',
  ...props 
}: AppInputProps) {
  // Get Joy UI props from the className
  const joyProps = getJoyProps(className);
  
  return (
    <Input
      variant={variant || joyProps.variant || 'outlined'}
      size={size || joyProps.size || 'md'}
      {...props}
    />
  );
} 