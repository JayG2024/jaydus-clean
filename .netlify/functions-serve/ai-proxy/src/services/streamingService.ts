/**
 * Service for handling streaming responses from the OpenAI API
 */

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
 * Generate a streaming response from the OpenAI API
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
    // Make the request to the streaming endpoint
    const response = await fetch('/api/openai-stream', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ params: options }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`Streaming API error: ${response.status} ${errorData}`);
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
