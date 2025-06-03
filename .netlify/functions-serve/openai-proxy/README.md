# Jaydus SaaS AI Dashboard

Jaydus Platform is a comprehensive AI toolset that includes multiple AI models for text, image, and video generation, along with chat capabilities, voiceover services, and custom AI assistants.

## Technology Stack

- React 18 with TypeScript
- Clerk for authentication (replacing Supabase Auth)
- MongoDB Atlas for database (optional alternative to Supabase)
- Netlify Edge Functions for streaming AI responses
- Multiple AI providers (OpenAI, Anthropic Claude, Stability AI)
- Stripe for subscription management
- Tailwind CSS for styling
- Vite for development and building

## Features

- Multi-modal AI generation (text, image, video)
- Support for multiple AI providers
- Real-time streaming responses
- User authentication and user management
- Subscription plans with usage tracking
- Team collaboration
- Theme customization (light/dark/system mode)
- Responsive design for all devices

## Getting Started

### Prerequisites

- Node.js 18+
- Netlify CLI (for local development)
- API keys for AI providers (OpenAI, Anthropic, etc.)
- Clerk account (for authentication)
- MongoDB Atlas account (optional)
- Stripe account (for payment processing)

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env.local` file based on `.env.example`
4. Start the development server with Netlify CLI:
   ```bash
   npm run netlify:dev
   ```

### Environment Variables Setup

For local development:
1. Copy `.env.example` to `.env.local`
2. Fill in the values for:
   - `OPENAI_API_KEY` - Your OpenAI API key
   - `ANTHROPIC_API_KEY` - Your Anthropic API key
   - `STABILITY_API_KEY` - Your Stability AI API key
   - `VITE_CLERK_PUBLISHABLE_KEY` - Your Clerk publishable key
   - `CLERK_SECRET_KEY` - Your Clerk secret key
   - `MONGODB_URI` - Your MongoDB connection string (if using MongoDB)
   - `VITE_STRIPE_PUBLISHABLE_KEY` - Your Stripe publishable key
   - `STRIPE_SECRET_KEY` - Your Stripe secret key

For production deployments:
1. Set these environment variables in your Netlify dashboard
2. Make sure to set `VITE_ENABLE_MOCK_MODE=false` for production

### AI Models Configuration

The platform supports multiple AI models:

#### Text Generation
- OpenAI GPT-4o, GPT-4, etc.
- Anthropic Claude 3 Opus, Claude 3 Sonnet, etc.
- More models can be added in `src/services/ai-service.ts`

#### Image Generation
- OpenAI DALL-E 3
- Stability AI Stable Diffusion XL
- More models can be added in `src/services/ai-service.ts`

#### Video Generation
- Coming soon!

### Authentication Setup (Clerk)

1. Create a new Clerk application at [clerk.com](https://clerk.com)
2. Configure authentication settings:
   - Enable Email/Password sign-in
   - Set up social login providers (optional)
   - Configure email templates
3. Get your API keys from the Clerk dashboard
4. Add the keys to your environment variables

### MongoDB Setup (Optional)

If using MongoDB instead of Supabase:

1. Create a MongoDB Atlas cluster at [mongodb.com](https://mongodb.com)
2. Set up a database and collections for:
   - users
   - usage
   - chats
   - subscriptions
3. Get your connection string and add it to your environment variables

### Stripe Integration

The project uses Netlify Functions for Stripe integration:
- `create-checkout` - Creates a Stripe checkout session
- `create-portal` - Creates a Stripe customer portal session
- `stripe-webhook` - Handles Stripe webhook events

To set up Stripe:
1. Create products and prices in the Stripe dashboard
2. Update the subscription plans in `src/services/subscription-service.ts`
3. Configure webhook endpoints in the Stripe dashboard

## AI Generation Features

The platform provides a unified interface for generating content with multiple AI models:

### Text Generation
- Real-time streaming responses
- Temperature and other parameter controls
- Support for multiple providers

### Image Generation
- Multiple size options
- Various style controls
- Support for multiple providers

### Video Generation (Coming Soon)
- Text-to-video generation
- Image-to-video generation
- Style transfer options

## Project Structure

```
/jaydus-saas-AI-dashboard
├── netlify/
│   ├── edge-functions/     # Edge functions for streaming
│   │   └── ai-stream.ts    # Streaming AI responses
│   └── functions/          # Serverless functions
│       └── ai-proxy.ts     # Non-streaming AI operations
├── src/
│   ├── components/         # React components
│   │   └── generators/     # AI generation components
│   ├── pages/              # Page components
│   ├── services/           # API and service functions
│   └── utils/              # Utility functions
```

## Security Considerations

- Use environment variables for all sensitive configuration
- Implement proper authentication and authorization
- Configure Content Security Policy headers
- Add rate limiting to prevent abuse
- Validate all user inputs

## Error Handling

The application includes robust error handling through:
- React error boundaries to prevent the entire app from crashing
- Consistent error UI patterns across the application
- Proper validation for all user inputs
- Graceful fallbacks for API failures

## License

This project is licensed under the MIT License - see the LICENSE file for details