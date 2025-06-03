// OpenRouter API Service
import { getEnabledOpenRouterModels } from '../config/openrouter-models';

const OPENROUTER_API_BASE = 'https://openrouter.ai/api/v1';
const OPENROUTER_API_KEY = import.meta.env.VITE_OPENROUTER_API_KEY;

export interface OpenRouterStreamOptions {
  model: string;
  messages: Array<{
    role: 'system' | 'user' | 'assistant';
    content: string;
  }>;
  temperature?: number;
  max_tokens?: number;
  stream?: boolean;
  onToken?: (token: string) => void;
  onComplete?: (fullResponse: string) => void;
  onError?: (error: Error) => void;
}

export class OpenRouterService {
  private abortController: AbortController | null = null;

  async streamChat(options: OpenRouterStreamOptions) {
    const {
      model,
      messages,
      temperature = 0.7,
      max_tokens = 2000,
      stream = true,
      onToken,
      onComplete,
      onError
    } = options;

    // Create new abort controller for this request
    this.abortController = new AbortController();

    try {
      // Use our Edge Function for streaming
      const response = await fetch('/api/openrouter-stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          modelId: model,
          messages,
          options: {
            temperature,
            maxTokens: max_tokens
          }
        }),
        signal: this.abortController.signal
      });

      if (!response.ok) {
        throw new Error(`OpenRouter API error: ${response.statusText}`);
      }

      if (!stream) {
        // Non-streaming response
        const data = await response.json();
        const content = data.choices[0]?.message?.content || '';
        onComplete?.(content);
        return content;
      }

      // Handle streaming response
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let fullResponse = '';

      if (!reader) {
        throw new Error('No response body');
      }

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') {
              onComplete?.(fullResponse);
              return fullResponse;
            }

            try {
              const parsed = JSON.parse(data);
              const token = parsed.choices[0]?.delta?.content || '';
              if (token) {
                fullResponse += token;
                onToken?.(token);
              }
            } catch (e) {
              // Skip invalid JSON
            }
          }
        }
      }

      onComplete?.(fullResponse);
      return fullResponse;

    } catch (error) {
      if (error.name === 'AbortError') {
        console.log('Stream aborted by user');
      } else {
        onError?.(error as Error);
      }
      throw error;
    }
  }

  // Stop the current stream
  stopStream() {
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }
  }

  // Get available models
  getAvailableModels() {
    return getEnabledOpenRouterModels();
  }

  // Check if API key is configured
  isConfigured() {
    return !!OPENROUTER_API_KEY;
  }
}

// Singleton instance
export const openRouterService = new OpenRouterService();