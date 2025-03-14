import React, { useState, Fragment } from 'react';
import { Listbox, Transition } from '@headlessui/react';
import { CheckIcon, ChevronUpDownIcon } from '@heroicons/react/20/solid';

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps {
  options: SelectOption[];
  value: string;
  onChange: (value: string) => void;
  label?: string;
  placeholder?: string;
  error?: string;
  helperText?: string;
  disabled?: boolean;
  fullWidth?: boolean;
  className?: string;
  containerClassName?: string;
}

export const Select = ({
  options,
  value,
  onChange,
  label,
  placeholder = 'Select an option',
  error,
  helperText,
  disabled = false,
  fullWidth = false,
  className = '',
  containerClassName = '',
}: SelectProps) => {
  const selectedOption = options.find(option => option.value === value);
  const id = React.useId();
  
  const containerClasses = `
    ${fullWidth ? 'w-full' : 'w-auto'}
    ${containerClassName}
  `;

  return (
    <div className={containerClasses}>
      {label && (
        <Listbox.Label
          className="block text-sm font-medium text-neutral-700 mb-1"
        >
          {label}
        </Listbox.Label>
      )}
      <Listbox
        value={value}
        onChange={onChange}
        disabled={disabled}
      >
        {({ open }) => (
          <div className="relative">
            <Listbox.Button
              className={`
                relative w-full cursor-default rounded-md border ${error ? 'border-error-300' : 'border-neutral-300'} 
                bg-white py-2 pl-3 pr-10 text-left shadow-sm 
                focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 sm:text-sm
                ${disabled ? 'bg-neutral-100 text-neutral-500 cursor-not-allowed' : ''}
                ${className}
              `}
              aria-invalid={!!error}
              aria-describedby={error ? `${id}-error` : helperText ? `${id}-helper` : undefined}
            >
              <span className={`block truncate ${!selectedOption?.label ? 'text-neutral-500' : ''}`}>
                {selectedOption?.label || placeholder}
              </span>
              <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                <ChevronUpDownIcon className="h-5 w-5 text-neutral-400" aria-hidden="true" />
              </span>
            </Listbox.Button>

            <Transition
              show={open}
              as={Fragment}
              leave="transition ease-in duration-100"
              leaveFrom="opacity-100"
              leaveTo="opacity-0"
            >
              <Listbox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                {options.map((option) => (
                  <Listbox.Option
                    key={option.value}
                    value={option.value}
                    disabled={option.disabled}
                    className={({ active, disabled }) =>
                      `relative cursor-default select-none py-2 pl-10 pr-4 ${
                        active ? 'bg-primary-100 text-primary-900' : 'text-neutral-900'
                      } ${disabled ? 'text-neutral-400 cursor-not-allowed' : ''}`
                    }
                  >
                    {({ selected, active }) => (
                      <>
                        <span className={`block truncate ${selected ? 'font-medium' : 'font-normal'}`}>
                          {option.label}
                        </span>
                        {selected ? (
                          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-primary-600">
                            <CheckIcon className="h-5 w-5" aria-hidden="true" />
                          </span>
                        ) : null}
                      </>
                    )}
                  </Listbox.Option>
                ))}
              </Listbox.Options>
            </Transition>
          </div>
        )}
      </Listbox>
      {error && (
        <p id={`${id}-error`} className="mt-1 text-sm text-error-600">
          {error}
        </p>
      )}
      {helperText && !error && (
        <p id={`${id}-helper`} className="mt-1 text-sm text-neutral-500">
          {helperText}
        </p>
      )}
    </div>
  );
}; 