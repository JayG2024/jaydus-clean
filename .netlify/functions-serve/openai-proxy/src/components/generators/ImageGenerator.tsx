import { useState } from 'react';
import { generateImage, ModelInfo } from '../../services/ai-service';
import { trackUsage } from '../../services/subscription-service';

interface ImageGeneratorProps {
  model: ModelInfo;
  userId?: string;
}

export function ImageGenerator({ model, userId = 'user-123' }: ImageGeneratorProps) {
  const [prompt, setPrompt] = useState('');
  const [size, setSize] = useState('1024x1024');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [images, setImages] = useState<string[]>([]);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Track usage
      trackUsage(userId, 'image');
      
      // Generate image
      const response = await generateImage(model.id, prompt, { size });
      
      // Handle different response formats from different providers
      if (response.data && Array.isArray(response.data)) {
        // OpenAI format
        setImages(response.data.map((item: any) => item.url));
      } else if (response.images && Array.isArray(response.images)) {
        // Generic format
        setImages(response.images);
      } else {
        console.error('Unexpected response format:', response);
        setError(new Error('Received an unexpected response format'));
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error('An unknown error occurred'));
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="image-generator">
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
            placeholder="Describe the image you want to generate..."
            disabled={isLoading}
          />
        </div>
        
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">Image size</label>
          <select
            className="w-full p-2 border rounded-lg"
            value={size}
            onChange={(e) => setSize(e.target.value)}
            disabled={isLoading}
          >
            <option value="1024x1024">1024x1024 (Square)</option>
            <option value="1024x1792">1024x1792 (Portrait)</option>
            <option value="1792x1024">1792x1024 (Landscape)</option>
          </select>
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
          {isLoading ? 'Generating...' : 'Generate Image'}
        </button>
      </form>
      
      {error && (
        <div className="p-3 bg-red-100 text-red-700 rounded-lg mb-4">
          {error.message}
        </div>
      )}
      
      {images.length > 0 && (
        <div className="response-container">
          <h3 className="text-lg font-medium mb-2">Generated Images</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {images.map((imageUrl, index) => (
              <div key={index} className="border rounded-lg overflow-hidden">
                <img 
                  src={imageUrl} 
                  alt={`Generated image ${index + 1}`} 
                  className="w-full h-auto"
                />
                <div className="p-2 bg-gray-50">
                  <a 
                    href={imageUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-500 text-sm"
                  >
                    Open full size
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}