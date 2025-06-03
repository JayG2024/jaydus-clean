/**
 * Service for handling streaming responses from OpenRouter
 */
import { availableModels } from './ai-service';

/**
 * Options for the streaming request
 */
interface StreamingOptions {
  model: string;
  messages: Array<{
    role: 'system' | 'user' | 'assistant';
    content: string;
  }>;
  temperature?: number;
  max_tokens?: number;
  top_p?: number;
  frequency_penalty?: number;
  presence_penalty?: number;
}

/**
 * Function to handle the streaming response
 */
type StreamHandler = (chunk: string) => void;

/**
 * Check if a model supports streaming
 */
export function supportsStreaming(modelId: string): boolean {
  const model = availableModels.find(m => m.id === modelId);
  return model?.supportsStreaming ?? false;
}

/**
 * Generate a streaming response from OpenRouter
 * @param options The options for the streaming request
 * @param onChunk The callback to handle each chunk of the response
 * @param onDone The callback when the stream is complete (optional)
 * @param onError The callback when an error occurs (optional)
 */
export async function streamChatCompletion(
  options: StreamingOptions,
  onChunk: StreamHandler,
  onDone?: () => void,
  onError?: (error: Error) => void
): Promise<void> {
  try {
    // Verify the model supports streaming
    if (!supportsStreaming(options.model)) {
      throw new Error(`Model ${options.model} does not support streaming`);
    }
    
    const endpoint = '/api/openrouter-stream';
    
    console.log(`🔄 Streaming from OpenRouter using model: ${options.model}`);
    console.log(`📡 Calling endpoint: ${endpoint}`);
    
    // Make the request to the streaming endpoint
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ params: options }),
    });
    
    console.log(`📨 Response status: ${response.status} ${response.statusText}`);

    if (!response.ok) {
      let errorMessage = `Streaming API error: ${response.status}`;
      try {
        const errorText = await response.text();
        try {
          const errorData = JSON.parse(errorText);
          errorMessage += ` ${JSON.stringify(errorData)}`;
        } catch {
          // If we can't parse JSON, use the raw text
          errorMessage += ` ${errorText}`;
        }
      } catch (e) {
        // If we can't get text, use the status text
        errorMessage += ` ${response.statusText}`;
      }
      
      console.error('Streaming error:', errorMessage);
      throw new Error(errorMessage);
    }

    // Get a reader from the response body stream
    const reader = response.body!.getReader();
    const decoder = new TextDecoder();
    
    // Process the stream
    let buffer = '';
    
    while (true) {
      const { value, done } = await reader.read();
      
      if (done) {
        break;
      }
      
      // Decode the current chunk and add it to our buffer
      buffer += decoder.decode(value, { stream: true });
      
      // Process each complete SSE message
      const lines = buffer.split('\n\n');
      buffer = lines.pop() || ''; // Keep the last incomplete chunk in the buffer
      
      for (const line of lines) {
        if (line.trim() === '') continue;
        
        // Parse the SSE data
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          
          // Check for end of stream marker
          if (data === '[DONE]') {
            onDone && onDone();
            continue;
          }
          
          try {
            const parsed = JSON.parse(data);
            if (parsed.content) {
              onChunk(parsed.content);
            } else if (parsed.error) {
              onError && onError(new Error(parsed.error));
            }
          } catch (e) {
            console.warn('Failed to parse SSE data:', data);
          }
        }
      }
    }
    
    onDone && onDone();
  } catch (error) {
    console.error('Error in streaming:', error);
    onError && onError(error as Error);
  }
}

/**
 * Get the top N latest models that support streaming from OpenRouter
 * @param count Number of models to return (default: 5)
 */
export function getTopStreamingModels(count: number = 5): string[] {
  return availableModels
    .filter(model => 
      model.type === 'text' && 
      model.supportsStreaming === true
    )
    .slice(0, count)
    .map(model => model.id);
}