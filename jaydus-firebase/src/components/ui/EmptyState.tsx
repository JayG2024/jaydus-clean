import React from 'react';
import { cn } from '../../utils/cn';
import { Button } from './Button';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  actions?: {
    primary?: {
      label: string;
      onClick: () => void;
    };
    secondary?: {
      label: string;
      onClick: () => void;
    };
  };
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  actions,
  className,
}) => {
  return (
    <div className={cn(
      "flex flex-col items-center justify-center text-center py-12 px-4",
      className
    )}>
      {icon && (
        <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded-full mb-4">
          {icon}
        </div>
      )}
      <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-2">{title}</h3>
      {description && (
        <p className="text-gray-600 dark:text-gray-400 max-w-md mb-6">
          {description}
        </p>
      )}
      {actions && (
        <div className="flex flex-wrap gap-3 justify-center">
          {actions.primary && (
            <Button onClick={actions.primary.onClick}>
              {actions.primary.label}
            </Button>
          )}
          {actions.secondary && (
            <Button variant="outline" onClick={actions.secondary.onClick}>
              {actions.secondary.label}
            </Button>
          )}
        </div>
      )}
    </div>
  );
};