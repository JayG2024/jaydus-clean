import { OpenAI } from 'openai';

// OpenRouter client setup
export const openRouter = new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY || process.env.NEXT_PUBLIC_OPENROUTER_API_KEY,
  baseURL: 'https://openrouter.ai/api/v1',
  defaultHeaders: {
    'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    'X-Title': 'Jaydus Platform'
  }
});

// Get available models
export async function getAvailableModels() {
  try {
    const response = await openRouter.models.list();
    return response.data;
  } catch (error) {
    console.error('Error fetching models:', error);
    return [];
  }
}

// Stream chat completion
export async function streamChatCompletion(
  messages: any[],
  model: string = 'openai/gpt-3.5-turbo',
  options = {}
) {
  try {
    const response = await openRouter.chat.completions.create({
      model,
      messages,
      stream: true,
      ...options
    });
    
    return response;
  } catch (error) {
    console.error('Error streaming chat completion:', error);
    throw error;
  }
}