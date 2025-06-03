import React, { useState, useEffect } from 'react';
import { Bot, Check, ChevronDown, Plus } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

interface Assistant {
  id: string;
  name: string;
  description: string;
  model: string;
  status: 'training' | 'ready' | 'failed';
}

interface AssistantSelectorProps {
  selectedAssistantId: string | null;
  onAssistantChange: (assistantId: string | null) => void;
  className?: string;
}

const AssistantSelector: React.FC<AssistantSelectorProps> = ({
  selectedAssistantId,
  onAssistantChange,
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [assistants, setAssistants] = useState<Assistant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  
  // Load assistants from localStorage on component mount
  useEffect(() => {
    const loadAssistants = async () => {
      setIsLoading(true);
      try {
        const savedAssistants = localStorage.getItem('assistants');
        if (savedAssistants) {
          const parsedAssistants = JSON.parse(savedAssistants);
          setAssistants(parsedAssistants);
        } else {
          // Mock assistants if none exist
          setAssistants([
            {
              id: 'ast-123',
              name: 'Customer Support',
              description: 'Handles customer inquiries and troubleshooting',
              model: 'GPT-4',
              status: 'ready'
            },
            {
              id: 'ast-456',
              name: 'Marketing Assistant',
              description: 'Helps create and analyze marketing campaigns',
              model: 'GPT-4',
              status: 'ready'
            },
            {
              id: 'ast-789',
              name: 'Data Analyzer',
              description: 'Analyzes and visualizes business metrics',
              model: 'GPT-3.5 Turbo',
              status: 'ready'
            }
          ]);
        }
      } catch (error) {
        console.error('Error loading assistants:', error);
        // Set default assistants in case of error
        setAssistants([]);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadAssistants();
  }, []);
  
  const selectedAssistant = selectedAssistantId
    ? assistants.find(assistant => assistant.id === selectedAssistantId) || null
    : null;
  
  return (
    <div className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between rounded-lg border border-gray-300 dark:border-gray-700 px-3 py-2 text-sm font-medium text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors w-full md:w-56"
      >
        <div className="flex items-center">
          <Bot className="h-4 w-4 text-primary-600 mr-2" />
          <span>{selectedAssistant ? selectedAssistant.name : 'No Assistant'}</span>
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
              {isLoading ? (
                <div className="py-4 px-3 text-center">
                  <div className="animate-spin h-5 w-5 border-t-2 border-primary-600 border-r-2 rounded-full mx-auto mb-2"></div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Loading assistants...</p>
                </div>
              ) : (
                <>
                  <div className="p-2 border-b border-gray-200 dark:border-gray-700">
                    <button
                      type="button"
                      onClick={() => {
                        onAssistantChange(null);
                        setIsOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2 rounded-md flex items-start space-x-3 ${
                        selectedAssistantId === null
                          ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400'
                          : 'text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-800'
                      } transition-colors`}
                    >
                      <div className={`flex-shrink-0 h-5 w-5 mt-0.5 ${
                        selectedAssistantId === null
                          ? 'text-primary-600'
                          : 'text-gray-400 dark:text-gray-500'
                      }`}>
                        {selectedAssistantId === null ? (
                          <Check className="h-5 w-5" />
                        ) : (
                          <Bot className="h-5 w-5" />
                        )}
                      </div>
                      <div className="flex-1">
                        <p className={`text-sm font-medium ${
                          selectedAssistantId === null
                            ? 'text-primary-600 dark:text-primary-400'
                            : 'text-gray-900 dark:text-gray-100'
                        }`}>
                          No Assistant
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                          Standard chat without specialized knowledge
                        </p>
                      </div>
                    </button>
                  </div>
                  
                  <div className="p-1 max-h-60 overflow-y-auto">
                    {assistants.length === 0 ? (
                      <div className="py-4 px-3 text-center">
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">No assistants found</p>
                        <button
                          className="inline-flex items-center text-xs font-medium text-primary-600 dark:text-primary-400 hover:underline"
                          onClick={() => {
                            setIsOpen(false);
                            navigate('/assistants');
                          }}
                        >
                          <Plus className="h-3 w-3 mr-1" />
                          Create an assistant
                        </button>
                      </div>
                    ) : (
                      assistants.map((assistant) => (
                        <button
                          key={assistant.id}
                          type="button"
                          onClick={() => {
                            onAssistantChange(assistant.id);
                            setIsOpen(false);
                          }}
                          className={`w-full text-left px-3 py-2 rounded-md flex items-start space-x-3 ${
                            selectedAssistantId === assistant.id
                              ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400'
                              : 'text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-800'
                          } transition-colors`}
                          disabled={assistant.status !== 'ready'}
                        >
                          <div className={`flex-shrink-0 h-5 w-5 mt-0.5 ${
                            selectedAssistantId === assistant.id
                              ? 'text-primary-600'
                              : 'text-gray-400 dark:text-gray-500'
                          }`}>
                            {selectedAssistantId === assistant.id ? (
                              <Check className="h-5 w-5" />
                            ) : (
                              <Bot className="h-5 w-5" />
                            )}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center">
                              <p className={`text-sm font-medium ${
                                selectedAssistantId === assistant.id
                                  ? 'text-primary-600 dark:text-primary-400'
                                  : 'text-gray-900 dark:text-gray-100'
                              }`}>
                                {assistant.name}
                              </p>
                              {assistant.status !== 'ready' && (
                                <span className="ml-2 px-1.5 py-0.5 text-xs font-medium bg-warning-100 text-warning-800 dark:bg-warning-900/30 dark:text-warning-400 rounded-full">
                                  {assistant.status}
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                              {assistant.description}
                            </p>
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                  
                  <div className="p-2 border-t border-gray-200 dark:border-gray-700">
                    <button
                      type="button"
                      onClick={() => {
                        setIsOpen(false);
                        navigate('/assistants');
                      }}
                      className="w-full text-center px-3 py-2 text-xs font-medium text-primary-600 dark:text-primary-400 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-md"
                    >
                      <Plus className="h-3 w-3 inline-block mr-1" />
                      Create or manage assistants
                    </button>
                  </div>
                </>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AssistantSelector;