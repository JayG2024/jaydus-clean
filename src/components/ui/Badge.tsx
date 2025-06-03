import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../utils/cn';

const badgeVariants = cva(
  'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
  {
    variants: {
      variant: {
        default: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100',
        primary: 'bg-primary-100 text-primary-800 dark:bg-primary-900/30 dark:text-primary-300',
        secondary: 'bg-secondary-100 text-secondary-800 dark:bg-secondary-900/30 dark:text-secondary-300',
        success: 'bg-success-100 text-success-800 dark:bg-success-900/30 dark:text-success-300',
        warning: 'bg-warning-100 text-warning-800 dark:bg-warning-900/30 dark:text-warning-300',
        error: 'bg-error-100 text-error-800 dark:bg-error-900/30 dark:text-error-300',
        outline: 'bg-transparent text-gray-600 dark:text-gray-400 border border-gray-300 dark:border-gray-700',
      },
      size: {
        default: 'px-2.5 py-0.5 text-xs',
        sm: 'px-2 py-0.5 text-[0.625rem]',
        lg: 'px-3 py-1 text-sm',
      }
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

const Badge = ({ className, variant, size, ...props }: BadgeProps) => {
  return (
    <div className={cn(badgeVariants({ variant, size }), className)} {...props} />
  );
};

export { Badge, badgeVariants };