import React, { useState, createContext, useContext, ReactNode, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ExclamationCircleIcon } from '@heroicons/react/20/solid';

// Form control context
interface FormControlContextType {
  id: string;
  focused: boolean;
  touched: boolean;
  error?: string;
  required: boolean;
  setFocused: (focused: boolean) => void;
  setTouched: (touched: boolean) => void;
}

const FormControlContext = createContext<FormControlContextType | undefined>(undefined);

// Form control props
interface FormControlProps {
  children: ReactNode;
  id?: string;
  error?: string;
  required?: boolean;
  fullWidth?: boolean;
  className?: string;
}

// Helper hook to generate unique IDs
const useId = () => {
  const [id] = useState(() => `form-control-${Math.random().toString(36).substring(2, 9)}`);
  return id;
};

// Animation variants
const errorMessageVariants = {
  hidden: { opacity: 0, y: -10, height: 0 },
  visible: { opacity: 1, y: 0, height: 'auto', transition: { duration: 0.2 } },
  exit: { opacity: 0, y: -10, height: 0, transition: { duration: 0.2 } }
};

// Main form control component
export const FormControl: React.FC<FormControlProps> = ({
  children,
  id: propId,
  error,
  required = false,
  fullWidth = false,
  className = '',
}) => {
  const id = propId || useId();
  const [focused, setFocused] = useState(false);
  const [touched, setTouched] = useState(false);

  return (
    <FormControlContext.Provider
      value={{
        id,
        focused,
        touched,
        error,
        required,
        setFocused,
        setTouched,
      }}
    >
      <div
        className={`form-control ${fullWidth ? 'w-full' : 'w-auto'} ${
          error && touched ? 'form-control-error' : ''
        } ${className}`}
      >
        {children}
        <AnimatePresence>
          {error && touched && (
            <motion.div
              key={`error-${id}`}
              initial="hidden"
              animate="visible"
              exit="exit"
              variants={errorMessageVariants}
              className="mt-1 text-sm text-error-600 flex items-start"
            >
              <ExclamationCircleIcon className="h-4 w-4 mt-0.5 mr-1.5 flex-shrink-0" />
              <span>{error}</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </FormControlContext.Provider>
  );
};

// Hook to use form control context
export const useFormControl = () => {
  const context = useContext(FormControlContext);
  if (context === undefined) {
    throw new Error('useFormControl must be used within a FormControl');
  }
  return context;
};

// Helper to get props for form elements
export const getFormControlProps = (props: Record<string, any>) => {
  try {
    const {
      id: contextId,
      focused,
      touched,
      error,
      required,
      setFocused,
      setTouched,
    } = useFormControl();

    const id = props.id || contextId;
    
    return {
      id,
      'aria-invalid': !!(error && touched),
      'aria-describedby': error && touched ? `${id}-error` : undefined,
      required,
      onBlur: (e: React.FocusEvent) => {
        setFocused(false);
        setTouched(true);
        if (props.onBlur) props.onBlur(e);
      },
      onFocus: (e: React.FocusEvent) => {
        setFocused(true);
        if (props.onFocus) props.onFocus(e);
      },
    };
  } catch {
    // Used outside of FormControl, return original props
    return {
      id: props.id,
    };
  }
};

// Form label component
interface FormLabelProps
  extends React.LabelHTMLAttributes<HTMLLabelElement> {
  children: ReactNode;
}

export const FormLabel: React.FC<FormLabelProps> = ({
  children,
  className = '',
  ...props
}) => {
  const { id, required } = useFormControl();

  return (
    <label
      htmlFor={id}
      className={`block text-sm font-medium text-neutral-700 mb-1 ${className}`}
      {...props}
    >
      {children}
      {required && <span className="ml-1 text-error-500">*</span>}
    </label>
  );
};

// Form helper text component
interface FormHelperTextProps {
  children: ReactNode;
  className?: string;
}

export const FormHelperText: React.FC<FormHelperTextProps> = ({
  children,
  className = '',
}) => {
  const { id, error, touched } = useFormControl();

  // Don't show helper text if there's an error and the field has been touched
  if (error && touched) return null;

  return (
    <p
      id={`${id}-helper`}
      className={`mt-1 text-sm text-neutral-500 ${className}`}
    >
      {children}
    </p>
  );
};

export default FormControl; 