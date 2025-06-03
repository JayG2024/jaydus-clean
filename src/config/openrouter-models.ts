// OpenRouter Model Configuration
// Select which models you want to offer in your app

export const OPENROUTER_MODELS = [
  // GPT Models
  {
    id: 'openai/gpt-4-turbo-preview',
    name: 'GPT-4 Turbo',
    description: 'Latest GPT-4 with 128k context',
    category: 'Premium',
    pricing: { input: 0.01, output: 0.03 },
    context: 128000,
    enabled: true
  },
  {
    id: 'openai/gpt-3.5-turbo',
    name: 'GPT-3.5 Turbo',
    description: 'Fast and efficient',
    category: 'Standard',
    pricing: { input: 0.0005, output: 0.0015 },
    context: 16385,
    enabled: true
  },
  
  // Claude Models
  {
    id: 'anthropic/claude-3-opus',
    name: 'Claude 3 Opus',
    description: 'Most capable Claude model',
    category: 'Premium',
    pricing: { input: 0.015, output: 0.075 },
    context: 200000,
    enabled: true
  },
  {
    id: 'anthropic/claude-3-sonnet',
    name: 'Claude 3 Sonnet',
    description: 'Balanced performance',
    category: 'Standard',
    pricing: { input: 0.003, output: 0.015 },
    context: 200000,
    enabled: true
  },
  
  // Google Models
  {
    id: 'google/gemini-pro',
    name: 'Gemini Pro',
    description: 'Google\'s advanced model',
    category: 'Standard',
    pricing: { input: 0.000125, output: 0.000375 },
    context: 32000,
    enabled: true
  },
  
  // Open Source Models
  {
    id: 'meta-llama/llama-3-70b-instruct',
    name: 'Llama 3 70B',
    description: 'Open source powerhouse',
    category: 'Open Source',
    pricing: { input: 0.0008, output: 0.0008 },
    context: 8192,
    enabled: true
  },
  {
    id: 'mistralai/mixtral-8x7b-instruct',
    name: 'Mixtral 8x7B',
    description: 'Efficient mixture of experts',
    category: 'Open Source',
    pricing: { input: 0.0005, output: 0.0005 },
    context: 32768,
    enabled: true
  },
  
  // Specialized Models
  {
    id: 'openai/gpt-4-vision-preview',
    name: 'GPT-4 Vision',
    description: 'Analyzes images',
    category: 'Specialized',
    pricing: { input: 0.01, output: 0.03 },
    context: 128000,
    enabled: false // Enable when you add image support
  },
  {
    id: 'perplexity/pplx-70b-online',
    name: 'Perplexity Online',
    description: 'Internet-connected responses',
    category: 'Specialized',
    pricing: { input: 0.001, output: 0.001 },
    context: 4096,
    enabled: false // Enable for web search features
  }
];

// Helper function to get enabled models
export function getEnabledOpenRouterModels() {
  return OPENROUTER_MODELS.filter(model => model.enabled);
}

// Helper function to get models by category
export function getModelsByCategory(category: string) {
  return OPENROUTER_MODELS.filter(
    model => model.enabled && model.category === category
  );
}