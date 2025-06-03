# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build/Test/Lint Commands
- Build: `npm run build` (TypeScript compilation + Vite build)
- Lint: `npm run lint` (ESLint with TypeScript support)
- Development: `npm run dev` (Local Vite dev server)
- Netlify Development: `npm run netlify:dev` (Full stack with edge functions)
- MongoDB Setup: `npm run init-mongodb` (Initialize database collections)
- MongoDB with Sample Data: `npm run init-mongodb-with-data`

## Architecture Overview

### Core Platform Structure
This is a comprehensive AI SaaS platform (Jaydus Platform) that combines multiple AI providers (OpenAI, Anthropic, Stability AI) with user management, subscription billing, and real-time streaming capabilities.

### Key Architectural Patterns

**Hybrid Deployment Model**: The application uses Netlify edge functions for streaming AI responses and serverless functions for non-streaming operations, with MongoDB Atlas for persistence and Stripe for payments.

**Multi-Provider AI Integration**: The `src/services/ai-service.ts` provides a unified interface for different AI providers. Models are cataloged with capabilities, pricing, and availability flags. The system supports both streaming and non-streaming generation.

**Enhanced Error Handling System**: Comprehensive error handling includes:
- API key validation with automatic fallback to mock mode (`src/utils/apiKeyValidator.ts`)
- Circuit breaker pattern for preventing cascading failures (`src/utils/circuitBreaker.ts`)
- Intelligent retry logic with exponential backoff (`src/utils/retryWithBackoff.ts`)
- Graceful degradation with mock data generators (`src/utils/gracefulDegradation.ts`)
- Enhanced React error boundaries with auto-recovery (`src/components/ErrorBoundary.tsx`)
- Centralized logging with pattern detection (`src/utils/errorLogger.ts`)

**Context-Based State Management**: Uses React Context API for:
- `MongoDBContext`: Database connection state with mock mode support
- `ClerkAuthContext`: Authentication state and user management
- `ThemeContext`: Theme switching (light/dark/system)

**Environment-Aware Configuration**: The application automatically detects service health and enables mock mode when API keys are invalid or services are unavailable. Environment validation happens at startup with graceful fallbacks.

### AI Service Integration Flow
1. Client makes request to unified AI service interface
2. Request routed to appropriate provider (OpenAI/Anthropic/Stability)
3. For streaming: Uses Netlify edge functions (`netlify/edge-functions/ai-stream.ts`)
4. For non-streaming: Uses serverless functions (`netlify/functions/ai-proxy.ts`)
5. Circuit breaker monitors service health and prevents cascading failures
6. Graceful degradation provides mock responses when services fail

### Database Architecture
MongoDB collections:
- `users`: User profiles and subscription information
- `chats`: Chat conversations and messages
- `usage`: AI operation tracking for billing
- `api_keys`: External API access management
- `subscriptions`: Stripe subscription details

### Authentication & Authorization Flow
- Clerk handles authentication with configurable bypass for development
- Context providers manage user state across the application
- Protected routes check authentication status with error boundary wrapping
- Mock mode allows development without valid authentication

### Error Recovery Strategy
The application implements multiple layers of error recovery:
1. **Service Level**: Circuit breakers prevent repeated failures
2. **Request Level**: Intelligent retry with exponential backoff
3. **Component Level**: React error boundaries with auto-recovery
4. **Application Level**: Graceful degradation with mock data
5. **User Level**: Friendly error messages with recovery actions

### Development vs Production Modes
- **Mock Mode**: Enabled via `VITE_ENABLE_MOCK_MODE=true`, bypasses all external services
- **Development**: Authentication can be bypassed, enhanced logging enabled
- **Production**: Full service validation, error tracking, and user protection

## Code Style Guidelines
- TypeScript strict mode enabled
- Follow existing patterns for AI service integration
- Use context providers for cross-component state
- Implement proper error boundaries around major features
- Maintain separation between streaming and non-streaming operations

## Environment Variables Setup
Critical variables for functionality:
- `OPENROUTER_API_KEY`: OpenRouter API access for AI chat (required)
- `VITE_OPENROUTER_API_KEY`: Frontend OpenRouter access (required)
- `VITE_CLERK_PUBLISHABLE_KEY`: User authentication (required)
- `CLERK_SECRET_KEY`: Clerk backend operations (required)
- `VITE_CLERK_DOMAIN`: Custom Clerk domain (required)
- `MONGODB_URI`: Database connection (required)
- `VITE_APP_URL`: Application URL for proper routing
- `VITE_API_URL`: API endpoint configuration
- `VITE_ENABLE_MOCK_MODE`: Enables mock mode for development (optional)

Optional development variables:
- `VITE_ENABLE_DEV_TOOLS`: Development tools toggle
- `VITE_LOG_LEVEL`: Logging configuration

The application uses OpenRouter exclusively for AI functionality. All OpenAI and Anthropic integrations have been removed.

## Authentication (Clerk) Configuration
- The application uses Clerk for authentication with custom error handling
- CSP (Content Security Policy) has been updated to allow Cloudflare Turnstile scripts
- Three auth pages available:
  - `/login` - Standard login page with enhanced error handling and OAuth
  - `/signup` - Standard signup page with tips, connection status, and OAuth
  - `/auth` - Unified auth page with custom form fallback option
- If Clerk forms fail to load due to CSP or network issues, users can use the custom form on `/auth`

### OAuth Configuration
- Google OAuth is supported (configure in Clerk Dashboard)
- Microsoft OAuth is supported (configure in Clerk Dashboard)
- Social buttons appear at the top of auth forms
- OAuth redirect URI: `https://clerk.jaydus.ai/v1/oauth_callback`
- See `docs/GOOGLE_OAUTH_SETUP.md` for Google setup instructions
- See `docs/MICROSOFT_OAUTH_SETUP.md` for Microsoft setup instructions
- CSS overrides in `src/styles/clerk-overrides.css` ensure proper button display