import React, { useState } from 'react';
import { FileText, ChevronDown } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

interface PromptTemplateDropdownProps {
  onSelectTemplate: (template: string) => void;
  className?: string;
}

const PromptTemplateDropdown: React.FC<PromptTemplateDropdownProps> = ({ 
  onSelectTemplate, 
  className = '' 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  
  const templates = [
    {
      name: 'Explain a concept',
      prompt: 'Explain [concept] in simple terms. Include examples and analogies that would help someone understand it better.'
    },
    {
      name: 'Summarize text',
      prompt: 'Summarize the following text in a concise way while preserving the key points:\n\n[text]'
    },
    {
      name: 'Compare and contrast',
      prompt: 'Compare and contrast [item 1] and [item 2]. Include similarities, differences, and which might be better in different circumstances.'
    }
  ];
  
  return (
    <div className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between rounded-lg border border-gray-300 dark:border-gray-700 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
      >
        <span className="flex items-center">
          <FileText className="h-4 w-4 mr-2" />
          Prompts
        </span>
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
            
            {/* Dropdown */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="absolute right-0 mt-2 w-72 max-h-96 overflow-y-auto bg-white dark:bg-gray-900 rounded-lg shadow-lg z-20 border border-gray-200 dark:border-gray-800"
            >
              <div className="py-1">
                {templates.map((template, index) => (
                  <button
                    key={index}
                    className="w-full text-left px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-800"
                    onClick={() => {
                      onSelectTemplate(template.prompt);
                      setIsOpen(false);
                    }}
                  >
                    <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">{template.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">{template.prompt}</p>
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

export default PromptTemplateDropdown;