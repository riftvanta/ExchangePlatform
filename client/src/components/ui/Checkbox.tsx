import React from 'react';

export interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
  description?: string;
  error?: string;
  containerClassName?: string;
}

export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className = '', label, description, error, id, containerClassName = '', ...props }, ref) => {
    const inputId = id || React.useId();
    const descriptionId = description ? `${inputId}-description` : undefined;
    const errorId = error ? `${inputId}-error` : undefined;

    return (
      <div className={`relative flex items-start ${containerClassName}`}>
        <div className="flex h-5 items-center">
          <input
            ref={ref}
            id={inputId}
            type="checkbox"
            className={`
              h-4 w-4 rounded border-neutral-300 text-primary-600 
              focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed
              ${error ? 'border-error-300 focus:ring-error-500' : ''}
              ${className}
            `}
            aria-describedby={
              descriptionId && errorId
                ? `${descriptionId} ${errorId}`
                : descriptionId
                ? descriptionId
                : errorId
                ? errorId
                : undefined
            }
            {...props}
          />
        </div>
        {(label || description || error) && (
          <div className="ml-3 text-sm">
            {label && (
              <label
                htmlFor={inputId}
                className={`font-medium ${
                  props.disabled
                    ? 'text-neutral-400'
                    : error
                    ? 'text-error-700'
                    : 'text-neutral-700'
                }`}
              >
                {label}
              </label>
            )}
            {description && (
              <p id={descriptionId} className="text-neutral-500">
                {description}
              </p>
            )}
            {error && (
              <p id={errorId} className="mt-1 text-error-600">
                {error}
              </p>
            )}
          </div>
        )}
      </div>
    );
  }
);

Checkbox.displayName = 'Checkbox'; 