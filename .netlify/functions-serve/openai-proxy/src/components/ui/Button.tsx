import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../utils/cn';

const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-lg text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none relative overflow-hidden',
  {
    variants: {
      variant: {
        default: 'bg-primary-600 text-white hover:bg-primary-700 active:bg-primary-800',
        secondary: 'bg-secondary-600 text-white hover:bg-secondary-700 active:bg-secondary-800',
        accent: 'bg-accent-600 text-white hover:bg-accent-700 active:bg-accent-800',
        outline: 'border border-gray-300 dark:border-gray-700 bg-transparent hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300',
        ghost: 'bg-transparent hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300',
        destructive: 'bg-error-600 text-white hover:bg-error-700',
        success: 'bg-success-600 text-white hover:bg-success-700',
        warning: 'bg-warning-600 text-white hover:bg-warning-700',
        subtle: 'bg-primary-100 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300 hover:bg-primary-200 dark:hover:bg-primary-900/30',
        link: 'bg-transparent text-primary-600 dark:text-primary-400 hover:underline p-0 h-auto',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-8 px-3 py-1 text-xs',
        lg: 'h-12 px-6 py-3 text-base',
        xl: 'h-14 px-8 py-4 text-lg',
        icon: 'h-10 w-10 p-2',
        'icon-sm': 'h-8 w-8 p-1.5',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  isLoading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, isLoading, children, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size }), className)}
        ref={ref}
        disabled={isLoading || props.disabled}
        {...props}
      >
        {isLoading && (
          <>
            <span className="absolute inset-0 flex items-center justify-center bg-inherit">
              <svg
                className="h-4 w-4 animate-spin text-current"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
            </span>
            <span className="invisible">{children}</span>
          </>
        )}
        {!isLoading && children}
      </button>
    );
  }
);

Button.displayName = 'Button';

export { Button, buttonVariants };