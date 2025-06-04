import { useState } from 'react';
import { useStreamingContent } from '../../services/ai-service';
import { ModelInfo } from '../../services/ai-service';
import { trackUsage } from '../../services/subscription-service';

interface TextGeneratorProps {
  model: ModelInfo;
  userId?: string;
}

export function TextGenerator({ model, userId = 'user-123' }: TextGeneratorProps) {
  const [prompt, setPrompt] = useState('');
  const [temperature, setTemperature] = useState(0.7);
  const { content, streamContent, isLoading, error } = useStreamingContent();
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;
    
    // Track usage
    trackUsage(userId, 'text');
    
    // Stream the response
    await streamContent(model.id, prompt, { temperature });
  };
  
  return (
    <div className="text-generator">
      <div className="mb-4">
        <h2 className="text-xl font-bold mb-2">Generate with {model.name}</h2>
        <p className="text-sm text-gray-600">{model.description}</p>
      </div>
      
      <form onSubmit={handleSubmit} className="mb-6">
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">Your prompt</label>
          <textarea
            className="w-full p-3 border rounded-lg min-h-[120px]"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Enter your prompt here..."
            disabled={isLoading}
          />
        </div>
        
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">
            Temperature: {temperature}
          </label>
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={temperature}
            onChange={(e) => setTemperature(parseFloat(e.target.value))}
            className="w-full"
            disabled={isLoading}
          />
          <div className="flex justify-between text-xs text-gray-500">
            <span>More focused</span>
            <span>More creative</span>
          </div>
        </div>
        
        <button
          type="submit"
          className={`px-4 py-2 rounded-lg ${
            isLoading 
              ? 'bg-gray-400 cursor-not-allowed' 
              : 'bg-blue-500 hover:bg-blue-600 text-white'
          }`}
          disabled={isLoading || !prompt.trim()}
        >
          {isLoading ? 'Generating...' : 'Generate'}
        </button>
      </form>
      
      {error && (
        <div className="p-3 bg-red-100 text-red-700 rounded-lg mb-4">
          {error.message}
        </div>
      )}
      
      {content && (
        <div className="response-container">
          <h3 className="text-lg font-medium mb-2">Response</h3>
          <div className="p-4 bg-gray-50 rounded-lg whitespace-pre-wrap">
            {content}
          </div>
        </div>
      )}
    </div>
  );
}