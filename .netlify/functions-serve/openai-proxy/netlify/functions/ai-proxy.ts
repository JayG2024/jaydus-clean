import { Handler } from '@netlify/functions';
import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';

// Initialize API clients
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
// Uncomment when you have the API key
// const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const handler: Handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    const { modelId, prompt, options = {}, type = 'text' } = JSON.parse(event.body || '{}');
    
    if (!modelId || !prompt) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Model ID and prompt are required' })
      };
    }
    
    let response;
    
    // Handle different content types
    if (type === 'text') {
      // Text generation
      if (modelId.startsWith('gpt-')) {
        // OpenAI text models
        response = await openai.chat.completions.create({
          model: modelId,
          messages: [{ role: 'user', content: prompt }],
          temperature: options.temperature || 0.7,
        });
      } 
      else if (modelId.startsWith('claude-')) {
        // Anthropic models - uncomment when you have the API key
        /*
        response = await anthropic.messages.create({
          model: modelId,
          max_tokens: options.maxTokens || 1000,
          temperature: options.temperature || 0.7,
          messages: [{ role: 'user', content: prompt }],
        });
        */
        // Mock response for now
        response = {
          id: 'msg_' + Math.random().toString(36).substring(2, 15),
          content: [{ type: 'text', text: `This is a mock response for ${modelId}. The actual Claude API would be used here with your prompt: "${prompt}"` }],
          model: modelId,
          usage: { input_tokens: 10, output_tokens: 50 }
        };
      }
      else {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: `Unsupported text model: ${modelId}` })
        };
      }
    } 
    else if (type === 'image') {
      // Image generation
      if (modelId === 'dall-e-3') {
        response = await openai.images.generate({
          model: modelId,
          prompt,
          n: options.count || 1,
          size: options.size || '1024x1024',
        });
      }
      else if (modelId === 'stable-diffusion-xl') {
        // Mock response for Stable Diffusion
        response = {
          images: [
            'https://placehold.co/1024x1024/png?text=Stable+Diffusion+Mock+Image'
          ],
          model: modelId
        };
      }
      else {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: `Unsupported image model: ${modelId}` })
        };
      }
    }
    else {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: `Unsupported content type: ${type}` })
      };
    }
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(response)
    };
  } catch (error) {
    console.error('Error in AI proxy:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message })
    };
  }
};

export { handler };