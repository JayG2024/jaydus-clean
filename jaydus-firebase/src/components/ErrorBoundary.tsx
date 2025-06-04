import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from '../components/ui/Button';
import { logError, ErrorSeverity, AppError } from '../utils/errorLogger';
import { circuitBreakerManager } from '../utils/circuitBreaker';
import { checkServiceHealth, shouldAutoEnableMockMode } from '../utils/apiKeyValidator';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  enableAutoRecovery?: boolean;
  serviceName?: string;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
  isRecovering?: boolean;
  recoveryAttempts?: number;
  serviceHealth?: any;
}

export class ErrorBoundary extends Component<Props, State> {
  private recoveryTimeouts: NodeJS.Timeout[] = [];
  
  public state: State = {
    hasError: false,
    isRecovering: false,
    recoveryAttempts: 0
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Enhanced error logging
    logError(
      error,
      {
        message: 'React Error Boundary caught error',
        context: {
          serviceName: this.props.serviceName,
          componentStack: errorInfo.componentStack,
          errorBoundary: 'ReactErrorBoundary'
        },
        tags: ['error-boundary', 'react-error', this.props.serviceName || 'unknown'].filter(Boolean)
      },
      ErrorSeverity.ERROR
    );

    this.setState({ error, errorInfo });

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Check if this is an API-related error and attempt auto-recovery
    if (this.props.enableAutoRecovery && this.isApiError(error)) {
      this.attemptAutoRecovery(error);
    }
  }

  private isApiError(error: Error): boolean {
    const apiErrorIndicators = [
      'fetch',
      'network',
      'timeout',
      'api',
      'openai',
      'stripe',
      'clerk',
      'unauthorized',
      'forbidden'
    ];
    
    const errorMessage = error.message.toLowerCase();
    return apiErrorIndicators.some(indicator => errorMessage.includes(indicator));
  }

  private async attemptAutoRecovery(error: Error): Promise<void> {
    if (this.state.recoveryAttempts! >= 3) {
      logError(
        new AppError(
          'Auto-recovery failed after 3 attempts',
          'AUTO_RECOVERY_FAILED',
          ErrorSeverity.ERROR,
          { serviceName: this.props.serviceName, attempts: this.state.recoveryAttempts },
          false
        ),
        {
          message: 'Auto-recovery maximum attempts reached',
          context: { originalError: error.message },
          tags: ['error-boundary', 'auto-recovery', 'failed']
        },
        ErrorSeverity.ERROR
      );
      return;
    }

    this.setState({ isRecovering: true });
    
    // Check service health
    try {
      const serviceHealth = await checkServiceHealth();
      this.setState({ serviceHealth });
      
      // If services are unhealthy, enable mock mode
      if (shouldAutoEnableMockMode(serviceHealth)) {
        logError(
          new AppError(
            'Auto-enabling mock mode due to service failures',
            'AUTO_MOCK_MODE',
            ErrorSeverity.WARNING,
            { serviceName: this.props.serviceName },
            false
          ),
          {
            message: 'Automatically enabling mock mode for recovery',
            context: { serviceHealth },
            tags: ['error-boundary', 'auto-recovery', 'mock-mode']
          },
          ErrorSeverity.WARNING
        );
        
        // Set a flag in localStorage to enable mock mode
        localStorage.setItem('autoMockMode', 'true');
        localStorage.setItem('autoMockReason', `Service error: ${error.message}`);
      }
      
      // Wait a bit then attempt recovery
      const timeout = setTimeout(() => {
        this.setState({
          hasError: false,
          error: undefined,
          errorInfo: undefined,
          isRecovering: false,
          recoveryAttempts: (this.state.recoveryAttempts || 0) + 1
        });
      }, 3000); // Wait 3 seconds
      
      this.recoveryTimeouts.push(timeout);
      
    } catch (recoveryError) {
      logError(
        recoveryError instanceof Error ? recoveryError : new Error('Recovery failed'),
        {
          message: 'Auto-recovery attempt failed',
          context: { originalError: error.message },
          tags: ['error-boundary', 'auto-recovery', 'failed']
        },
        ErrorSeverity.ERROR
      );
      
      this.setState({ isRecovering: false });
    }
  }

  private handleManualRecovery = () => {
    // Reset circuit breakers
    circuitBreakerManager.resetAll();
    
    // Clear auto mock mode
    localStorage.removeItem('autoMockMode');
    localStorage.removeItem('autoMockReason');
    
    // Reset error state
    this.setState({
      hasError: false,
      error: undefined,
      errorInfo: undefined,
      isRecovering: false,
      recoveryAttempts: 0,
      serviceHealth: undefined
    });
    
    logError(
      new AppError(
        'Manual recovery initiated',
        'MANUAL_RECOVERY',
        ErrorSeverity.INFO,
        { serviceName: this.props.serviceName },
        false
      ),
      {
        message: 'User initiated manual recovery',
        tags: ['error-boundary', 'manual-recovery']
      },
      ErrorSeverity.INFO
    );
  };

  public componentWillUnmount() {
    // Clear any pending timeouts
    this.recoveryTimeouts.forEach(timeout => clearTimeout(timeout));
  }

  public render() {
    if (this.state.hasError) {
      if (this.state.isRecovering) {
        return (
          <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
            <div className="max-w-md w-full space-y-6 p-8 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                <h2 className="mt-4 text-xl font-bold text-blue-600 dark:text-blue-400">
                  Attempting Recovery...
                </h2>
                <p className="mt-2 text-gray-600 dark:text-gray-300">
                  Checking service health and attempting to restore functionality.
                </p>
              </div>
            </div>
          </div>
        );
      }

      return this.props.fallback || (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
          <div className="max-w-md w-full space-y-6 p-8 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-red-600 dark:text-red-400">
                Something went wrong
              </h2>
              <p className="mt-2 text-gray-600 dark:text-gray-300">
                {this.isApiError(this.state.error!) ? 
                  'Service connection issue detected. Try the options below.' :
                  'We\'re sorry for the inconvenience. Our team has been notified.'
                }
              </p>
              
              {this.state.serviceHealth && (
                <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                  <p className="text-sm text-yellow-800 dark:text-yellow-200">
                    Service Status: {this.state.serviceHealth.overall}
                  </p>
                </div>
              )}
              
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <details className="mt-4 p-4 bg-gray-100 dark:bg-gray-700 rounded text-left">
                  <summary className="font-medium text-gray-700 dark:text-gray-200 cursor-pointer">
                    Error Details
                  </summary>
                  <div className="mt-2 text-sm text-red-600 dark:text-red-400 font-mono">
                    {this.state.error.toString()}
                    <br />
                    <pre className="whitespace-pre-wrap mt-2">
                      {this.state.errorInfo?.componentStack}
                    </pre>
                  </div>
                </details>
              )}
              
              <div className="mt-6 space-y-3">
                {this.isApiError(this.state.error!) && (
                  <Button
                    onClick={this.handleManualRecovery}
                    className="w-full justify-center bg-blue-600 hover:bg-blue-700"
                  >
                    Try Recovery
                  </Button>
                )}
                <Button
                  onClick={() => window.location.reload()}
                  className="w-full justify-center"
                  variant="outline"
                >
                  Reload Page
                </Button>
              </div>
              
              {this.state.recoveryAttempts! > 0 && (
                <p className="mt-2 text-xs text-gray-500">
                  Recovery attempts: {this.state.recoveryAttempts}
                </p>
              )}
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export const withErrorBoundary = <P extends object>(
  Component: React.ComponentType<P>,
  Fallback?: React.ComponentType
) => {
  return (props: P) => (
    <ErrorBoundary fallback={Fallback ? <Fallback /> : undefined}>
      <Component {...props} />
    </ErrorBoundary>
  );
};
