# Deployment Guide for Jaydus Platform

This document outlines the steps to deploy the Jaydus Platform to production.

## Critical Components

### OpenAI Chat Functionality
- The OpenAI API proxy is located at `netlify/functions/openai-proxy.ts`
- DO NOT modify this file unless absolutely necessary
- Requires `OPENAI_API_KEY` (without VITE_ prefix) in environment variables

### Microphone Access
- Configured via Permissions-Policy in `netlify.toml`
- Current setting: `Permissions-Policy = "camera=(), microphone=self, geolocation=(), interest-cohort=()"` 
- DO NOT add duplicate Permissions-Policy entries in the file
- DO NOT remove the microphone=self setting

### Environment Variables
- Server-side (for Netlify functions): NO "VITE_" prefix (e.g., OPENAI_API_KEY)
- Client-side: WITH "VITE_" prefix (e.g., VITE_SUPABASE_URL)
- Application URL should point to production: `VITE_APP_URL=https://jaydus-ai-dashboard.windsurf.build`

## Supabase Configuration
- Site URL must be set to production URL in Supabase dashboard
- Current setting: `https://jaydus-ai-dashboard.windsurf.build`

## Prerequisites

Before deploying, make sure you have the following set up:

1. **Supabase Project**:
   - Set up Authentication with Email/Password
   - Configure proper redirect URLs
   - Set up Firestore database
   - Set up proper security rules for Firestore

2. **OpenAI API Key**:
   - Get an API key from [OpenAI](https://platform.openai.com/api-keys)

3. **Stripe Account**:
   - Create a Stripe account at [stripe.com](https://stripe.com)
   - Create products and pricing plans
   - Get your API keys

## Deployment Steps

### 1. Environment Setup

Fill in the `.env` file with your actual credentials:

```
# OpenAI API Configuration
OPENAI_API_KEY=your_actual_openai_key

# Stripe Configuration
VITE_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key

# Backend API Configuration (for Supabase Edge Functions)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 2. Supabase Setup for Backend

1. Create a Supabase project at [supabase.com](https://supabase.com)

2. Deploy the Edge Functions:
   - Install the Supabase CLI: `npm install -g supabase`
   - Login to Supabase: `supabase login`
   - Link your project: `supabase link --project-ref your-project-ref`
   - Deploy functions: `supabase functions deploy stripe-webhook`
   - Deploy other functions: `supabase functions deploy create-checkout-session create-customer-portal`

3. Set up environment variables in Supabase:
   ```bash
   supabase secrets set STRIPE_SECRET_KEY=your_stripe_secret_key
   supabase secrets set STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret
   supabase secrets set SUPABASE_URL=https://your-project.supabase.co
   supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
   ```

### 3. Stripe Configuration

1. Create products and pricing plans in Stripe Dashboard:
   - Create products for Pro, Business, and Enterprise plans
   - Update the price IDs in `src/services/stripe.ts`

2. Set up Stripe webhook:
   - Go to Dashboard > Developers > Webhooks
   - Add an endpoint: `https://your-project.supabase.co/functions/v1/stripe-webhook`
   - Select events: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`
   - Get the webhook secret and add it to your Supabase secrets

### 4. Build and Deploy the App

1. Build the app:
   ```bash
   npm run build
   ```

2. Deploy to hosting service (Netlify, Vercel, Firebase Hosting, etc.)
   - For Firebase Hosting:
     ```bash
     firebase deploy --only hosting
     ```

### 5. Post-Deployment Tasks

1. Test the subscription flow
2. Test the authentication system
3. Monitor error logs
4. Set up redirects in your hosting service to handle React Router routes

## Monitoring and Maintenance

1. Set up Firebase Analytics and Crashlytics to monitor usage and errors
2. Monitor Stripe dashboard for successful subscriptions
3. Regularly check OpenAI API usage and costs
4. Set up alerts for critical errors

## Security Considerations

1. Ensure all API keys are kept secret
2. Use environment variables for sensitive information
3. Set up proper Firestore security rules
4. Implement rate limiting to prevent abuse
5. Consider adding reCAPTCHA for form submissions