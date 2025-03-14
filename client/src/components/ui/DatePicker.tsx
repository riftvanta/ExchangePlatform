import React from 'react';
import { DatePicker as MuiDatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import FormControl from '@mui/joy/FormControl';
import FormLabel from '@mui/joy/FormLabel';
import FormHelperText from '@mui/joy/FormHelperText';
import { getJoyProps } from '../../styles/compatibility';
import Input from '@mui/joy/Input';

interface DatePickerProps {
  className?: string;
  label?: string;
  value: Date | null;
  onChange: (date: Date | null) => void;
  error?: boolean;
  errorText?: string;
  helperText?: string;
  placeholder?: string;
  minDate?: Date;
  maxDate?: Date;
  format?: string;
  disabled?: boolean;
  required?: boolean;
  slotProps?: {
    textField?: any;
    field?: any;
  };
}

/**
 * A Joy UI styled DatePicker component using MUI X Date Pickers
 * This component provides a standardized date selection experience
 */
export default function AppDatePicker({
  className,
  label,
  value,
  onChange,
  error = false,
  errorText,
  helperText,
  placeholder = 'MM/DD/YYYY',
  minDate,
  maxDate,
  format = 'MM/dd/yyyy',
  disabled = false,
  required = false,
  slotProps,
  ...props
}: DatePickerProps) {
  // Get Joy UI props from the className
  const joyProps = getJoyProps(className);

  // Combine slot props with Joy UI styling
  const combinedSlotProps = {
    textField: {
      ...slotProps?.textField,
      fullWidth: true,
      variant: 'outlined',
      size: 'md',
      error,
      ...(joyProps || {}),
    },
    field: {
      ...slotProps?.field,
    }
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <FormControl
        error={error}
        sx={{ mb: 2, width: '100%' }}
        {...joyProps}
      >
        {label && <FormLabel>{label}{required && ' *'}</FormLabel>}
        <MuiDatePicker
          value={value}
          onChange={onChange}
          format={format}
          minDate={minDate}
          maxDate={maxDate}
          disabled={disabled}
          slots={{
            textField: (params) => (
              <Input
                {...params}
                placeholder={placeholder}
                sx={{ width: '100%' }}
              />
            )
          }}
          slotProps={combinedSlotProps}
          {...props}
        />
        {(helperText || (error && errorText)) && (
          <FormHelperText>{error ? errorText : helperText}</FormHelperText>
        )}
      </FormControl>
    </LocalizationProvider>
  );
} 