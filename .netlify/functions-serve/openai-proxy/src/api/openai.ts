/**
 * Robust OpenAI client API that works across different hosting platforms
 * This handles all the streaming complexities regardless of deployment platform
 */

import { ChatCompletionMessageParam } from 'openai/resources';

// Auto-detect API endpoint based on environment
const getApiEndpoint = () => {
  // Check for different deployment environments or use fallback
  if (window.location.hostname === 'localhost') {
    return '/api/openai-stream'; // Local development
  } else if (window.location.host.includes('netlify')) {
    return '/api/openai-stream'; // Netlify deployment
  } else if (window.location.host.includes('vercel')) {
    return '/api/openai-stream'; // Vercel deployment
  } else if (window.location.host.includes('render')) {
    return '/api/openai-stream'; // Render deployment
  }
  // Default fallback
  return '/api/openai-stream';
};

/**
 * Send a streaming request to OpenAI and process the response
 */
export async function streamOpenAIResponse({
  messages,
  model = 'gpt-4o',
  temperature = 0.7,
  onMessageToken = (token: string) => {},
  onError = (error: Error) => {},
}: {
  messages: ChatCompletionMessageParam[];
  model?: string;
  temperature?: number;
  onMessageToken?: (token: string) => void;
  onError?: (error: Error) => void;
}): Promise<string> {
  let fullResponse = '';
  
  try {
    // Make request to the API endpoint
    const response = await fetch(getApiEndpoint(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages,
        model,
        temperature,
      }),
    });

    if (!response.ok || !response.body) {
      throw new Error(`API request failed with status ${response.status}`);
    }

    // Create reader for streaming response
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    
    // Process the stream
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      
      // Decode chunk
      const chunk = decoder.decode(value, { stream: true });
      
      // Process each event in the chunk
      const events = chunk
        .split('\n\n')
        .filter(line => line.trim() !== '' && line.includes('data: '));
      
      for (const event of events) {
        if (event.includes('data: [DONE]')) continue;
        
        try {
          const jsonStr = event.replace('data: ', '').trim();
          const json = JSON.parse(jsonStr);
          
          if (json.content) {
            // Update full response and call token callback
            fullResponse += json.content;
            onMessageToken(json.content);
          }
        } catch (e) {
          console.warn('Error parsing SSE event:', e);
        }
      }
    }
    
    return fullResponse;
  } catch (error) {
    const errorObj = error instanceof Error ? error : new Error(String(error));
    console.error('Stream error:', errorObj);
    onError(errorObj);
    return fullResponse;
  }
}

/**
 * Non-streaming version as fallback
 */
export async function fetchOpenAIResponse({
  messages,
  model = 'gpt-4o',
  temperature = 0.7,
}: {
  messages: ChatCompletionMessageParam[];
  model?: string;
  temperature?: number;
}): Promise<string> {
  try {
    const response = await fetch(getApiEndpoint(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages,
        model,
        temperature,
        stream: false, // Force non-streaming
      }),
    });

    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }

    const data = await response.json();
    return data.content || '';
  } catch (error) {
    console.error('API error:', error);
    throw error;
  }
}
