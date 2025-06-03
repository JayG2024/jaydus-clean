# Jaydus SaaS AI Dashboard

Jaydus Platform is a comprehensive AI toolset that includes multiple AI models for text, image, and video generation, along with chat capabilities, voiceover services, and custom AI assistants.

## Technology Stack

- React 18 with TypeScript
- Clerk for authentication
- MongoDB Atlas for database
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
- MongoDB Atlas account
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
   - `MONGODB_URI` - Your MongoDB connection string
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

### MongoDB Setup

1. Create a MongoDB Atlas cluster at [mongodb.com](https://mongodb.com)
2. Get your connection string and add it to your environment variables as `MONGODB_URI`
3. Run the MongoDB setup script to create the necessary collections and indexes:
   ```bash
   npm run init-mongodb
   ```
4. For development with sample data, you can run:
   ```bash
   npm run init-mongodb-with-data
   ```

The database will be set up with the following collections:
- users - User profiles and subscription information
- chats - Chat conversations and messages
- usage - Usage tracking for AI operations
- api_keys - API keys for external access
- integrations - Third-party service connections
- subscriptions - Subscription details

### Stripe Integration

The project uses Netlify Functions for Stripe integration:
- `create-checkout` - Creates a Stripe checkout session
- `create-portal` - Creates a Stripe customer portal session
- `stripe-webhook` - Handles Stripe webhook events

To set up Stripe:
1. Create products and prices in the Stripe dashboard
2. Update the subscription plans in `src/services/subscription-service.ts`
3. Configure webhook endpoints in the Stripe dashboard
4. Set up environment variables using our setup script:
   ```bash
   ./scripts/setup-netlify-env.sh
   ```

The application includes robust error handling for Stripe integration:
- Graceful fallbacks when Stripe keys are missing
- Mock mode support for development and testing
- User-friendly error messages for payment issues
- Detailed logging for troubleshooting

For detailed instructions, see [STRIPE_SETUP.md](./STRIPE_SETUP.md)

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

The application includes comprehensive error handling through:
- Enhanced React error boundaries to prevent the entire app from crashing
- Consistent error UI patterns across the application
- Proper validation for all user inputs
- Graceful fallbacks for API failures
- Centralized error logging and reporting
- User-friendly error messages
- Automatic recovery strategies for common errors
- Environment variable validation with fallbacks
- Mock mode support for development and testing

### Error Handling Components and Utilities

- `ErrorBoundary` - React component that catches errors in the component tree
- `ErrorMessage` - Reusable component for displaying error messages
- `useErrorHandler` - Custom hook for handling errors in React components
- `logError` - Utility for logging errors with severity levels
- `AppError` - Custom error class with additional context
- `envValidator` - Utility for validating environment variables

For more information on Stripe integration, see [STRIPE_SETUP.md](./STRIPE_SETUP.md).

## License

This project is licensed under the MIT License - see the LICENSE file for details# Trigger deployment - Sun May 25 10:39:08 CEST 2025
