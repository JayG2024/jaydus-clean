import React from 'react';
import { cn } from '../../utils/cn';

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  icon?: React.ReactNode;
  error?: string;
  label?: string;
  description?: string;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, icon, error, label, description, ...props }, ref) => {
    return (
      <div className="space-y-1.5">
        {label && (
          <label 
            htmlFor={props.id} 
            className="block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            {label}
          </label>
        )}
        <div className={`relative ${error ? 'focus-within:ring-error-500' : 'focus-within:ring-primary-500'}`}>
          {icon && (
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <span className="text-gray-500 dark:text-gray-400 sm:text-sm">{icon}</span>
            </div>
          )}
          <input
            type={type}
            className={cn(
              "px-3 py-2 rounded-lg w-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900",
              "text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2",
              "placeholder:text-gray-400 dark:placeholder:text-gray-500",
              "disabled:opacity-50 disabled:pointer-events-none",
              error ? "border-error-300 dark:border-error-700 focus:border-error-600 focus:ring-error-600" 
                  : "focus:border-primary-600 focus:ring-primary-600",
              icon && "pl-10",
              className
            )}
            ref={ref}
            {...props}
          />
          {error && (
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
              <svg
                className="h-5 w-5 text-error-500"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </div>
          )}
        </div>
        {error && <p className="mt-1 text-sm text-error-600 dark:text-error-400">{error}</p>}
        {description && <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{description}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';

export { Input };