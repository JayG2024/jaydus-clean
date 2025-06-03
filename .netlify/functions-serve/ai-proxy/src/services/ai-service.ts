import { useState } from 'react';

export type ModelType = 'text' | 'image' | 'video';

export interface ModelInfo {
  id: string;
  name: string;
  provider: string;
  type: ModelType;
  description: string;
  capabilities: string[];
  pricing: string;
  available: boolean;
}

// Available models catalog
export const availableModels: ModelInfo[] = [
  // Text models
  {
    id: 'gpt-4o',
    name: 'GPT-4o',
    provider: 'OpenAI',
    type: 'text',
    description: 'Latest multimodal model with advanced reasoning',
    capabilities: ['chat', 'reasoning', 'code', 'creative writing'],
    pricing: '$0.01/1K input tokens, $0.03/1K output tokens',
    available: true
  },
  {
    id: 'claude-3-opus',
    name: 'Claude 3 Opus',
    provider: 'Anthropic',
    type: 'text',
    description: 'Most powerful Claude model with exceptional understanding',
    capabilities: ['chat', 'reasoning', 'long context', 'document analysis'],
    pricing: '$15/million input tokens, $75/million output tokens',
    available: true
  },
  {
    id: 'claude-3-sonnet',
    name: 'Claude 3 Sonnet',
    provider: 'Anthropic',
    type: 'text',
    description: 'Balanced Claude model with great performance',
    capabilities: ['chat', 'reasoning', 'creative writing'],
    pricing: '$3/million input tokens, $15/million output tokens',
    available: true
  },
  {
    id: 'gemini-pro',
    name: 'Gemini Pro',
    provider: 'Google',
    type: 'text',
    description: 'Google\'s advanced language model',
    capabilities: ['chat', 'reasoning', 'creative writing'],
    pricing: 'Contact for pricing',
    available: false
  },
  
  // Image models
  {
    id: 'dall-e-3',
    name: 'DALL-E 3',
    provider: 'OpenAI',
    type: 'image',
    description: 'High-quality image generation with accurate prompt following',
    capabilities: ['photorealistic', 'artistic', 'conceptual', 'product design'],
    pricing: '$0.04/image (1024x1024)',
    available: true
  },
  {
    id: 'midjourney',
    name: 'Midjourney',
    provider: 'Midjourney',
    type: 'image',
    description: 'Highly detailed artistic image generation',
    capabilities: ['artistic', 'detailed', 'creative', 'stylized'],
    pricing: '$0.10/image',
    available: false
  },
  {
    id: 'stable-diffusion-xl',
    name: 'Stable Diffusion XL',
    provider: 'Stability AI',
    type: 'image',
    description: 'Open-source high-quality image generation',
    capabilities: ['photorealistic', 'artistic', 'creative'],
    pricing: '$0.02/image',
    available: true
  },
  
  // Video models
  {
    id: 'runway-gen2',
    name: 'Runway Gen-2',
    provider: 'Runway',
    type: 'video',
    description: 'Short video generation from text prompts',
    capabilities: ['text-to-video', 'image-to-video', 'motion', 'style transfer'],
    pricing: '$0.50/video',
    available: false
  },
  {
    id: 'pika-1',
    name: 'Pika 1.0',
    provider: 'Pika Labs',
    type: 'video',
    description: 'Video creation from text and images',
    capabilities: ['text-to-video', 'image-to-video', 'animation'],
    pricing: '$0.50/video',
    available: false
  }
];

// Generate content with any model
export async function generateContent(modelId: string, prompt: string, options = {}) {
  const response = await fetch('/.netlify/functions/ai-proxy', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      modelId,
      prompt,
      options
    }),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to generate content');
  }
  
  return await response.json();
}

// Generate image with any image model
export async function generateImage(modelId: string, prompt: string, options = {}) {
  const response = await fetch('/.netlify/functions/ai-proxy', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      modelId,
      prompt,
      options,
      type: 'image'
    }),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to generate image');
  }
  
  return await response.json();
}

// Hook for streaming content
export function useStreamingContent() {
  const [content, setContent] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const streamContent = async (modelId: string, prompt: string, options = {}) => {
    setIsLoading(true);
    setContent('');
    setError(null);
    
    try {
      const response = await fetch('/api/ai-stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          modelId,
          prompt,
          options
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Streaming request failed');
      }
      
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n').filter(line => line.trim() !== '');
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') continue;
            
            try {
              const parsed = JSON.parse(data);
              const newContent = parsed.content || '';
              if (newContent) {
                setContent(prev => prev + newContent);
              }
            } catch (error) {
              console.warn('Failed to parse chunk:', data);
            }
          }
        }
      }
    } catch (error) {
      setError(error);
      console.error('Error streaming response:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  return { content, streamContent, isLoading, error };
}