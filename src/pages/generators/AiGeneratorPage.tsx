import { ContentGenerator } from '../../components/generators/ContentGenerator';

export function AiGeneratorPage() {
  return (
    <div className="ai-generator-page">
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white py-8">
        <div className="container mx-auto px-4">
          <h1 className="text-3xl font-bold mb-2">AI Content Generator</h1>
          <p className="text-xl opacity-90">
            Create text, images, and videos with state-of-the-art AI models
          </p>
        </div>
      </div>
      
      <div className="container mx-auto px-4 py-8">
        <ContentGenerator />
      </div>
    </div>
  );
}