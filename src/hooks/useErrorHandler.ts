import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { 
  logError, 
  logApiError, 
  ErrorSeverity, 
  getUserFriendlyErrorMessage,
  handleErrorWithRecovery,
  AppError
} from '../utils/errorLogger';

interface ErrorHandlerOptions {
  showToast?: boolean;
  toastDuration?: number;
  context?: string;
  severity?: ErrorSeverity;
  tags?: string[];
  retryCount?: number;
}

const defaultOptions: ErrorHandlerOptions = {
  showToast: true,
  toastDuration: 5000,
  context: 'general',
  severity: ErrorSeverity.ERROR,
  tags: [],
  retryCount: 0
};

/**
 * Custom hook for handling errors in a consistent way across the application
 */
export function useErrorHandler(options: ErrorHandlerOptions = {}) {
  const [error, setError] = useState<Error | null>(null);
  const [isRecovering, setIsRecovering] = useState(false);
  
  // Merge default options with provided options
  const mergedOptions = { ...defaultOptions, ...options };
  
  /**
   * Handle an error with consistent logging and user feedback
   */
  const handleError = useCallback((err: unknown, customMessage?: string) => {
    // Normalize the error
    const normalizedError = err instanceof Error 
      ? err 
      : new Error(typeof err === 'string' ? err : 'An unknown error occurred');
    
    // Set the error state
    setError(normalizedError);
    
    // Get a user-friendly message
    const userMessage = customMessage || getUserFriendlyErrorMessage(normalizedError);
    
    // Show toast notification if enabled
    if (mergedOptions.showToast) {
      toast.error(userMessage, {
        duration: mergedOptions.toastDuration,
        id: `error-${normalizedError.message.substring(0, 20)}`,
      });
    }
    
    // Log the error
    logError(
      normalizedError,
      {
        message: customMessage || normalizedError.message,
        context: { source: mergedOptions.context },
        tags: mergedOptions.tags || []
      },
      mergedOptions.severity
    );
    
    // Try to recover from the error
    if (mergedOptions.retryCount && mergedOptions.retryCount > 0) {
      setIsRecovering(true);
      
      // Attempt recovery
      const recovered = handleErrorWithRecovery(normalizedError, mergedOptions.context || 'unknown');
      
      if (recovered) {
        setError(null);
      }
      
      setIsRecovering(false);
    }
    
    return normalizedError;
  }, [mergedOptions]);
  
  /**
   * Handle an API error with additional context
   */
  const handleApiError = useCallback((endpoint: string, err: unknown, requestData?: any) => {
    // Log the API error with special handling
    logApiError(endpoint, err, requestData);
    
    // Then handle it like a normal error
    return handleError(err, `API Error: ${endpoint}`);
  }, [handleError]);
  
  /**
   * Clear the current error
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);
  
  /**
   * Wrap an async function with error handling
   */
  const withErrorHandling = useCallback(<T extends any[], R>(
    fn: (...args: T) => Promise<R>,
    errorMessage?: string
  ) => {
    return async (...args: T): Promise<R | null> => {
      try {
        return await fn(...args);
      } catch (err) {
        handleError(err, errorMessage);
        return null;
      }
    };
  }, [handleError]);
  
  return {
    error,
    isRecovering,
    handleError,
    handleApiError,
    clearError,
    withErrorHandling
  };
}

export default useErrorHandler;