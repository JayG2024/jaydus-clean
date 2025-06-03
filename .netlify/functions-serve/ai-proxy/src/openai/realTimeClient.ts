import OpenAI from 'openai';
import { toast } from 'sonner';
import { createLimiters, extractOpenAIErrorMessage } from '../utils/apiUtils';
import { logError, ErrorSeverity } from '../utils/errorLogger';

// Create API limiter
const openaiLimiter = createLimiters('OPENAI');

// Create a production OpenAI client with proper error handling
export const createOpenAIClient = (apiKey?: string): OpenAI => {
  try {
    // In browser environment, we'll be using the Netlify proxy function instead of direct API keys
    // So we create a special client that will route through our proxy
    if (typeof window !== 'undefined') {
      console.log('✅ Creating browser-compatible OpenAI client using proxy');
      
      // Return a baseUrl-modified client for browser use
      return new OpenAI({
        apiKey: 'browser-client', // Dummy value, not actually used
        baseURL: '/api/openai-proxy', // This will route to our Netlify function
        dangerouslyAllowBrowser: true, // Required for browser usage
        maxRetries: 3,
        timeout: 60 * 1000, // 60 second timeout
      });
    }
    
    // For server-side usage, use the real API key (this won't run in browser)
    const openaiApiKey = apiKey || process.env.OPENAI_API_KEY;
    
    if (!openaiApiKey) {
      logError(
        new Error('Missing OpenAI API key in server environment'),
        {
          message: 'OpenAI API key is missing in server environment.',
          context: { keyProvided: !!apiKey },
          tags: ['openai', 'setup', 'api-key']
        },
        ErrorSeverity.ERROR
      );
      
      console.error('❌ Missing OpenAI API key in server environment');
      throw new Error('OpenAI API key is missing in server environment');
    }
    
    console.log('✅ Creating server-side OpenAI client with valid API key');
    
    return new OpenAI({
      apiKey: openaiApiKey,
      maxRetries: 3,
      timeout: 60 * 1000, // 60 second timeout
    });
  } catch (error) {
    logError(
      error instanceof Error ? error : new Error('Failed to initialize OpenAI client'),
      {
        message: 'Failed to create OpenAI client.',
        context: { keyProvided: !!apiKey },
        tags: ['openai', 'initialization']
      },
      ErrorSeverity.ERROR
    );
    
    toast.error('Failed to initialize OpenAI client. Check console for details.');
    throw error;
  }
};

// Simple helper to execute OpenAI API calls with proper error handling
export const executeOpenAIRequest = async <T>(
  fn: () => Promise<T>, 
  options: {
    identifier: string;
    getErrorMessage?: (error: any) => string;
    retries?: number;
    timeoutMs?: number;
  }
): Promise<T> => {
  return openaiLimiter.execute(fn, {
    retries: options.retries || 3,
    logIdentifier: options.identifier,
    getErrorMessage: options.getErrorMessage || extractOpenAIErrorMessage
  });
};