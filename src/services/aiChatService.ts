/**
 * Service for handling AI chat completions using OpenRouter
 */
import { openRouterService } from './openrouter-service';
import { logError, ErrorSeverity } from '../utils/errorLogger';
import { retryApiCall } from '../utils/retryWithBackoff';

// Message interface for OpenRouter
export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

// Chat completion options
export interface ChatCompletionOptions {
  temperature?: number;
  max_tokens?: number;
  top_p?: number;
  frequency_penalty?: number;
  presence_penalty?: number;
}

/**
 * Generate a chat completion using OpenRouter
 */
export async function generateChatCompletion(
  modelId: string,
  messages: ChatMessage[],
  options: ChatCompletionOptions = {}
) {
  try {
    return await generateOpenRouterChatCompletion(modelId, messages, options);
  } catch (error) {
    logError(
      error instanceof Error ? error : new Error('Failed to generate chat completion'),
      {
        message: 'Failed to generate chat completion',
        context: { modelId, messageCount: messages.length },
        tags: ['chat', 'completion', modelId, 'openrouter']
      },
      ErrorSeverity.ERROR
    );
    throw error;
  }
}

/**
 * Generate a chat completion using OpenRouter
 */
async function generateOpenRouterChatCompletion(
  modelId: string,
  messages: ChatMessage[],
  options: ChatCompletionOptions = {}
) {
  // Use retry with backoff utility for resilience
  return await retryApiCall(
    async () => {
      // For non-streaming response
      const response = await openRouterService.streamChat({
        model: modelId,
        messages,
        temperature: options.temperature ?? 0.7,
        max_tokens: options.max_tokens ?? 2000,
        stream: false
      });
      
      return {
        content: response || '',
        finish_reason: 'stop',
        usage: {
          // OpenRouter doesn't provide detailed token usage in the same format
          prompt_tokens: 0,
          completion_tokens: 0,
          total_tokens: 0
        },
        provider: 'openrouter'
      };
    },
    'OpenRouter Chat Completion'
  );
}