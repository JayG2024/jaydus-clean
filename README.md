# Jaydus Platform - Next.js with Supabase

A comprehensive AI toolset that includes multiple AI models for text, image, and video generation, along with chat capabilities, voiceover services, and custom AI assistants.

## Technology Stack

- Next.js 14 with App Router
- Supabase for authentication and database
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
- Supabase account
- OpenRouter API key
- Vercel account (for deployment)

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
   - `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Your Supabase anon key
   - `OPENROUTER_API_KEY` - Your OpenRouter API key
   - `NEXT_PUBLIC_OPENROUTER_API_KEY` - Same as above (for client-side)
   - `NEXT_PUBLIC_APP_URL` - Your app URL (http://localhost:3000 for development)

### Supabase Setup

1. Create a new Supabase project
2. Run the SQL migrations in the `supabase/migrations` folder
3. Set up authentication providers (Email, GitHub, etc.)
4. Configure storage buckets if needed

## Deployment

### Vercel Deployment

1. Push your code to GitHub
2. Import the repository in Vercel
3. Set the environment variables
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
│   ├── supabase.ts       # Supabase client
│   ├── openrouter.ts     # OpenRouter client
│   └── ...
├── public/               # Static assets
├── supabase/             # Supabase migrations
└── ...
```

## License

This project is licensed under the MIT License - see the LICENSE file for details