/**
 * Service for handling OpenRouter models and utilities
 */

// OpenRouter model interface
export interface OpenRouterModel {
  id: string;
  name: string;
  description?: string;
  context_length: number;
  provider: string;
  pricing: {
    prompt: number;
    completion: number;
  };
}

// List of popular OpenRouter models
export const openRouterModels: OpenRouterModel[] = [
  {
    id: 'openai/gpt-4-turbo',
    name: 'GPT-4 Turbo',
    description: 'OpenAI\'s most powerful model, optimized for speed and cost',
    context_length: 128000,
    provider: 'OpenAI',
    pricing: {
      prompt: 0.01,
      completion: 0.03
    }
  },
  {
    id: 'anthropic/claude-3-opus',
    name: 'Claude 3 Opus',
    description: 'Anthropic\'s most capable model for highly complex tasks',
    context_length: 200000,
    provider: 'Anthropic',
    pricing: {
      prompt: 0.015,
      completion: 0.075
    }
  },
  {
    id: 'anthropic/claude-3-sonnet',
    name: 'Claude 3 Sonnet',
    description: 'Anthropic\'s balanced model for most tasks',
    context_length: 200000,
    provider: 'Anthropic',
    pricing: {
      prompt: 0.003,
      completion: 0.015
    }
  },
  {
    id: 'google/gemini-1.5-pro',
    name: 'Gemini 1.5 Pro',
    description: 'Google\'s multimodal model with large context window',
    context_length: 1000000,
    provider: 'Google',
    pricing: {
      prompt: 0.0025,
      completion: 0.0075
    }
  },
  {
    id: 'meta-llama/llama-3-70b-instruct',
    name: 'Llama 3 70B Instruct',
    description: 'Meta\'s open-source 70B model',
    context_length: 8192,
    provider: 'Meta',
    pricing: {
      prompt: 0.0009,
      completion: 0.0009
    }
  },
  {
    id: 'mistralai/mistral-large',
    name: 'Mistral Large',
    description: 'Mistral\'s most powerful model',
    context_length: 32768,
    provider: 'Mistral AI',
    pricing: {
      prompt: 0.0027,
      completion: 0.0027
    }
  }
];

/**
 * Determine if a model is from OpenRouter
 */
export const isOpenRouterModel = (modelId: string): boolean => {
  // OpenRouter model IDs contain a slash between provider and model name
  return modelId.includes('/') || 
    // Also check our known models
    openRouterModels.some(model => model.id === modelId);
};

/**
 * Get details for an OpenRouter model by ID
 */
export const getOpenRouterModelById = (modelId: string): OpenRouterModel | undefined => {
  return openRouterModels.find(model => model.id === modelId);
};

/**
 * Get all available OpenRouter models
 */
export const getOpenRouterModels = (): OpenRouterModel[] => {
  return [...openRouterModels];
};
