import React, { useState } from 'react';
import { Sliders, X, Save, Sparkles, AlertCircle } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { Button } from '../../components/ui/Button';

interface ChatSettingsProps {
  settings: {
    temperature: number;
    maxTokens: number;
    topP: number;
    frequencyPenalty: number;
    presencePenalty: number;
  };
  onChange: (settings: any) => void;
  className?: string;
}

const ChatSettings: React.FC<ChatSettingsProps> = ({
  settings,
  onChange,
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [localSettings, setLocalSettings] = useState({ ...settings });
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    setLocalSettings({
      ...localSettings,
      [name]: type === 'range' ? parseFloat(value) : parseInt(value)
    });
  };
  
  const saveSettings = () => {
    onChange(localSettings);
    setIsOpen(false);
  };
  
  const resetToDefaults = () => {
    const defaultSettings = {
      temperature: 0.7,
      maxTokens: 2048,
      topP: 1,
      frequencyPenalty: 0,
      presencePenalty: 0
    };
    setLocalSettings(defaultSettings);
  };
  
  return (
    <div className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-center rounded-lg border border-gray-300 dark:border-gray-700 p-2 text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
        aria-label="Chat settings"
      >
        <Sliders className="h-5 w-5" />
      </button>
      
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <div 
              className="fixed inset-0 z-40 bg-black/40 dark:bg-black/60 backdrop-blur-sm"
              onClick={() => setIsOpen(false)}
            />
            
            {/* Settings panel */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="fixed right-4 top-20 z-50 w-full max-w-md rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-lg overflow-hidden"
            >
              <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-800 px-4 py-3">
                <h2 className="text-lg font-medium text-gray-900 dark:text-white flex items-center">
                  <Sliders className="h-5 w-5 mr-2" />
                  Model Settings
                </h2>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              
              <div className="p-4 max-h-[calc(100vh-10rem)] overflow-y-auto">
                <div className="space-y-6">
                  <div className="bg-primary-50 dark:bg-primary-900/20 rounded-lg p-3 text-sm flex items-start gap-2">
                    <Sparkles className="h-5 w-5 text-primary-600 dark:text-primary-400 flex-shrink-0 mt-0.5" />
                    <p className="text-gray-900 dark:text-gray-200">
                      These settings affect how the AI generates responses. Adjust them to your preference for optimal results.
                    </p>
                  </div>
                  
                  <div>
                    <label className="flex items-center justify-between text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      <span>Temperature: {localSettings.temperature.toFixed(1)}</span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {localSettings.temperature < 0.4 ? 'More focused' : 
                         localSettings.temperature > 0.8 ? 'More creative' : 'Balanced'}
                      </span>
                    </label>
                    <input
                      type="range"
                      name="temperature"
                      min="0"
                      max="2"
                      step="0.1"
                      value={localSettings.temperature}
                      onChange={handleChange}
                      className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer"
                    />
                    <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
                      <span>Precise</span>
                      <span>Balanced</span>
                      <span>Creative</span>
                    </div>
                  </div>
                  
                  <div>
                    <label className="flex items-center justify-between text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      <span>Max Tokens: {localSettings.maxTokens}</span>
                    </label>
                    <input
                      type="range"
                      name="maxTokens"
                      min="256"
                      max="4096"
                      step="256"
                      value={localSettings.maxTokens}
                      onChange={handleChange}
                      className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer"
                    />
                    <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
                      <span>Shorter</span>
                      <span>Longer</span>
                    </div>
                  </div>
                  
                  <div className="border-t border-gray-200 dark:border-gray-800 pt-4">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-4">Advanced Settings</p>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="flex items-center justify-between text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          <span>Top P: {localSettings.topP.toFixed(1)}</span>
                        </label>
                        <input
                          type="range"
                          name="topP"
                          min="0.1"
                          max="1"
                          step="0.1"
                          value={localSettings.topP}
                          onChange={handleChange}
                          className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer"
                        />
                      </div>
                      
                      <div>
                        <label className="flex items-center justify-between text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          <span>Frequency Penalty: {localSettings.frequencyPenalty.toFixed(1)}</span>
                        </label>
                        <input
                          type="range"
                          name="frequencyPenalty"
                          min="0"
                          max="2"
                          step="0.1"
                          value={localSettings.frequencyPenalty}
                          onChange={handleChange}
                          className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer"
                        />
                      </div>
                      
                      <div>
                        <label className="flex items-center justify-between text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          <span>Presence Penalty: {localSettings.presencePenalty.toFixed(1)}</span>
                        </label>
                        <input
                          type="range"
                          name="presencePenalty"
                          min="0"
                          max="2"
                          step="0.1"
                          value={localSettings.presencePenalty}
                          onChange={handleChange}
                          className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer"
                        />
                      </div>
                    </div>
                    
                    <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 mt-4 text-sm">
                      <div className="flex items-start gap-2">
                        <AlertCircle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
                        <p className="text-gray-700 dark:text-gray-300">
                          Advanced settings affect the model's response style. Higher penalties reduce repetition but may limit creativity.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="border-t border-gray-200 dark:border-gray-800 p-4 flex justify-end space-x-3">
                <Button
                  variant="outline"
                  onClick={resetToDefaults}
                >
                  Reset to Defaults
                </Button>
                <Button
                  onClick={saveSettings}
                >
                  <Save className="h-4 w-4 mr-2" />
                  Save Settings
                </Button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ChatSettings;