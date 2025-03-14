import React from 'react';
import Typography, { TypographyProps } from '@mui/joy/Typography';

/**
 * A Joy UI based Typography component for consistent text styling
 */
export default function AppTypography({ 
  children,
  level = 'body-md',
  ...props 
}: TypographyProps) {
  return (
    <Typography
      level={level}
      {...props}
    >
      {children}
    </Typography>
  );
} 