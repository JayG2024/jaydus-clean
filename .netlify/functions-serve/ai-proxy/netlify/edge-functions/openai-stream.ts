/**
 * OpenAI Stream Edge Function
 * 
 * This edge function handles streaming responses from OpenAI's API.
 * It acts as a proxy and enables server-sent events (SSE) for streaming chat completions.
 */
import { Config } from "@netlify/edge-config";
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
    // Get API key from environment variable
    const OPENAI_API_KEY = Netlify.env.get("OPENAI_API_KEY");
    
    if (!OPENAI_API_KEY) {
      return new Response(
        JSON.stringify({ error: "OpenAI API key is not configured" }),
        {
          status: 500,
          headers: {
            "Content-Type": "application/json"
          }
        }
      );
    }

    // Parse request body
    const requestBody = await request.json();
    const { params } = requestBody;

    if (!params || !params.model || !params.messages) {
      return new Response(
        JSON.stringify({ error: "Invalid request parameters" }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json"
          }
        }
      );
    }

    // Define OpenAI API URL
    const OPENAI_API_URL = "https://api.openai.com/v1/chat/completions";

    // Create request payload
    const payload = {
      model: params.model,
      messages: params.messages,
      stream: true,
      temperature: params.temperature ?? 0.7,
      max_tokens: params.max_tokens ?? 1000,
      top_p: params.top_p ?? 1,
      frequency_penalty: params.frequency_penalty ?? 0,
      presence_penalty: params.presence_penalty ?? 0,
    };

    // Make request to OpenAI API
    const openAIResponse = await fetch(OPENAI_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify(payload),
    });

    if (!openAIResponse.ok) {
      const errorText = await openAIResponse.text();
      console.error(`OpenAI API error: ${openAIResponse.status} ${errorText}`);
      return new Response(
        JSON.stringify({ error: `OpenAI API error: ${openAIResponse.status}` }),
        {
          status: openAIResponse.status,
          headers: {
            "Content-Type": "application/json"
          }
        }
      );
    }

    // Transform the OpenAI stream format to a simpler format for the client
    const transformStream = new TransformStream({
      async transform(chunk, controller) {
        // Convert to text
        const text = new TextDecoder().decode(chunk);
        
        // OpenAI sends multiple lines, each starting with "data: "
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
            console.warn("Failed to parse OpenAI response:", data);
          }
        }
      }
    });

    // Create a new ReadableStream piped through our transform
    const { readable, writable } = new TransformStream();
    openAIResponse.body?.pipeTo(transformStream.writable);
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
        headers: {
          "Content-Type": "application/json"
        }
      }
    );
  }
}