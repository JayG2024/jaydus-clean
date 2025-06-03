import React, { useState } from 'react';
import { Check, ChevronDown, Sparkles, Terminal } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

interface Model {
  id: string;
  name: string;
  description: string;
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
  
  const models: Model[] = [
    { 
      id: 'gpt-4.1', 
      name: 'GPT-4.1',
      description: 'Next-gen model with enhanced reasoning and efficiency',
      isPremium: true
    },
    { 
      id: 'gpt-4.1-mini', 
      name: 'GPT-4.1 Mini',
      description: 'Lightweight variant for cost-effective usage'
    },
    {
      id: 'o4-mini',
      name: 'O4 Mini',
      description: 'Balanced performance with medium computational effort',
      isNew: true
    },
    { 
      id: 'claude-3-sonnet', 
      name: 'Claude 3 Sonnet',
      description: 'Balanced performance and intelligence',
      isNew: true,
      isPremium: true
    },
    { 
      id: 'llama-3', 
      name: 'Llama 3',
      description: 'Open-source AI model by Meta',
      isNew: true
    }
  ];
  
  const selectedModelData = models.find(model => model.id === selectedModel) || models[0];
  
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
                        {model.description}
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