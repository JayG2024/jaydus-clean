import { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { logError, ErrorSeverity, handleErrorWithRecovery, getUserFriendlyErrorMessage } from '../../utils/errorLogger';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  name?: string; // Component or section name for better error reporting
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  resetOnPropsChange?: boolean;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorCount: number;
  recoveryAttempted: boolean;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
    errorCount: 0,
    recoveryAttempted: false
  };

  // Reset error state when props change if configured
  public componentDidUpdate(prevProps: Props): void {
    if (
      this.props.resetOnPropsChange &&
      this.state.hasError &&
      prevProps.children !== this.props.children
    ) {
      this.setState({
        hasError: false,
        error: null,
        errorInfo: null,
        recoveryAttempted: false
      });
    }
  }

  public static getDerivedStateFromError(error: Error): Partial<State> {
    // Update state so the next render will show the fallback UI
    return { 
      hasError: true, 
      error, 
      errorCount: 1 // Reset to 1 as we can't access this.state in a static method
    };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    this.setState(prevState => ({
      error,
      errorInfo,
      errorCount: prevState.errorCount + 1
    }));

    // Try to recover from the error
    const componentName = this.props.name || 'unknown-component';
    const recovered = handleErrorWithRecovery(error, componentName);
    
    if (recovered) {
      this.setState({ recoveryAttempted: true });
      
      // If recovery was successful, we'll try to reset the error state after a delay
      setTimeout(() => {
        this.setState({
          hasError: false,
          error: null,
          errorInfo: null
        });
      }, 1000);
    }

    // Log the error with our enhanced error logger
    logError(
      error,
      {
        message: `Error in component: ${componentName}`,
        context: {
          componentStack: errorInfo.componentStack,
          recoveryAttempted: recovered,
          errorCount: this.state.errorCount
        },
        tags: ['react', 'error-boundary', componentName]
      },
      this.state.errorCount > 3 ? ErrorSeverity.ERROR : ErrorSeverity.WARNING
    );
    
    // Call the onError prop if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  public render(): ReactNode {
    if (this.state.hasError) {
      // If a custom fallback is provided, use it
      if (this.props.fallback) {
        return this.props.fallback;
      }
      
      // Get a user-friendly error message
      const errorMessage = this.state.error 
        ? getUserFriendlyErrorMessage(this.state.error)
        : "Something went wrong";
      
      // Determine if this is a critical error (multiple failures)
      const isCriticalError = this.state.errorCount > 2;
      
      return (
        <div className="p-6 bg-error-50 dark:bg-error-900/20 border border-error-200 dark:border-error-800 rounded-lg text-center">
          <div className="flex justify-center mb-4">
            <AlertTriangle className="h-12 w-12 text-error-600 dark:text-error-400" />
          </div>
          
          <h2 className="text-lg font-semibold text-error-800 dark:text-error-300 mb-2">
            {isCriticalError ? "We're having trouble" : "Something went wrong"}
          </h2>
          
          <p className="text-error-600 dark:text-error-400 mb-4">
            {errorMessage}
          </p>
          
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            {/* Refresh button */}
            <button 
              className="px-4 py-2 bg-white dark:bg-gray-800 text-error-600 dark:text-error-400 border border-error-300 dark:border-error-700 rounded-md shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center justify-center"
              onClick={() => window.location.reload()}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh Page
            </button>
            
            {/* Home button for critical errors */}
            {isCriticalError && (
              <button 
                className="px-4 py-2 bg-primary-600 text-white rounded-md shadow-sm hover:bg-primary-700 flex items-center justify-center"
                onClick={() => window.location.href = '/'}
              >
                <Home className="h-4 w-4 mr-2" />
                Go to Home
              </button>
            )}
          </div>
          
          {/* Show technical details in development mode */}
          {this.state.error && import.meta.env.DEV && (
            <div className="mt-6 p-4 bg-gray-100 dark:bg-gray-800 rounded-md text-left overflow-x-auto">
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-semibold text-gray-700 dark:text-gray-300">Technical Details</h3>
                <span className="text-xs px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded-full text-gray-700 dark:text-gray-300">
                  Development Only
                </span>
              </div>
              
              <p className="font-mono text-sm text-gray-800 dark:text-gray-200 mb-2">
                <span className="text-error-600 dark:text-error-400 font-semibold">Error:</span> {this.state.error.toString()}
              </p>
              
              {this.state.error.stack && (
                <details className="mt-2">
                  <summary className="cursor-pointer text-sm text-gray-600 dark:text-gray-400">Stack Trace</summary>
                  <pre className="mt-2 p-2 bg-gray-200 dark:bg-gray-700 rounded font-mono text-xs text-gray-800 dark:text-gray-200 overflow-x-auto">
                    {this.state.error.stack}
                  </pre>
                </details>
              )}
              
              {this.state.errorInfo && (
                <details className="mt-2">
                  <summary className="cursor-pointer text-sm text-gray-600 dark:text-gray-400">Component Stack</summary>
                  <pre className="mt-2 p-2 bg-gray-200 dark:bg-gray-700 rounded font-mono text-xs text-gray-800 dark:text-gray-200 overflow-x-auto">
                    {this.state.errorInfo.componentStack}
                  </pre>
                </details>
              )}
              
              <div className="mt-4 p-2 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded">
                <p className="text-xs text-yellow-800 dark:text-yellow-300">
                  Error count: {this.state.errorCount} | Recovery attempted: {this.state.recoveryAttempted ? 'Yes' : 'No'}
                </p>
              </div>
            </div>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;