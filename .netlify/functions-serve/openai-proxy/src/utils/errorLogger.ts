/**
 * Error logging utility
 * 
 * This utility provides consistent error logging across the application.
 * In a production environment, this should be connected to an error tracking
 * service like Sentry, LogRocket, etc.
 */

interface ErrorDetails {
  message: string;
  context?: Record<string, any>;
  tags?: string[];
}

// Error severity levels
export enum ErrorSeverity {
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
  CRITICAL = 'critical'
}

// Keep track of error frequency to avoid flooding logs
const errorOccurrences: Record<string, { count: number, firstSeen: number, lastSeen: number }> = {};
const ERROR_RATE_LIMIT = 10; // Max number of identical errors to log in a period
const ERROR_RATE_PERIOD = 60 * 1000; // 1 minute

// Generate a stable error key for rate limiting
const getErrorKey = (error: Error | string, details?: ErrorDetails): string => {
  const errorMessage = typeof error === 'string' ? error : error.message;
  const detailsKey = details?.message || '';
  const tagsKey = details?.tags?.join(',') || '';
  return `${errorMessage}|${detailsKey}|${tagsKey}`;
};

// Check if we should rate limit this error
const shouldRateLimitError = (key: string): boolean => {
  const now = Date.now();
  
  // If we've never seen this error, record it and don't rate limit
  if (!errorOccurrences[key]) {
    errorOccurrences[key] = { count: 1, firstSeen: now, lastSeen: now };
    return false;
  }
  
  // If it's been a while since we've seen this error, reset the counter
  if (now - errorOccurrences[key].lastSeen > ERROR_RATE_PERIOD) {
    errorOccurrences[key] = { count: 1, firstSeen: now, lastSeen: now };
    return false;
  }
  
  // Update the error occurrence
  errorOccurrences[key].count += 1;
  errorOccurrences[key].lastSeen = now;
  
  // Rate limit if we've seen this error too many times
  return errorOccurrences[key].count > ERROR_RATE_LIMIT;
};

/**
 * Log an error with context information
 */
export function logError(error: Error | string, details?: ErrorDetails, severity: ErrorSeverity = ErrorSeverity.ERROR): void {
  const errorMessage = typeof error === 'string' ? error : error.message;
  const errorStack = typeof error === 'string' ? undefined : error.stack;
  
  // Generate a key for this error for rate limiting
  const errorKey = getErrorKey(error, details);
  
  // Format error for console
  const logObject = {
    timestamp: new Date().toISOString(),
    severity,
    message: errorMessage,
    stack: errorStack,
    ...details
  };
  
  // Check if we should rate limit this error
  if (shouldRateLimitError(errorKey)) {
    // Only log a rate limit message occasionally
    if (errorOccurrences[errorKey].count % 50 === 0) {
      console.warn(`Rate limiting error logging for: ${errorMessage} (seen ${errorOccurrences[errorKey].count} times in the last minute)`);
    }
    return;
  }
  
  // Log to console in development
  if (import.meta.env.DEV) {
    if (severity === ErrorSeverity.ERROR || severity === ErrorSeverity.CRITICAL) {
      console.error('🔴 ERROR:', logObject);
    } else if (severity === ErrorSeverity.WARNING) {
      console.warn('🟡 WARNING:', logObject);
    } else {
      console.log('🔵 INFO:', logObject);
    }
    
    if (errorStack) {
      console.error(errorStack);
    }
  }
  
  // In production, we would send this to an error tracking service
  if (import.meta.env.PROD) {
    // Example - if using Sentry:
    // Sentry.captureException(error, {
    //   level: severity,
    //   extra: details?.context,
    //   tags: details?.tags?.reduce((acc, tag) => ({...acc, [tag]: true}), {})
    // });
    
    // Set up analytics event for monitoring
    try {
      // This could be connected to Google Analytics or similar
      if (window.gtag) {
        window.gtag('event', 'error', {
          event_category: 'error',
          event_label: errorMessage.substring(0, 100),
          value: severity === ErrorSeverity.CRITICAL ? 1 : 0,
          non_interaction: true
        });
      }
    } catch (e) {
      // Don't let analytics errors cause more problems
      console.error('Failed to log error to analytics', e);
    }
  }
}

/**
 * Log an API request error
 */
export function logApiError(endpoint: string, error: any, requestData?: any): void {
  // Sanitize request data to prevent logging sensitive information
  const sanitizedRequestData = requestData ? { ...requestData } : {};
  
  // Remove sensitive fields if present
  if (sanitizedRequestData.apiKey) sanitizedRequestData.apiKey = '[REDACTED]';
  if (sanitizedRequestData.password) sanitizedRequestData.password = '[REDACTED]';
  if (sanitizedRequestData.token) sanitizedRequestData.token = '[REDACTED]';
  
  // Truncate very long fields
  for (const key in sanitizedRequestData) {
    if (typeof sanitizedRequestData[key] === 'string' && sanitizedRequestData[key].length > 500) {
      sanitizedRequestData[key] = sanitizedRequestData[key].substring(0, 500) + '... [TRUNCATED]';
    }
  }

  // Get HTTP status if available
  const status = error?.status || error?.response?.status || null;
  
  // Handle common API response patterns
  let responseData = null;
  try {
    if (error?.response?.data) {
      responseData = error.response.data;
    } else if (typeof error?.response === 'string') {
      responseData = error.response.substring(0, 500);
    } else if (error?.message) {
      responseData = error.message;
    }
  } catch (e) {
    console.error('Error parsing API error response', e);
  }

  logError(
    error instanceof Error ? error : new Error(`API Error: ${error?.message || 'Unknown error'}`),
    {
      message: `API Request Failed: ${endpoint}`,
      context: {
        endpoint,
        status,
        requestData: sanitizedRequestData,
        response: responseData ? (typeof responseData === 'string' ? responseData : JSON.stringify(responseData).substring(0, 500)) : undefined
      },
      tags: ['api', 'request-failed', status ? `status-${status}` : 'unknown-status', endpoint.split('.')[0]]
    },
    status && status >= 500 ? ErrorSeverity.ERROR : ErrorSeverity.WARNING
  );
}

/**
 * Log an authentication error
 */
export function logAuthError(action: string, error: any, userId?: string): void {
  logError(
    error instanceof Error ? error : new Error(`Auth Error: ${error?.message || 'Unknown error'}`),
    {
      message: `Authentication Error: ${action}`,
      context: {
        action,
        userId,
        errorCode: error?.code,
      },
      tags: ['auth', action]
    },
    ErrorSeverity.ERROR
  );
}

/**
 * Log a successful but important operation for audit purposes
 */
export function logAudit(action: string, details: Record<string, any>, userId?: string): void {
  logError(
    `Audit: ${action}`,
    {
      message: `Audit: ${action}`,
      context: {
        ...details,
        userId
      },
      tags: ['audit', action]
    },
    ErrorSeverity.INFO
  );
}