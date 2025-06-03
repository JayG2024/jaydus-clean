/**
 * Error logging and handling utility
 * 
 * This utility provides consistent error logging and handling across the application.
 * It includes:
 * - Error logging with severity levels
 * - Rate limiting to prevent log flooding
 * - Integration with error tracking services (Sentry, etc.)
 * - User-friendly error messages
 * - Error recovery strategies
 * - Structured error reporting
 */

interface ErrorDetails {
  message: string;
  context?: Record<string, any>;
  tags?: string[];
  stack?: string;
  userId?: string;
  name?: string;
  keyId?: string;
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
  const isDev = typeof process !== 'undefined' ? process.env.NODE_ENV === 'development' : false;
  const isProd = typeof process !== 'undefined' ? process.env.NODE_ENV === 'production' : false;
  
  if (isDev) {
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
  if (isProd) {
    // Example - if using Sentry:
    // Sentry.captureException(error, {
    //   level: severity,
    //   extra: details?.context,
    //   tags: details?.tags?.reduce((acc, tag) => ({...acc, [tag]: true}), {})
    // });
    
    // Send to centralized logging service
    try {
      // This could be connected to LogRocket, DataDog, or similar
      sendToLoggingService(logObject);
    } catch (e) {
      // Don't let logging errors cause more problems
      console.error('Failed to send error to logging service', e);
    }
    
    // Set up analytics event for monitoring
    try {
      // This could be connected to Google Analytics or similar
      const win = typeof window !== 'undefined' ? window : null;
      if (win && 'gtag' in win) {
        (win as any).gtag('event', 'error', {
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

/**
 * Get a user-friendly error message from any error
 */
export function getUserFriendlyErrorMessage(error: any): string {
  // Default message
  let message = "Something went wrong. Please try again later.";
  
  // Handle different error types
  if (typeof error === 'string') {
    message = error;
  } else if (error instanceof Error) {
    message = error.message;
  } else if (error?.response?.data?.message) {
    message = error.response.data.message;
  } else if (error?.message) {
    message = error.message;
  }
  
  // Clean up common error messages to be more user-friendly
  if (message.includes('Network Error') || message.includes('timeout')) {
    return "Network connection issue. Please check your internet connection and try again.";
  }
  
  if (message.includes('401') || message.includes('unauthorized')) {
    return "Your session has expired. Please sign in again.";
  }
  
  if (message.includes('403') || message.includes('forbidden')) {
    return "You don't have permission to perform this action.";
  }
  
  if (message.includes('404') || message.includes('not found')) {
    return "The requested resource was not found.";
  }
  
  if (message.includes('500') || message.includes('server error')) {
    return "Server error. Our team has been notified and we're working on it.";
  }
  
  // Stripe specific errors
  if (message.includes('card') && (message.includes('declined') || message.includes('invalid'))) {
    return "Your card was declined. Please check your card details and try again.";
  }
  
  // Truncate very long messages
  if (message.length > 150) {
    message = message.substring(0, 150) + '...';
  }
  
  return message;
}

/**
 * Handle errors with appropriate recovery strategies
 * Returns true if recovery was successful, false otherwise
 */
export function handleErrorWithRecovery(error: any, context: string): boolean {
  // Log the error
  logError(
    error instanceof Error ? error : new Error(`Recovery Error: ${error?.message || 'Unknown error'}`),
    {
      message: `Error in ${context}`,
      context: { recoveryAttempted: true },
      tags: ['recovery', context]
    }
  );
  
  // Authentication errors - attempt to refresh token or redirect to login
  if (error?.response?.status === 401 || (error?.message && error.message.includes('unauthorized'))) {
    // If we have a refresh token mechanism, try that first
    try {
      // Attempt token refresh logic would go here
      // return true if successful
    } catch (refreshError) {
      // If refresh fails, redirect to login
      if (typeof window !== 'undefined') {
        window.location.href = '/login?session_expired=true';
        return true; // Handled by redirect
      }
    }
  }
  
  // Network errors - retry with exponential backoff
  if (error?.message?.includes('Network Error') || error?.code === 'ECONNABORTED') {
    // Implement retry logic here
    return false; // Not implemented yet
  }
  
  // Missing environment variables in production
  if (error?.message?.includes('environment variable') && process.env.NODE_ENV === 'production') {
    logError(
      'Missing required environment variable in production',
      {
        message: error.message,
        severity: ErrorSeverity.CRITICAL,
        tags: ['config', 'env-vars']
      }
    );
    // No recovery possible, but we've logged it as critical
    return false;
  }
  
  // No recovery strategy available
  return false;
}

/**
 * Send error to centralized logging service
 */
function sendToLoggingService(logObject: any): void {
  // This would be replaced with actual logging service integration
  // Examples: LogRocket, DataDog, Loggly, CloudWatch, etc.
  
  // For now, store in localStorage for debugging in production
  try {
    const logs = JSON.parse(localStorage.getItem('errorLogs') || '[]');
    logs.push(logObject);
    
    // Keep only last 100 logs to prevent storage issues
    if (logs.length > 100) {
      logs.splice(0, logs.length - 100);
    }
    
    localStorage.setItem('errorLogs', JSON.stringify(logs));
  } catch (e) {
    // If localStorage fails, at least try to log to console
    console.error('Failed to store error log', e);
  }
}

/**
 * Get stored error logs for debugging
 */
export function getStoredErrorLogs(): any[] {
  try {
    return JSON.parse(localStorage.getItem('errorLogs') || '[]');
  } catch (e) {
    console.error('Failed to retrieve error logs', e);
    return [];
  }
}

/**
 * Clear stored error logs
 */
export function clearStoredErrorLogs(): void {
  try {
    localStorage.removeItem('errorLogs');
  } catch (e) {
    console.error('Failed to clear error logs', e);
  }
}

/**
 * Get error statistics for monitoring dashboard
 */
export function getErrorStatistics(): {
  totalErrors: number;
  errorsByType: Record<string, number>;
  errorsBySeverity: Record<string, number>;
  recentErrors: any[];
  errorTrends: Array<{ timestamp: string; count: number }>;
} {
  const logs = getStoredErrorLogs();
  const now = Date.now();
  const oneHourAgo = now - (60 * 60 * 1000);
  const recentLogs = logs.filter(log => new Date(log.timestamp).getTime() > oneHourAgo);
  
  // Count errors by type (tag)
  const errorsByType: Record<string, number> = {};
  const errorsBySeverity: Record<string, number> = {};
  
  logs.forEach(log => {
    // Count by severity
    errorsBySeverity[log.severity] = (errorsBySeverity[log.severity] || 0) + 1;
    
    // Count by type (first tag)
    if (log.tags && log.tags.length > 0) {
      const type = log.tags[0];
      errorsByType[type] = (errorsByType[type] || 0) + 1;
    }
  });
  
  // Generate hourly error trends for the last 24 hours
  const trends: Array<{ timestamp: string; count: number }> = [];
  const oneDayAgo = now - (24 * 60 * 60 * 1000);
  
  for (let i = 0; i < 24; i++) {
    const hourStart = oneDayAgo + (i * 60 * 60 * 1000);
    const hourEnd = hourStart + (60 * 60 * 1000);
    
    const errorsInHour = logs.filter(log => {
      const logTime = new Date(log.timestamp).getTime();
      return logTime >= hourStart && logTime < hourEnd;
    }).length;
    
    trends.push({
      timestamp: new Date(hourStart).toISOString(),
      count: errorsInHour
    });
  }
  
  return {
    totalErrors: logs.length,
    errorsByType,
    errorsBySeverity,
    recentErrors: recentLogs.slice(-10), // Last 10 recent errors
    errorTrends: trends
  };
}

/**
 * Export error logs for external analysis
 */
export function exportErrorLogs(): string {
  const logs = getStoredErrorLogs();
  const stats = getErrorStatistics();
  
  const exportData = {
    exportedAt: new Date().toISOString(),
    statistics: stats,
    logs: logs
  };
  
  return JSON.stringify(exportData, null, 2);
}

/**
 * Monitor for critical error patterns
 */
export function checkForCriticalPatterns(): {
  hasCriticalIssues: boolean;
  issues: Array<{
    type: string;
    description: string;
    severity: ErrorSeverity;
    count: number;
  }>;
} {
  const logs = getStoredErrorLogs();
  const now = Date.now();
  const oneHourAgo = now - (60 * 60 * 1000);
  const recentLogs = logs.filter(log => new Date(log.timestamp).getTime() > oneHourAgo);
  
  const issues: Array<{
    type: string;
    description: string;
    severity: ErrorSeverity;
    count: number;
  }> = [];
  
  // Check for high error rate
  if (recentLogs.length > 50) {
    issues.push({
      type: 'HIGH_ERROR_RATE',
      description: `High error rate detected: ${recentLogs.length} errors in the last hour`,
      severity: ErrorSeverity.CRITICAL,
      count: recentLogs.length
    });
  }
  
  // Check for critical errors
  const criticalErrors = recentLogs.filter(log => log.severity === ErrorSeverity.CRITICAL);
  if (criticalErrors.length > 0) {
    issues.push({
      type: 'CRITICAL_ERRORS',
      description: `Critical errors detected: ${criticalErrors.length} in the last hour`,
      severity: ErrorSeverity.CRITICAL,
      count: criticalErrors.length
    });
  }
  
  // Check for repeated API failures
  const apiErrors = recentLogs.filter(log => log.tags && log.tags.includes('api'));
  if (apiErrors.length > 20) {
    issues.push({
      type: 'API_FAILURE_PATTERN',
      description: `High API failure rate: ${apiErrors.length} API errors in the last hour`,
      severity: ErrorSeverity.ERROR,
      count: apiErrors.length
    });
  }
  
  // Check for authentication issues
  const authErrors = recentLogs.filter(log => log.tags && log.tags.includes('auth'));
  if (authErrors.length > 10) {
    issues.push({
      type: 'AUTH_ISSUES',
      description: `Authentication issues detected: ${authErrors.length} auth errors in the last hour`,
      severity: ErrorSeverity.WARNING,
      count: authErrors.length
    });
  }
  
  return {
    hasCriticalIssues: issues.some(issue => issue.severity === ErrorSeverity.CRITICAL),
    issues
  };
}

/**
 * Create a standardized application error with additional context
 */
export class AppError extends Error {
  public readonly code: string;
  public readonly severity: ErrorSeverity;
  public readonly context: Record<string, any>;
  public readonly recoverable: boolean;
  
  constructor(
    message: string, 
    code: string = 'UNKNOWN_ERROR',
    severity: ErrorSeverity = ErrorSeverity.ERROR,
    context: Record<string, any> = {},
    recoverable: boolean = true
  ) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.severity = severity;
    this.context = context;
    this.recoverable = recoverable;
    
    // Capture stack trace
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, AppError);
    }
  }
  
  /**
   * Log this error
   */
  log(): void {
    logError(this, {
      message: this.message,
      context: this.context,
      tags: ['app-error', this.code]
    }, this.severity);
  }
  
  /**
   * Get a user-friendly message for this error
   */
  getUserMessage(): string {
    return getUserFriendlyErrorMessage(this);
  }
  
  /**
   * Convert to a serializable object for logging
   */
  toJSON(): object {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      severity: this.severity,
      context: this.context,
      recoverable: this.recoverable,
      stack: this.stack
    };
  }
}

/**
 * Initialize error monitoring
 */
export function initializeErrorMonitoring(): void {
  // Set up periodic health checks
  setInterval(() => {
    const patterns = checkForCriticalPatterns();
    if (patterns.hasCriticalIssues) {
      logError(
        new AppError(
          'Critical error patterns detected',
          'CRITICAL_PATTERN_DETECTED',
          ErrorSeverity.CRITICAL,
          { patterns: patterns.issues },
          false
        ),
        {
          message: 'Automated critical pattern detection',
          context: { issueCount: patterns.issues.length },
          tags: ['monitoring', 'critical-pattern']
        },
        ErrorSeverity.CRITICAL
      );
    }
  }, 5 * 60 * 1000); // Check every 5 minutes
  
  // Log initialization
  logError(
    'Error monitoring system initialized',
    {
      message: 'Error monitoring and logging system is now active',
      context: { 
        features: ['rate-limiting', 'storage', 'pattern-detection', 'statistics'],
        checkInterval: '5 minutes'
      },
      tags: ['monitoring', 'initialization']
    },
    ErrorSeverity.INFO
  );
}