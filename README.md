# Jaydus Platform - Next.js with Vercel Database

A comprehensive AI toolset that includes multiple AI models for text, image, and video generation, along with chat capabilities, voiceover services, and custom AI assistants.

## Technology Stack

- Next.js 14 with App Router
- NextAuth.js for authentication
- Vercel Postgres for database
- Drizzle ORM for database operations
- OpenRouter for AI model access
- Vercel for hosting
- Tailwind CSS for styling

## Features

- Multi-modal AI generation (text, image, video)
- Support for multiple AI providers via OpenRouter
- Real-time streaming responses
- User authentication and user management
- Subscription plans with usage tracking
- Theme customization (light/dark/system mode)
- Responsive design for all devices

## Getting Started

### Prerequisites

- Node.js 18+
- Vercel account
- OpenRouter API key
- OAuth provider credentials (Google, GitHub)

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env.local` file based on `.env.example`
4. Start the development server:
   ```bash
   npm run dev
   ```

### Environment Variables Setup

For local development:
1. Copy `.env.example` to `.env.local`
2. Fill in the values for:
   - `POSTGRES_URL` - Your Vercel Postgres URL
   - `NEXTAUTH_URL` - Your app URL (http://localhost:3000 for development)
   - `NEXTAUTH_SECRET` - A random secret for NextAuth
   - `GOOGLE_CLIENT_ID` & `GOOGLE_CLIENT_SECRET` - Google OAuth credentials
   - `GITHUB_ID` & `GITHUB_SECRET` - GitHub OAuth credentials
   - `OPENROUTER_API_KEY` - Your OpenRouter API key
   - `NEXT_PUBLIC_APP_URL` - Your app URL

### Database Setup

1. Create a Vercel Postgres database
2. Run the database migrations:
   ```bash
   npx drizzle-kit push:pg
   ```

### Authentication Setup

1. Configure OAuth providers:
   - Google: https://console.cloud.google.com/
   - GitHub: https://github.com/settings/developers

2. Set up email provider (optional):
   - Configure SMTP settings for magic link authentication

## Deployment

### Vercel Deployment

1. Push your code to GitHub
2. Import the repository in Vercel
3. Set the environment variables in Vercel dashboard
4. Deploy

## Project Structure

```
/jaydus-platform
├── app/                  # Next.js App Router
│   ├── api/              # API routes
│   ├── auth/             # Auth-related pages
│   ├── dashboard/        # Dashboard pages
│   └── ...
├── components/           # React components
│   ├── dashboard/        # Dashboard components
│   ├── ui/               # UI components
│   └── ...
├── lib/                  # Utility libraries
│   ├── db.ts             # Database schema and utilities
│   ├── auth.ts           # NextAuth configuration
│   ├── openrouter.ts     # OpenRouter client
│   └── ...
├── public/               # Static assets
├── drizzle/              # Database migrations
└── ...
```

## License

This project is licensed under the MIT License - see the LICENSE file for details