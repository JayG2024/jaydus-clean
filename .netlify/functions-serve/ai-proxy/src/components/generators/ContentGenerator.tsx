import { useState } from 'react';
import { ModelSelector } from './ModelSelector';
import { TextGenerator } from './TextGenerator';
import { ImageGenerator } from './ImageGenerator';
import { ModelInfo, ModelType } from '../../services/ai-service';
import { getUserSubscription } from '../../services/subscription-service';

interface ContentGeneratorProps {
  userId?: string;
}

export function ContentGenerator({ userId = 'user-123' }: ContentGeneratorProps) {
  const [selectedModel, setSelectedModel] = useState<ModelInfo | null>(null);
  const [userSubscription, setUserSubscription] = useState('free');
  
  // Fetch user subscription when component mounts
  useState(() => {
    const fetchSubscription = async () => {
      try {
        const subscription = await getUserSubscription(userId);
        setUserSubscription(subscription.plan);
      } catch (error) {
        console.error('Error fetching subscription:', error);
      }
    };
    
    fetchSubscription();
  });
  
  // Handle model selection
  const handleModelSelect = (model: ModelInfo) => {
    setSelectedModel(model);
  };
  
  return (
    <div className="content-generator max-w-4xl mx-auto p-4">
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-2">AI Content Generator</h1>
        <p className="text-gray-600">
          Select a model to generate text, images, or videos based on your prompts.
        </p>
      </div>
      
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Select AI Model</h2>
        <ModelSelector 
          onModelSelect={handleModelSelect} 
          userSubscription={userSubscription}
        />
      </div>
      
      {selectedModel && (
        <div className="generator-interface border-t pt-6">
          {selectedModel.type === 'text' && (
            <TextGenerator model={selectedModel} userId={userId} />
          )}
          
          {selectedModel.type === 'image' && (
            <ImageGenerator model={selectedModel} userId={userId} />
          )}
          
          {selectedModel.type === 'video' && (
            <div className="p-4 bg-yellow-50 rounded-lg">
              <p className="text-yellow-700">
                Video generation is coming soon! This feature is currently in development.
              </p>
            </div>
          )}
        </div>
      )}
      
      {!selectedModel && (
        <div className="p-8 bg-gray-50 rounded-lg text-center">
          <p className="text-gray-500">
            Select a model above to start generating content.
          </p>
        </div>
      )}
    </div>
  );
}