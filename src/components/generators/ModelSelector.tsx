import { useState } from 'react';
import { availableModels, ModelType, ModelInfo } from '../../services/ai-service';

interface ModelSelectorProps {
  onModelSelect: (model: ModelInfo) => void;
  selectedType?: ModelType;
  userSubscription?: string;
}

export function ModelSelector({ 
  onModelSelect, 
  selectedType = 'text',
  userSubscription = 'free'
}: ModelSelectorProps) {
  const [activeType, setActiveType] = useState<ModelType>(selectedType);
  
  // Filter models by type and availability
  const filteredModels = availableModels.filter(model => {
    if (model.type !== activeType) return false;
    if (!model.available) return false;
    
    // Filter based on subscription level
    switch (userSubscription) {
      case 'free':
        // Free users can only access certain text models
        return model.type === 'text' && ['gpt-4o'].includes(model.id);
      case 'basic':
        // Basic users can access text and some image models
        if (model.type === 'text') {
          return ['gpt-4o', 'claude-3-sonnet'].includes(model.id);
        }
        if (model.type === 'image') {
          return ['dall-e-3'].includes(model.id);
        }
        return false;
      case 'pro':
      case 'enterprise':
        // Pro and enterprise users can access all available models
        return true;
      default:
        return false;
    }
  });
  
  return (
    <div className="model-selector">
      {/* Type tabs */}
      <div className="flex space-x-2 mb-4">
        <button 
          className={`px-4 py-2 rounded ${activeType === 'text' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
          onClick={() => setActiveType('text')}
        >
          Text
        </button>
        <button 
          className={`px-4 py-2 rounded ${activeType === 'image' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
          onClick={() => setActiveType('image')}
          disabled={userSubscription === 'free'}
        >
          Image
        </button>
        <button 
          className={`px-4 py-2 rounded ${activeType === 'video' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
          onClick={() => setActiveType('video')}
          disabled={userSubscription === 'free' || userSubscription === 'basic'}
        >
          Video
        </button>
      </div>
      
      {/* Model cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredModels.map(model => (
          <div 
            key={model.id} 
            className="border rounded-lg p-4 cursor-pointer hover:shadow-md transition"
            onClick={() => onModelSelect(model)}
          >
            <h3 className="text-lg font-bold">{model.name}</h3>
            <div className="text-sm text-gray-500">{model.provider}</div>
            <p className="mt-2 text-sm">{model.description}</p>
            <div className="mt-3 flex flex-wrap gap-1">
              {model.capabilities.map(cap => (
                <span key={cap} className="text-xs bg-gray-100 px-2 py-1 rounded">{cap}</span>
              ))}
            </div>
            <div className="mt-3 text-sm text-gray-600">{model.pricing}</div>
          </div>
        ))}
        
        {filteredModels.length === 0 && (
          <div className="col-span-full p-4 bg-gray-50 rounded-lg text-center">
            {userSubscription === 'free' && activeType !== 'text' ? (
              <p>Upgrade your subscription to access {activeType} generation models.</p>
            ) : (
              <p>No available models found for this category.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}