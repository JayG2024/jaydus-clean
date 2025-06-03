import type { Handler } from '@netlify/functions';
import OpenAI from 'openai';

const handler: Handler = async (event) => {
  // Add CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  };

  // Handle OPTIONS request for CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  try {
    if (!process.env.OPENAI_API_KEY) {
      console.error('Missing OPENAI_API_KEY environment variable');
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: 'Server configuration error: Missing API key' })
      };
    }

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    
    if (!event.body) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Request body is empty' })
      };
    }

    let body;
    try {
      body = JSON.parse(event.body);
    } catch (e) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Invalid JSON in request body' })
      };
    }

    if (!body.params) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Missing params in request body' })
      };
    }

    // Check if this is an image generation request
    const imageModels = ['dall-e-3', 'dall-e-2', 'gpt-image-1'];
    if (body.params.model && imageModels.includes(body.params.model)) {
      const response = await openai.images.generate({
        model: body.params.model,
        prompt: body.params.prompt,
        n: body.params.n || 1,
        size: body.params.size || '1024x1024',
      });
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(response),
      };
    } else {
      // Handle as a chat completion
      const response = await openai.chat.completions.create(body.params);
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(response),
      };
    }
  } catch (error) {
    console.error('Error in OpenAI proxy:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      }),
    };
  }
};

export { handler };