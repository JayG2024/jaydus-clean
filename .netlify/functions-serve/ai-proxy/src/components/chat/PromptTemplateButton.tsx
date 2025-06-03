import React, { useState, useRef, useEffect } from 'react';
import { BookText, Search, Star, X, FileText, Plus, ChevronRight, Sparkles } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { Button } from '../ui/Button';

interface PromptTemplate {
  id: string;
  name: string;
  description: string;
  content: string;
  category: string;
  isFavorite?: boolean;
}

interface PromptCategory {
  id: string;
  name: string;
  icon: React.ReactNode;
}

interface PromptTemplateButtonProps {
  onSelectTemplate: (template: string) => void;
  className?: string;
}

const PromptTemplateButton: React.FC<PromptTemplateButtonProps> = ({ 
  onSelectTemplate, 
  className = '' 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  
  // Sample prompt categories
  const categories: PromptCategory[] = [
    { id: 'writing', name: 'Writing', icon: <svg className="w-5 h-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg> },
    { id: 'analysis', name: 'Analysis', icon: <svg className="w-5 h-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg> },
    { id: 'business', name: 'Business', icon: <svg className="w-5 h-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg> },
    { id: 'development', name: 'Development', icon: <svg className="w-5 h-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /></svg> },
    { id: 'social', name: 'Social Media', icon: <svg className="w-5 h-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 15.546c-.523 0-1.046.151-1.5.454a2.704 2.704 0 01-3 0 2.704 2.704 0 00-3 0 2.704 2.704 0 01-3 0 2.704 2.704 0 00-3 0 2.704 2.704 0 01-3 0 2.701 2.701 0 00-1.5-.454M9 6v2m3-2v2m3-2v2M9 3h.01M12 3h.01M15 3h.01M21 21v-7a2 2 0 00-2-2H5a2 2 0 00-2 2v7h18zm-3-9v-2a2 2 0 00-2-2H8a2 2 0 00-2 2v2h12z" /></svg> },
    { id: 'emails', name: 'Emails', icon: <svg className="w-5 h-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg> }
  ];
  
  // Sample prompt templates (in a real app, these would come from a database)
  const templates: PromptTemplate[] = [
    {
      id: 'temp-1',
      name: 'Content Writer',
      description: 'Write a blog post about any topic',
      content: 'Write a blog post about [topic]. The tone should be [tone] and the target audience is [audience]. Include the following key points: [key points].',
      category: 'writing',
      isFavorite: true
    },
    {
      id: 'temp-2',
      name: 'Data Analyzer',
      description: 'Analyze data and identify key trends',
      content: 'Analyze the following data: [data]. Identify key trends, insights, and actionable recommendations.',
      category: 'analysis',
      isFavorite: true
    },
    {
      id: 'temp-3',
      name: 'Meeting Summary',
      description: 'Create a concise summary of a meeting',
      content: 'Create a concise summary of this meeting transcript: [transcript]. Include key decisions, action items, and who is responsible for each.',
      category: 'business',
      isFavorite: false
    },
    {
      id: 'temp-4',
      name: 'Code Explanation',
      description: 'Explain code in simple terms',
      content: 'Explain this code in simple terms:\n```\n[code]\n```\nBreak down what each section does and suggest any improvements.',
      category: 'development',
      isFavorite: false
    },
    {
      id: 'temp-5',
      name: 'LinkedIn Post',
      description: 'Create an engaging professional post',
      content: 'Create a LinkedIn post about [topic]. It should be professional, engaging, and end with a thought-provoking question to encourage comments.',
      category: 'social',
      isFavorite: false
    },
    {
      id: 'temp-6',
      name: 'Email - Customer Support',
      description: 'Draft a customer support response',
      content: 'Draft an email reply to a customer who reported the following issue: [issue]. Be empathetic, professional, and provide clear next steps.',
      category: 'emails',
      isFavorite: false
    },
    {
      id: 'temp-7',
      name: 'Email - Sales Outreach',
      description: 'Create a compelling sales email',
      content: 'Draft a sales outreach email to [target] about [product/service]. Highlight key benefits, include a clear value proposition, and end with a specific call to action.',
      category: 'emails',
      isFavorite: false
    },
    {
      id: 'temp-8',
      name: 'Product Description',
      description: 'Create a compelling product description',
      content: 'Write a detailed product description for [product]. Highlight its unique features, benefits, and why customers should choose it over alternatives. Include specifications and ideal use cases.',
      category: 'writing',
      isFavorite: false
    },
  ];
  
  // Filter templates based on search query and active category
  const filteredTemplates = templates
    .filter(template => 
      (!searchQuery || 
        template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        template.description.toLowerCase().includes(searchQuery.toLowerCase())
      ) &&
      (!activeCategory || 
        (activeCategory === 'favorites' ? template.isFavorite : template.category === activeCategory)
      )
    );
  
  // Close the panel when clicked outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isOpen && panelRef.current && !panelRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Focus search input when panel opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);

  const handleSelectTemplate = (template: PromptTemplate) => {
    onSelectTemplate(template.content);
    setIsOpen(false);
  };
  
  return (
    <div className={`relative ${className}`}>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setIsOpen(!isOpen)}
        className="text-gray-400 hover:text-gray-300"
        aria-label="Prompt templates"
      >
        <Sparkles className="h-5 w-5" />
      </Button>
      
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 bg-black/50 z-40 backdrop-blur-sm"
              onClick={() => setIsOpen(false)}
            />
            
            {/* Panel that slides up from bottom */}
            <motion.div
              ref={panelRef}
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 50 }}
              transition={{ duration: 0.2 }}
              className="fixed left-4 right-4 bottom-20 md:left-1/4 md:right-1/4 md:bottom-24 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-xl z-50 max-h-[70vh] flex flex-col"
            >
              <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex justify-between items-center">
                <h2 className="text-lg font-medium text-gray-900 dark:text-white flex items-center">
                  <Sparkles className="h-5 w-5 mr-2 text-primary-600" />
                  Prompt Templates
                </h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsOpen(false)}
                  className="text-gray-500"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
              
              <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500 dark:text-gray-400" />
                  <input
                    ref={searchInputRef}
                    type="text"
                    placeholder="Search templates..."
                    className="w-full pl-9 pr-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                
                {/* Category dropdown */}
                <div className="relative">
                  <select
                    className="h-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 px-3 py-2 appearance-none pr-8"
                    value={activeCategory || ""}
                    onChange={(e) => setActiveCategory(e.target.value || null)}
                  >
                    <option value="">All</option>
                    <option value="favorites">Favorites</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>{category.name}</option>
                    ))}
                  </select>
                  <ChevronRight className="absolute right-3 top-1/2 transform -translate-y-1/2 rotate-90 h-4 w-4 text-gray-500" />
                </div>
              </div>
              
              {/* Templates grid */}
              <div className="flex-1 overflow-y-auto p-4">
                {filteredTemplates.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full py-8 px-4 text-center">
                    <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded-full mb-3">
                      <Search className="h-5 w-5 text-gray-500" />
                    </div>
                    <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      No templates found
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                      Try adjusting your search or filters
                    </p>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        setSearchQuery('');
                        setActiveCategory(null);
                      }}
                    >
                      Clear filters
                    </Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {filteredTemplates.map((template) => (
                      <div
                        key={template.id}
                        className="p-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700 rounded-lg cursor-pointer transition-colors"
                        onClick={() => handleSelectTemplate(template)}
                      >
                        {/* Template header with name and favorite icon */}
                        <div className="flex justify-between items-center mb-1">
                          <h3 className="text-sm font-medium text-gray-900 dark:text-white flex items-center">
                            {template.isFavorite && (
                              <Star className="h-3.5 w-3.5 text-amber-500 mr-1 flex-shrink-0" />
                            )}
                            {template.name}
                          </h3>
                          <span className="text-xs px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded">
                            {categories.find(c => c.id === template.category)?.name || template.category}
                          </span>
                        </div>
                        
                        {/* Template description */}
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                          {template.description}
                        </p>
                        
                        {/* Template content preview */}
                        <div className="p-2 bg-gray-50 dark:bg-gray-800 rounded text-sm text-gray-600 dark:text-gray-300 font-mono line-clamp-2 text-xs">
                          {template.content}
                        </div>
                        
                        <Button 
                          variant="ghost"
                          size="sm" 
                          className="w-full mt-2 justify-center text-primary-600 dark:text-primary-400 hover:bg-gray-100 dark:hover:bg-gray-800"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSelectTemplate(template);
                          }}
                        >
                          Use template
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PromptTemplateButton;