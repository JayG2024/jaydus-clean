/**
 * Intelligent Retry Logic with Exponential Backoff
 * 
 * Provides robust retry mechanisms for API calls and other operations
 * that may fail due to temporary issues.
 */

import { logError, ErrorSeverity, AppError } from './errorLogger';

export interface RetryConfig {
  maxAttempts: number;
  baseDelay: number;        // Base delay in milliseconds
  maxDelay: number;         // Maximum delay in milliseconds
  backoffFactor: number;    // Multiplier for exponential backoff
  jitter: boolean;          // Add random jitter to prevent thundering herd
  retryCondition?: (error: any) => boolean; // Custom condition to determine if retry should happen
}

export interface RetryResult<T> {
  success: boolean;
  result?: T;
  error?: Error;
  attempts: number;
  totalDelay: number;
}

export interface RetryAttempt {
  attempt: number;
  delay: number;
  error?: Error;
  timestamp: number;
}

/**
 * Default retry configuration
 */
const DEFAULT_CONFIG: RetryConfig = {
  maxAttempts: 3,
  baseDelay: 1000,
  maxDelay: 30000,
  backoffFactor: 2,
  jitter: true,
  retryCondition: (error) => {
    // Default: retry on network errors, timeouts, and 5xx status codes
    if (error instanceof Error) {
      const message = error.message.toLowerCase();
      return (
        message.includes('network') ||
        message.includes('timeout') ||
        message.includes('503') ||
        message.includes('502') ||
        message.includes('504') ||
        message.includes('500')
      );
    }
    return false;
  }
};

/**
 * Calculate delay with exponential backoff and optional jitter
 */
function calculateDelay(
  attempt: number, 
  baseDelay: number, 
  maxDelay: number, 
  backoffFactor: number, 
  jitter: boolean
): number {
  let delay = Math.min(baseDelay * Math.pow(backoffFactor, attempt - 1), maxDelay);
  
  if (jitter) {
    // Add ±25% random jitter
    const jitterRange = delay * 0.25;
    delay += (Math.random() - 0.5) * 2 * jitterRange;
  }
  
  return Math.max(0, Math.floor(delay));
}

/**
 * Sleep for specified milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Retry a function with exponential backoff
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  config: Partial<RetryConfig> = {},
  context?: string
): Promise<RetryResult<T>> {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };
  const attempts: RetryAttempt[] = [];
  let totalDelay = 0;

  for (let attempt = 1; attempt <= finalConfig.maxAttempts; attempt++) {
    const attemptStart = Date.now();

    try {
      const result = await fn();
      
      // Success - log if there were previous failures
      if (attempt > 1) {
        logError(
          new AppError(
            `Retry succeeded on attempt ${attempt}`,
            'RETRY_SUCCESS',
            ErrorSeverity.INFO,
            { 
              context,
              attempt,
              totalAttempts: finalConfig.maxAttempts,
              totalDelay,
              previousErrors: attempts.map(a => a.error?.message).filter(Boolean)
            },
            false
          ),
          {
            message: 'Operation succeeded after retry',
            context: { 
              finalAttempt: attempt,
              retriesNeeded: attempt - 1,
              context
            },
            tags: ['retry', 'success', context].filter(Boolean)
          },
          ErrorSeverity.INFO
        );
      }

      return {
        success: true,
        result,
        attempts: attempt,
        totalDelay
      };

    } catch (error) {
      const errorObj = error instanceof Error ? error : new Error(String(error));
      
      attempts.push({
        attempt,
        delay: 0,
        error: errorObj,
        timestamp: Date.now()
      });

      // Check if we should retry
      const shouldRetry = attempt < finalConfig.maxAttempts && 
                         (finalConfig.retryCondition ? finalConfig.retryCondition(error) : true);

      if (!shouldRetry) {
        // Final failure - log comprehensive error
        logError(
          errorObj,
          {
            message: `Operation failed after ${attempt} attempts`,
            context: {
              context,
              totalAttempts: attempt,
              maxAttempts: finalConfig.maxAttempts,
              totalDelay,
              allErrors: attempts.map(a => ({
                attempt: a.attempt,
                error: a.error?.message,
                timestamp: a.timestamp
              })),
              finalError: errorObj.message,
              retryReason: finalConfig.retryCondition ? 'Custom condition failed' : 'Max attempts reached'
            },
            tags: ['retry', 'failed', context].filter(Boolean)
          },
          ErrorSeverity.ERROR
        );

        return {
          success: false,
          error: errorObj,
          attempts: attempt,
          totalDelay
        };
      }

      // Calculate delay for next attempt
      const delay = calculateDelay(
        attempt,
        finalConfig.baseDelay,
        finalConfig.maxDelay,
        finalConfig.backoffFactor,
        finalConfig.jitter
      );

      attempts[attempts.length - 1].delay = delay;
      totalDelay += delay;

      // Log retry attempt
      logError(
        errorObj,
        {
          message: `Retrying operation (attempt ${attempt}/${finalConfig.maxAttempts})`,
          context: {
            context,
            attempt,
            maxAttempts: finalConfig.maxAttempts,
            nextDelay: delay,
            totalDelay,
            error: errorObj.message
          },
          tags: ['retry', 'attempt', context].filter(Boolean)
        },
        ErrorSeverity.WARNING
      );

      // Wait before next attempt
      if (delay > 0) {
        await sleep(delay);
      }
    }
  }

  // This shouldn't be reached, but TypeScript wants it
  throw new Error('Unexpected end of retry loop');
}

/**
 * Retry specifically for API calls with appropriate default settings
 */
export async function retryApiCall<T>(
  apiCall: () => Promise<T>,
  context?: string
): Promise<RetryResult<T>> {
  return retryWithBackoff(
    apiCall,
    {
      maxAttempts: 3,
      baseDelay: 1000,
      maxDelay: 10000,
      backoffFactor: 2,
      jitter: true,
      retryCondition: (error) => {
        // Retry on network errors, timeouts, and server errors
        if (error instanceof Error) {
          const message = error.message.toLowerCase();
          return (
            message.includes('fetch') ||
            message.includes('network') ||
            message.includes('timeout') ||
            message.includes('502') ||
            message.includes('503') ||
            message.includes('504') ||
            message.includes('500')
          );
        }
        
        // Retry on HTTP response errors (if response object is available)
        if (error && typeof error === 'object' && 'status' in error) {
          const status = (error as any).status;
          return status >= 500 || status === 429; // Server errors or rate limiting
        }
        
        return false;
      }
    },
    context || 'API Call'
  );
}

/**
 * Retry for database operations with longer delays
 */
export async function retryDatabaseOperation<T>(
  dbOperation: () => Promise<T>,
  context?: string
): Promise<RetryResult<T>> {
  return retryWithBackoff(
    dbOperation,
    {
      maxAttempts: 5,
      baseDelay: 2000,
      maxDelay: 30000,
      backoffFactor: 1.5,
      jitter: true,
      retryCondition: (error) => {
        if (error instanceof Error) {
          const message = error.message.toLowerCase();
          return (
            message.includes('connection') ||
            message.includes('timeout') ||
            message.includes('network') ||
            message.includes('econnreset') ||
            message.includes('enotfound')
          );
        }
        return false;
      }
    },
    context || 'Database Operation'
  );
}

/**
 * Create a wrapper function that automatically retries
 */
export function withRetry<TArgs extends any[], TReturn>(
  fn: (...args: TArgs) => Promise<TReturn>,
  config: Partial<RetryConfig> = {},
  context?: string
) {
  return async (...args: TArgs): Promise<TReturn> => {
    const result = await retryWithBackoff(
      () => fn(...args),
      config,
      context
    );
    
    if (result.success) {
      return result.result!;
    } else {
      throw result.error;
    }
  };
}

/**
 * Retry with circuit breaker integration
 */
export async function retryWithCircuitBreaker<T>(
  fn: () => Promise<T>,
  circuitBreaker: any, // CircuitBreaker type
  config: Partial<RetryConfig> = {},
  context?: string
): Promise<RetryResult<T>> {
  return retryWithBackoff(
    async () => {
      return await circuitBreaker.execute(fn);
    },
    {
      ...config,
      retryCondition: (error) => {
        // Don't retry if circuit breaker is open
        if (error instanceof Error && error.message.includes('Circuit breaker is OPEN')) {
          return false;
        }
        
        // Use default retry condition otherwise
        return config.retryCondition ? config.retryCondition(error) : DEFAULT_CONFIG.retryCondition!(error);
      }
    },
    context
  );
}

export default {
  retryWithBackoff,
  retryApiCall,
  retryDatabaseOperation,
  withRetry,
  retryWithCircuitBreaker,
  DEFAULT_CONFIG
};