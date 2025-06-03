import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    this.setState({ error, errorInfo });

    // Log the error to an error reporting service
    console.error('Error caught by ErrorBoundary:', error, errorInfo);
    
    // In a production app, you would send this to your error logging service:
    // logger.logError(error, errorInfo);
  }

  public render(): ReactNode {
    if (this.state.hasError) {
      // You can render any custom fallback UI
      return this.props.fallback || (
        <div className="p-6 bg-error-50 dark:bg-error-900/20 border border-error-200 dark:border-error-800 rounded-lg text-center">
          <div className="flex justify-center mb-4">
            <AlertTriangle className="h-12 w-12 text-error-600 dark:text-error-400" />
          </div>
          <h2 className="text-lg font-semibold text-error-800 dark:text-error-300 mb-2">Something went wrong</h2>
          <p className="text-error-600 dark:text-error-400 mb-4">
            An unexpected error occurred. Please try refreshing the page.
          </p>
          <button 
            className="px-4 py-2 bg-white dark:bg-gray-800 text-error-600 dark:text-error-400 border border-error-300 dark:border-error-700 rounded-md shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700"
            onClick={() => window.location.reload()}
          >
            Refresh Page
          </button>
          {this.state.error && import.meta.env.DEV && (
            <div className="mt-4 p-4 bg-gray-100 dark:bg-gray-800 rounded-md text-left overflow-x-auto">
              <p className="font-mono text-sm text-gray-800 dark:text-gray-200">
                {this.state.error.toString()}
              </p>
              {this.state.errorInfo && (
                <pre className="mt-2 font-mono text-xs text-gray-600 dark:text-gray-400 overflow-x-auto">
                  {this.state.errorInfo.componentStack}
                </pre>
              )}
            </div>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;