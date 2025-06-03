import retry from 'async-retry';
import pLimit from 'p-limit';
import { logApiError } from './errorLogger';
import { toast } from 'sonner';

// Configuration for API rate limits
const RATE_LIMITS = {
  OPENAI: {
    DEFAULT: 60 * 1000 / 60, // 60 requests per minute (RPM)
    CHAT: 60 * 1000 / 50,    // 50 RPM
    IMAGE: 60 * 1000 / 20,    // 20 RPM
    AUDIO: 60 * 1000 / 30,    // 30 RPM
  }
};

// Concurrency limits per endpoint type
const CONCURRENCY_LIMITS = {
  OPENAI: {
    CHAT: 5,
    IMAGE: 3,
    AUDIO: 3,
  }
};

// Cache for rate limiting tokens
const rateLimitTokens: Record<string, number> = {};

// Create rate limiters for different API endpoints
export const createLimiters = (apiType: 'OPENAI' | 'STRIPE' | 'SUPABASE', endpointType?: 'CHAT' | 'IMAGE' | 'AUDIO') => {
  const key = `${apiType}_${endpointType || 'DEFAULT'}`;
  
  let rateLimit;
  let concurrencyLimit;
  
  // Set rate limits based on API and endpoint type
  switch (apiType) {
    case 'OPENAI':
      rateLimit = endpointType ? RATE_LIMITS.OPENAI[endpointType] : RATE_LIMITS.OPENAI.DEFAULT;
      concurrencyLimit = endpointType ? CONCURRENCY_LIMITS.OPENAI[endpointType] : 3;
      break;
    default:
      rateLimit = 1000; // Default: 60 RPM
      concurrencyLimit = 5; // Default: 5 concurrent requests
  }
  
  // Create concurrency limiter
  const concurrency = pLimit(concurrencyLimit);
  
  // Function to execute with rate limiting
  const executeWithRateLimit = async <T>(fn: () => Promise<T>): Promise<T> => {
    const now = Date.now();
    const token = rateLimitTokens[key] || 0;
    
    // Check if we need to wait for rate limit
    const timeToWait = Math.max(0, token - now);
    
    if (timeToWait > 0) {
      await new Promise(resolve => setTimeout(resolve, timeToWait));
    }
    
    // Set the next token time
    rateLimitTokens[key] = Date.now() + rateLimit;
    
    // Execute the function
    return await fn();
  };
  
  return {
    execute: async <T>(
      fn: () => Promise<T>, 
      options?: { 
        retries?: number, 
        onRetry?: (error: Error, attempt: number) => void,
        getErrorMessage?: (error: any) => string,
        logIdentifier?: string
      }
    ): Promise<T> => {
      return concurrency(async () => {
        return executeWithRateLimit(async () => {
          try {
            return await retry(
              async (bail) => {
                try {
                  return await fn();
                } catch (err) {
                  // Check if error is retryable
                  if (err instanceof Error &&
                     (err.message.includes('rate_limit') ||
                      err.message.includes('429') ||
                      err.message.includes('timeout') ||
                      err.message.includes('service_unavailable') ||
                      err.message.includes('bad_gateway'))) {
                    throw err; // Will trigger retry
                  }
                  
                  // For non-retryable errors, bail
                  bail(err as Error);
                  return Promise.reject(err);
                }
              },
              {
                retries: options?.retries || 3,
                minTimeout: 500,
                maxTimeout: 5000,
                onRetry: (error, attempt) => {
                  console.warn(`Retrying API call (attempt ${attempt}/${options?.retries || 3})`);
                  if (options?.onRetry) {
                    options.onRetry(error, attempt);
                  } else if (options?.logIdentifier) {
                    logApiError(`${options.logIdentifier}.retry`, error, { attempt });
                  }
                }
              }
            );
          } catch (error) {
            // Log error
            if (options?.logIdentifier) {
              logApiError(options.logIdentifier, error, {});
            }
            
            // Show error to user
            if (options?.getErrorMessage) {
              toast.error(options.getErrorMessage(error));
            } else if (error instanceof Error) {
              toast.error(`API Error: ${error.message}`);
            } else {
              toast.error('An unknown error occurred');
            }
            
            throw error;
          }
        });
      });
    }
  };
};

// Helper function to extract error messages from OpenAI errors
export const extractOpenAIErrorMessage = (error: any): string => {
  if (!error) return 'Unknown error';
  
  // Extract the message from various error formats
  let message = 'Failed to process your request';
  
  if (error.message) {
    if (error.message.includes('rate_limit') || error.message.includes('429')) {
      message = 'API rate limit reached. Please try again in a moment.';
    } else if (error.message.includes('insufficient_quota') || error.message.includes('billing')) {
      message = 'Your API quota has been exceeded. Please check your billing settings.';
    } else if (error.message.includes('invalid_api_key') || error.message.includes('authentication')) {
      message = 'Invalid API key. Please check your API key configuration.';
    } else if (error.message.includes('content_policy_violation') || error.message.includes('violates')) {
      message = 'Your request was flagged for content policy violation. Please modify and try again.';
    } else if (error.message.includes('context_length_exceeded')) {
      message = 'The conversation is too long for the model. Please start a new conversation.';
    } else if (error.message.includes('invalid_request_error')) {
      message = 'There was an issue with your request. Please check your input and try again.';
    } else if (error.message.includes('server_error') || error.message.includes('500')) {
      message = 'The service is currently experiencing issues. Please try again later.';
    } else if (error.message.includes('file_too_large')) {
      message = 'The file is too large. Please use a smaller file.';
    } else if (error.message.includes('unsupported_file_type')) {
      message = 'The file type is not supported.';
    } else {
      // Use the error message directly if not matching any specific pattern
      message = error.message.slice(0, 100); // Truncate long messages
    }
  } else if (error.response?.data?.error?.message) {
    message = error.response.data.error.message;
  } else if (typeof error === 'string') {
    message = error;
  }
  
  return message;
};

// Helper for creating timeout-protected promises
export const withTimeout = <T>(promise: Promise<T>, timeoutMs: number): Promise<T> => {
  let timeoutId: NodeJS.Timeout;
  
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new Error(`Request timed out after ${timeoutMs}ms`));
    }, timeoutMs);
  });
  
  return Promise.race([
    promise,
    timeoutPromise
  ]).finally(() => {
    clearTimeout(timeoutId);
  }) as Promise<T>;
};