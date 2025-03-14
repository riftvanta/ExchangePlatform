import React from 'react';
import FormControl from '@mui/joy/FormControl';
import FormLabel from '@mui/joy/FormLabel';
import FormHelperText from '@mui/joy/FormHelperText';
import { getJoyProps } from '../../styles/compatibility';

interface AppFormControlProps extends React.ComponentProps<typeof FormControl> {
  className?: string;
  label?: string;
  helperText?: string;
  error?: boolean;
  errorText?: string;
  children: React.ReactNode;
}

/**
 * A Joy UI based FormControl component that maintains compatibility with existing form-group classes
 * This component can be used as a drop-in replacement for existing form groups
 */
export default function AppFormControl({ 
  className, 
  children,
  label,
  helperText,
  error = false,
  errorText,
  ...props 
}: AppFormControlProps) {
  // Get Joy UI props from the className
  const joyProps = getJoyProps(className);
  
  return (
    <FormControl
      error={error}
      sx={{ mb: 2, ...(props.sx || {}) }}
      {...joyProps}
      {...props}
    >
      {label && <FormLabel>{label}</FormLabel>}
      {children}
      {(helperText || (error && errorText)) && (
        <FormHelperText>{error ? errorText : helperText}</FormHelperText>
      )}
    </FormControl>
  );
} 