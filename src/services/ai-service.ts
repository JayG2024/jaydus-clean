import { useState } from 'react';
import { openRouterModels } from './openRouterService';
import { getEnabledOpenRouterModels } from '../config/openrouter-models';

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
  supportsStreaming?: boolean;
}

// Convert OpenRouter models to the common ModelInfo format
const openRouterModelsToModelInfo = (): ModelInfo[] => {
  return openRouterModels.map(model => ({
    id: model.id,
    name: model.name,
    provider: model.provider,
    type: 'text' as ModelType,
    description: model.description || `${model.name} via OpenRouter`,
    capabilities: ['chat', 'reasoning', 'long context'],
    pricing: `$${model.pricing.prompt}/1K input, $${model.pricing.completion}/1K output`,
    available: true,
    supportsStreaming: true
  }));
};

// Convert config models to the common ModelInfo format
const configModelsToModelInfo = (): ModelInfo[] => {
  return getEnabledOpenRouterModels().map(model => ({
    id: model.id,
    name: model.name,
    provider: model.id.split('/')[0] || 'OpenRouter',
    type: 'text' as ModelType,
    description: model.description,
    capabilities: ['chat', 'reasoning', 'long context'],
    pricing: `$${model.pricing.input}/1K input, $${model.pricing.output}/1K output`,
    available: true,
    supportsStreaming: true
  }));
};

// Available models catalog - only using OpenRouter models
export const availableModels: ModelInfo[] = [
  // OpenRouter models from service
  ...openRouterModelsToModelInfo(),
  
  // OpenRouter models from config
  ...configModelsToModelInfo()
];

// Generate content with OpenRouter model
export async function generateContent(modelId: string, prompt: string, options = {}) {
  // Convert prompt to messages format if it's a string
  const messages = typeof prompt === 'string' 
    ? [{ role: 'user', content: prompt }]
    : prompt;
    
  const response = await fetch('/api/openrouter-stream', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      modelId,
      messages,
      options
    }),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to generate content');
  }
  
  return await response.json();
}

// Hook for streaming content from OpenRouter
export function useStreamingContent() {
  const [content, setContent] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const streamContent = async (modelId: string, prompt: string, options = {}) => {
    setIsLoading(true);
    setContent('');
    setError(null);
    
    // Convert prompt to messages format if it's a string
    const messages = typeof prompt === 'string' 
      ? [{ role: 'user', content: prompt }]
      : prompt;
    
    try {
      const response = await fetch('/api/openrouter-stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          modelId,
          messages,
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