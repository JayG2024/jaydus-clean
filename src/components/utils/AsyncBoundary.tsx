import React, { Suspense, ReactNode } from 'react';
import ErrorBoundary from '../ui/ErrorBoundary';

interface AsyncBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  errorFallback?: ReactNode;
}

/**
 * A component that combines ErrorBoundary and Suspense to handle both
 * error boundaries and loading states for async components.
 */
const AsyncBoundary: React.FC<AsyncBoundaryProps> = ({ 
  children, 
  fallback = <DefaultLoadingFallback />,
  errorFallback 
}) => {
  return (
    <ErrorBoundary fallback={errorFallback}>
      <Suspense fallback={fallback}>
        {children}
      </Suspense>
    </ErrorBoundary>
  );
};

const DefaultLoadingFallback = () => (
  <div className="flex items-center justify-center min-h-[200px]">
    <div className="text-center">
      <div className="h-12 w-12 mx-auto rounded-full border-4 border-primary-600 border-t-transparent animate-spin"></div>
      <p className="mt-4 text-gray-600 dark:text-gray-400">Loading...</p>
    </div>
  </div>
);

export default AsyncBoundary;