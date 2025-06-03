import React, { useState } from 'react';
import { Wand2, ArrowRight, Loader2, CheckCircle, AlertCircle, Copy, Sparkles } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { Button } from '../ui/Button';
import ReactTextareaAutosize from 'react-textarea-autosize';
import { toast } from 'sonner';

interface PromptEnhancerToolProps {
  onEnhancedPrompt: (enhancedPrompt: string) => void;
  className?: string;
}

const PromptEnhancerTool: React.FC<PromptEnhancerToolProps> = ({
  onEnhancedPrompt,
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [originalPrompt, setOriginalPrompt] = useState('');
  const [enhancedPrompt, setEnhancedPrompt] = useState('');
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  
  const enhancePrompt = async () => {
    if (!originalPrompt.trim()) {
      setError('Please enter a prompt to enhance');
      return;
    }
    
    setIsEnhancing(true);
    setError(null);
    
    try {
      // Simulate API call with setTimeout
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Apply prompt engineering best practices
      const enhanced = applyPromptEngineeringPatterns(originalPrompt);
      
      setEnhancedPrompt(enhanced);
      setIsEnhancing(false);
      setShowSuccess(true);
      
      // Auto-hide success message after 3 seconds
      setTimeout(() => {
        setShowSuccess(false);
      }, 3000);
    } catch (err) {
      console.error('Error enhancing prompt:', err);
      setError('Failed to enhance prompt. Please try again.');
      setIsEnhancing(false);
    }
  };
  
  const applyPromptEngineeringPatterns = (prompt: string): string => {
    // This is a simplified implementation - in a real app, this would use more sophisticated NLP
    
    let enhanced = prompt.trim();
    
    // 1. Add clear instructions if missing
    if (!enhanced.includes('I want you to') && !enhanced.includes('Please') && !enhanced.toLowerCase().startsWith('explain') && !enhanced.toLowerCase().startsWith('write')) {
      enhanced = `I want you to ${enhanced}`;
    }
    
    // 2. Add specificity for output format if missing
    if (!enhanced.includes('format') && !enhanced.includes('style') && !enhanced.includes('structure')) {
      enhanced += `. Provide the response in a clear, structured format with sections and bullet points where appropriate.`;
    }
    
    // 3. Add request for reasoning/explanation if appropriate
    if (!enhanced.includes('explain') && !enhanced.includes('reason') && 
        (enhanced.includes('analyze') || enhanced.includes('compare') || enhanced.includes('evaluate'))) {
      enhanced += ` Include your reasoning and methodology in the response.`;
    }
    
    // 4. Add context request if missing
    if (!enhanced.includes('context') && !enhanced.toLowerCase().includes('background')) {
      enhanced += ` Consider relevant context and background information in your response.`;
    }
    
    // 5. Add personas or role-playing when appropriate
    if (enhanced.includes('expert') || enhanced.includes('professional') || 
        enhanced.includes('write') || enhanced.includes('create') || 
        enhanced.includes('design') || enhanced.includes('develop')) {
      
      if (!enhanced.includes('Act as') && !enhanced.includes('You are')) {
        const roles = {
          'write': 'an experienced writer',
          'create': 'a creative professional',
          'design': 'a skilled designer',
          'develop': 'an expert developer',
          'analyze': 'a data analyst',
          'research': 'a research scientist'
        };
        
        let role = 'a subject matter expert';
        for (const [key, value] of Object.entries(roles)) {
          if (enhanced.toLowerCase().includes(key)) {
            role = value;
            break;
          }
        }
        
        enhanced = `Act as ${role}. ${enhanced}`;
      }
    }
    
    // 6. Replace vague terms with more specific ones
    enhanced = enhanced
      .replace(/good/gi, 'high-quality')
      .replace(/better/gi, 'more effective')
      .replace(/bad/gi, 'ineffective')
      .replace(/big/gi, 'substantial')
      .replace(/small/gi, 'minimal');
      
    // 7. Add a clear call to action if missing
    if (!enhanced.includes('?') && !enhanced.toLowerCase().includes('please provide')) {
      enhanced += ` Please provide a comprehensive response.`;
    }
    
    return enhanced;
  };
  
  const useEnhancedPrompt = () => {
    onEnhancedPrompt(enhancedPrompt);
    setIsOpen(false);
    toast.success('Enhanced prompt applied');
  };
  
  const handleCopy = () => {
    navigator.clipboard.writeText(enhancedPrompt)
      .then(() => toast.success('Copied to clipboard'))
      .catch(() => toast.error('Failed to copy to clipboard'));
  };
  
  return (
    <div className={`relative ${className}`}>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setIsOpen(true)}
        className="text-gray-400 hover:text-gray-300"
        aria-label="Enhance prompt"
      >
        <Wand2 className="h-5 w-5" />
      </Button>
      
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 bg-black/50 z-40 backdrop-blur-sm"
              onClick={() => setIsOpen(false)}
            />
            
            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="fixed left-4 right-4 top-24 md:left-1/2 md:right-auto md:top-1/2 md:w-[600px] md:-translate-x-1/2 md:-translate-y-1/2 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-xl z-50 max-h-[80vh] flex flex-col"
            >
              <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex justify-between items-center">
                <h2 className="text-lg font-medium text-gray-900 dark:text-white flex items-center">
                  <Wand2 className="h-5 w-5 mr-2 text-primary-600" />
                  AI Prompt Enhancer
                </h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsOpen(false)}
                  className="text-gray-500"
                >
                  <span className="sr-only">Close</span>
                  <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </Button>
              </div>
              
              <div className="p-4 overflow-y-auto flex-1">
                <div className="space-y-4">
                  <div>
                    <label htmlFor="originalPrompt" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Enter your prompt
                    </label>
                    <ReactTextareaAutosize
                      id="originalPrompt"
                      minRows={3}
                      maxRows={6}
                      value={originalPrompt}
                      onChange={(e) => setOriginalPrompt(e.target.value)}
                      placeholder="Enter a prompt you want to enhance..."
                      className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                    />
                    {error && (
                      <p className="mt-1 text-sm text-error-600 dark:text-error-400">{error}</p>
                    )}
                  </div>
                  
                  <div className="flex justify-center">
                    <Button
                      onClick={enhancePrompt}
                      isLoading={isEnhancing}
                      disabled={isEnhancing || !originalPrompt.trim()}
                      className="w-full md:w-auto"
                    >
                      {!isEnhancing && <Sparkles className="h-4 w-4 mr-2" />}
                      Enhance Prompt
                    </Button>
                  </div>
                  
                  {showSuccess && (
                    <div className="bg-success-50 dark:bg-success-900/20 text-success-700 dark:text-success-300 p-2.5 rounded-lg flex items-center">
                      <CheckCircle className="h-4 w-4 mr-2" />
                      <span className="text-sm">Prompt enhanced successfully!</span>
                    </div>
                  )}
                  
                  {!isEnhancing && enhancedPrompt && (
                    <>
                      <div className="flex items-center pt-2">
                        <div className="flex-grow h-px bg-gray-200 dark:bg-gray-800"></div>
                        <ArrowRight className="h-5 w-5 mx-4 text-gray-400" />
                        <div className="flex-grow h-px bg-gray-200 dark:bg-gray-800"></div>
                      </div>
                      
                      <div>
                        <label htmlFor="enhancedPrompt" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex justify-between">
                          <span>Enhanced prompt</span>
                          <button 
                            onClick={handleCopy}
                            className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 text-xs font-medium flex items-center"
                          >
                            <Copy className="h-3.5 w-3.5 mr-1" />
                            Copy
                          </button>
                        </label>
                        <div className="relative">
                          <ReactTextareaAutosize
                            id="enhancedPrompt"
                            minRows={3}
                            maxRows={10}
                            value={enhancedPrompt}
                            readOnly
                            className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                          />
                        </div>
                      </div>
                      
                      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 text-sm text-gray-600 dark:text-gray-300">
                        <h3 className="font-medium text-gray-900 dark:text-white mb-1 flex items-center">
                          <Sparkles className="h-4 w-4 text-primary-600 mr-1.5" />
                          Improvements Made
                        </h3>
                        <ul className="list-disc pl-6 space-y-1 text-sm">
                          <li>Added clear structure and formatting instructions</li>
                          <li>Improved specificity and clarity</li>
                          <li>Added appropriate context framing</li>
                          <li>Replaced vague terms with more precise language</li>
                        </ul>
                      </div>
                    </>
                  )}
                </div>
              </div>
              
              {enhancedPrompt && !isEnhancing && (
                <div className="p-4 border-t border-gray-200 dark:border-gray-800">
                  <Button
                    onClick={useEnhancedPrompt}
                    className="w-full"
                  >
                    Use Enhanced Prompt
                  </Button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PromptEnhancerTool;