# AI Generation Integration Guide

This guide explains how to integrate the new AI generation components into your existing application.

## Overview

The new AI generation system provides:

1. A unified interface for multiple AI models (text, image, video)
2. Support for multiple providers (OpenAI, Claude, Stability AI)
3. Real-time streaming for text generation
4. Subscription-based access control

## Integration Steps

### 1. Add the AI Generation Page to Your Routes

Add the AI Generator page to your existing routes:

```jsx
// src/App.tsx or your router configuration
import { AiGeneratorPage } from './pages/generators/AiGeneratorPage';

// In your routes configuration
<Route path="/ai-generator" element={<AiGeneratorPage />} />
```

### 2. Add Navigation Link

Add a navigation link to your sidebar or navigation menu:

```jsx
<NavLink to="/ai-generator">
  <Sparkles className="h-5 w-5 mr-2" />
  AI Generator
</NavLink>
```

### 3. Configure Environment Variables

Make sure you have the necessary environment variables set up:

```
OPENAI_API_KEY=your_openai_api_key
ANTHROPIC_API_KEY=your_anthropic_api_key
```

### 4. Deploy Edge Functions

The AI streaming functionality requires Netlify Edge Functions. Make sure your `netlify.toml` file includes:

```toml
[[edge_functions]]
  path = "/api/ai-stream"
  function = "ai-stream"
```

## Using the Components Individually

You can also use the individual components in your existing pages:

### Text Generator

```jsx
import { TextGenerator } from '../components/generators/TextGenerator';
import { availableModels } from '../services/ai-service';

// Find a specific model
const gpt4Model = availableModels.find(model => model.id === 'gpt-4o');

function MyPage() {
  return (
    <div>
      <h1>My Custom Page</h1>
      {gpt4Model && <TextGenerator model={gpt4Model} userId="user-123" />}
    </div>
  );
}
```

### Image Generator

```jsx
import { ImageGenerator } from '../components/generators/ImageGenerator';
import { availableModels } from '../services/ai-service';

// Find a specific model
const dalleModel = availableModels.find(model => model.id === 'dall-e-3');

function MyPage() {
  return (
    <div>
      <h1>My Custom Page</h1>
      {dalleModel && <ImageGenerator model={dalleModel} userId="user-123" />}
    </div>
  );
}
```

### Model Selector

```jsx
import { useState } from 'react';
import { ModelSelector } from '../components/generators/ModelSelector';
import { TextGenerator } from '../components/generators/TextGenerator';
import { ImageGenerator } from '../components/generators/ImageGenerator';
import { ModelInfo } from '../services/ai-service';

function MyPage() {
  const [selectedModel, setSelectedModel] = useState<ModelInfo | null>(null);
  
  return (
    <div>
      <h1>My Custom Page</h1>
      
      <ModelSelector 
        onModelSelect={setSelectedModel}
        userSubscription="pro" // or get from user context
      />
      
      {selectedModel?.type === 'text' && (
        <TextGenerator model={selectedModel} />
      )}
      
      {selectedModel?.type === 'image' && (
        <ImageGenerator model={selectedModel} />
      )}
    </div>
  );
}
```

## Subscription Integration

The AI generation features are designed to work with a subscription system. To integrate with your existing subscription system:

1. Update the `getUserSubscription` function in `src/services/subscription-service.ts` to fetch the user's actual subscription from your database
2. Update the subscription plan definitions in `subscriptionPlans` to match your actual plans
3. Modify the `trackUsage` function to record usage in your database

## Customization

### Adding New Models

To add a new AI model:

1. Add the model information to `src/services/ai-service.ts` in the `availableModels` array
2. Implement the API integration in `netlify/functions/ai-proxy.ts`
3. For streaming models, update `netlify/edge-functions/ai-stream.ts`

### Styling

The components use Tailwind CSS classes for styling. You can customize the appearance by:

1. Modifying the component files directly
2. Creating wrapper components with your own styling
3. Overriding the Tailwind classes in your CSS

## Troubleshooting

### API Keys Not Working

- Verify that your API keys are correctly set in the environment variables
- Check that the keys have the necessary permissions
- Ensure the keys are being correctly passed to the API clients

### Streaming Not Working

- Make sure Netlify Edge Functions are properly configured
- Check that your browser supports the Fetch API and ReadableStream
- Verify that CORS is properly configured

### Models Not Appearing

- Check that the models are marked as `available: true` in the `availableModels` array
- Verify that the user's subscription level has access to those models
- Check for any console errors that might indicate API issues