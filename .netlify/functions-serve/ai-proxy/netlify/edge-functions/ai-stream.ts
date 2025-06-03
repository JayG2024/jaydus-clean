import { Context } from "@netlify/edge-functions";

export default async (request: Request, context: Context) => {
  // Handle preflight requests
  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
        "Access-Control-Max-Age": "86400",
      },
    });
  }

  // Only allow POST requests
  if (request.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    const { modelId, prompt, options = {} } = await request.json();
    
    if (!modelId || !prompt) {
      return new Response(
        JSON.stringify({ error: "Model ID and prompt are required" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" }
        }
      );
    }
    
    let streamingResponse;
    
    // Route to appropriate provider based on model ID
    if (modelId.startsWith('gpt-')) {
      // OpenAI streaming
      const OPENAI_API_KEY = Netlify.env.get("OPENAI_API_KEY");
      
      if (!OPENAI_API_KEY) {
        return new Response(
          JSON.stringify({ error: "OpenAI API key is not configured" }),
          {
            status: 500,
            headers: { "Content-Type": "application/json" }
          }
        );
      }
      
      streamingResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model: modelId,
          messages: [{ role: 'user', content: prompt }],
          temperature: options.temperature || 0.7,
          stream: true
        }),
      });
    }
    else if (modelId.startsWith('claude-')) {
      // Claude streaming
      const ANTHROPIC_API_KEY = Netlify.env.get("ANTHROPIC_API_KEY");
      
      if (!ANTHROPIC_API_KEY) {
        return new Response(
          JSON.stringify({ error: "Anthropic API key is not configured" }),
          {
            status: 500,
            headers: { "Content-Type": "application/json" }
          }
        );
      }
      
      streamingResponse = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: modelId,
          max_tokens: options.maxTokens || 1000,
          temperature: options.temperature || 0.7,
          messages: [{ role: 'user', content: prompt }],
          stream: true
        }),
      });
    }
    else {
      return new Response(
        JSON.stringify({ error: `Streaming not supported for model ${modelId}` }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" }
        }
      );
    }
    
    if (!streamingResponse.ok) {
      const errorText = await streamingResponse.text();
      console.error(`API error: ${streamingResponse.status} ${errorText}`);
      return new Response(
        JSON.stringify({ error: `API error: ${streamingResponse.status}` }),
        {
          status: streamingResponse.status,
          headers: { "Content-Type": "application/json" }
        }
      );
    }
    
    // Transform the stream format to a simpler format for the client
    const transformStream = new TransformStream({
      async transform(chunk, controller) {
        // Convert to text
        const text = new TextDecoder().decode(chunk);
        
        // Different providers have different streaming formats
        if (modelId.startsWith('gpt-')) {
          // OpenAI format
          const lines = text.split("\n").filter(line => line.trim() !== "");
          
          for (const line of lines) {
            // Skip lines that don't start with "data: "
            if (!line.startsWith("data: ")) continue;
            
            // Extract the data part
            const data = line.slice(6);
            
            // Check for stream end marker
            if (data === "[DONE]") {
              controller.enqueue(`data: [DONE]\n\n`);
              continue;
            }
            
            try {
              // Parse the JSON
              const parsed = JSON.parse(data);
              
              // Extract content from the message
              const content = parsed.choices[0]?.delta?.content || "";
              
              if (content) {
                // Send simplified format to client
                controller.enqueue(`data: ${JSON.stringify({ content })}\n\n`);
              }
            } catch (e) {
              console.warn("Failed to parse response:", data);
            }
          }
        }
        else if (modelId.startsWith('claude-')) {
          // Claude format
          const lines = text.split("\n").filter(line => line.trim() !== "");
          
          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            
            const data = line.slice(6);
            
            try {
              const parsed = JSON.parse(data);
              
              if (parsed.type === 'content_block_delta' && parsed.delta?.text) {
                controller.enqueue(`data: ${JSON.stringify({ content: parsed.delta.text })}\n\n`);
              }
            } catch (e) {
              console.warn("Failed to parse Claude response:", data);
            }
          }
        }
      }
    });
    
    // Create a new ReadableStream piped through our transform
    const { readable, writable } = new TransformStream();
    streamingResponse.body?.pipeTo(transformStream.writable);
    transformStream.readable.pipeTo(writable);
    
    // Return streaming response
    return new Response(readable, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (error) {
    console.error("Edge function error:", error);
    return new Response(
      JSON.stringify({ error: "An error occurred processing your request" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" }
      }
    );
  }
};