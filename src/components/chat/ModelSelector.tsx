import React, { useState, useEffect } from 'react';
import { Check, ChevronDown, Sparkles, Terminal } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

interface Model {
  id: string;
  name: string;
  description: string;
  provider: 'openai' | 'anthropic' | 'openrouter' | 'other';
  isNew?: boolean;
  isPremium?: boolean;
}

interface ModelSelectorProps {
  selectedModel: string;
  onModelChange: (modelId: string) => void;
  className?: string;
}

const ModelSelector: React.FC<ModelSelectorProps> = ({ 
  selectedModel, 
  onModelChange, 
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [models, setModels] = useState<Model[]>([]);
  
  // Load models on component mount
  useEffect(() => {
    const defaultModels: Model[] = [
      // OpenAI Models
      { 
        id: 'gpt-4o', 
        name: 'GPT-4o',
        provider: 'openai',
        description: 'Latest multimodal model with advanced reasoning',
        isPremium: true,
        isNew: true
      },
      { 
        id: 'gpt-4-turbo', 
        name: 'GPT-4 Turbo',
        provider: 'openai',
        description: 'Powerful model with strong reasoning capabilities',
        isPremium: true
      },
      {
        id: 'gpt-3.5-turbo',
        name: 'GPT-3.5 Turbo',
        provider: 'openai',
        description: 'Fast and cost-effective for most tasks'
      },
      // Anthropic Models
      { 
        id: 'claude-3-opus', 
        name: 'Claude 3 Opus',
        provider: 'anthropic',
        description: 'Most powerful Claude model with exceptional understanding',
        isPremium: true,
        isNew: true
      },
      { 
        id: 'claude-3-sonnet', 
        name: 'Claude 3 Sonnet',
        provider: 'anthropic',
        description: 'Balanced performance and intelligence',
        isPremium: true
      },
      { 
        id: 'claude-3-haiku', 
        name: 'Claude 3 Haiku',
        provider: 'anthropic',
        description: 'Fast and efficient for straightforward tasks',
        isNew: true
      },
      
      // OpenRouter Models
      {
        id: 'openai/gpt-4-turbo',
        name: 'GPT-4 Turbo (via OpenRouter)',
        provider: 'openrouter',
        description: 'OpenAI\'s GPT-4 Turbo via OpenRouter',
        isPremium: true
      },
      {
        id: 'anthropic/claude-3-opus',
        name: 'Claude 3 Opus (via OpenRouter)',
        provider: 'openrouter',
        description: 'Anthropic\'s Claude 3 Opus via OpenRouter',
        isPremium: true
      },
      {
        id: 'google/gemini-1.5-pro',
        name: 'Gemini 1.5 Pro',
        provider: 'openrouter',
        description: 'Google\'s Gemini 1.5 Pro via OpenRouter',
        isPremium: true,
        isNew: true
      },
      {
        id: 'meta-llama/llama-3-70b-instruct',
        name: 'Llama 3 70B',
        provider: 'openrouter',
        description: 'Meta\'s open-source 70B model via OpenRouter',
        isNew: true
      }
    ];
    
    // Set the models state
    setModels(defaultModels);
  }, []);
  
  const selectedModelData = models.find(model => model.id === selectedModel) || models[0] || {
    id: selectedModel,
    name: selectedModel.split('/').pop() || selectedModel,
    provider: 'other',
    description: 'Selected model'
  };
  
  return (
    <div className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between rounded-lg border border-gray-300 dark:border-gray-700 px-3 py-2 text-sm font-medium text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors w-full md:w-56"
      >
        <div className="flex items-center">
          <Sparkles className="h-4 w-4 text-primary-600 mr-2" />
          <span>{selectedModelData.name}</span>
          {selectedModelData.isPremium && (
            <span className="ml-2 px-1.5 py-0.5 text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 rounded-full">
              Pro
            </span>
          )}
          {selectedModelData.isNew && (
            <span className="ml-2 px-1.5 py-0.5 text-xs font-medium bg-primary-100 text-primary-800 dark:bg-primary-900/30 dark:text-primary-300 rounded-full">
              New
            </span>
          )}
        </div>
        <ChevronDown className="h-4 w-4 ml-2" />
      </button>
      
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <div 
              className="fixed inset-0 z-10" 
              onClick={() => setIsOpen(false)}
            />
            
            {/* Dropdown menu */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="absolute left-0 z-20 mt-1 w-full md:w-72 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-lg overflow-hidden"
            >
              <div className="p-1 max-h-72 overflow-y-auto">
                {models.map((model) => (
                  <button
                    key={model.id}
                    type="button"
                    onClick={() => {
                      onModelChange(model.id);
                      setIsOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 rounded-md flex items-start space-x-3 ${
                      selectedModel === model.id
                        ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400'
                        : 'text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-800'
                    } transition-colors`}
                  >
                    <div className={`flex-shrink-0 h-5 w-5 mt-0.5 ${
                      selectedModel === model.id
                        ? 'text-primary-600'
                        : 'text-gray-400 dark:text-gray-500'
                    }`}>
                      {selectedModel === model.id ? (
                        <Check className="h-5 w-5" />
                      ) : (
                        <Terminal className="h-5 w-5" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center">
                        <p className={`text-sm font-medium ${
                          selectedModel === model.id
                            ? 'text-primary-600 dark:text-primary-400'
                            : 'text-gray-900 dark:text-gray-100'
                        }`}>
                          {model.name}
                        </p>
                        {model.isPremium && (
                          <span className="ml-2 px-1.5 py-0.5 text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 rounded-full">
                            Pro
                          </span>
                        )}
                        {model.isNew && (
                          <span className="ml-2 px-1.5 py-0.5 text-xs font-medium bg-primary-100 text-primary-800 dark:bg-primary-900/30 dark:text-primary-300 rounded-full">
                            New
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                        <span className="font-medium">
                          {model.provider === 'openai' ? 'OpenAI' : 
                           model.provider === 'anthropic' ? 'Anthropic' : 
                           model.provider === 'openrouter' ? 'OpenRouter' : 'Other'}
                        </span> • {model.description}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ModelSelector;