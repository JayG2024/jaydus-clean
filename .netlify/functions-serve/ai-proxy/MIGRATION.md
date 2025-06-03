# Firebase to Supabase Migration Guide

This document outlines the step-by-step process for migrating the Jaydus Platform from Firebase to Supabase.

## Overview

### Current Firebase Features Used
- **Firebase Authentication** - User management and login
- **Firestore** - Database for users, chats, API keys, integrations, usage tracking
- **Firebase Functions** - Backend processing for Stripe integration and usage tracking
- **Firebase Storage** - File storage

### Supabase Equivalents
- **Supabase Auth** - Replaces Firebase Authentication
- **Supabase Database** - Replaces Firestore with PostgreSQL
- **Supabase Edge Functions** - Replaces Firebase Functions
- **Supabase Storage** - Replaces Firebase Storage

## Migration Steps

### 1. Set Up Supabase Project

1. Create a new Supabase project at [supabase.com](https://supabase.com)
2. Configure authentication settings:
   - Enable Email/Password sign-in
   - Disable email confirmation (to match current setup)
   - Set up password recovery

### 2. Database Schema Migration

1. Create the initial schema using the SQL migration in `supabase/migrations/create_initial_schema.sql`
2. This creates the following tables:
   - `users` - User profiles and subscription information
   - `usage` - Track user resource usage
   - `chats` - Store chat conversations
   - `api_keys` - API keys for external access
   - `integrations` - Third-party service connections
3. All tables have Row Level Security (RLS) policies configured

### 3. Data Migration

1. Export data from Firebase:
   ```javascript
   const admin = require('firebase-admin');
   const fs = require('fs');
   
   admin.initializeApp();
   const db = admin.firestore();
   
   async function exportCollection(collectionName) {
     const snapshot = await db.collection(collectionName).get();
     const data = snapshot.docs.map(doc => ({
       id: doc.id,
       ...doc.data()
     }));
     fs.writeFileSync(`${collectionName}.json`, JSON.stringify(data, null, 2));
     console.log(`Exported ${data.length} documents from ${collectionName}`);
   }
   
   // Export all collections
   async function exportAll() {
     await exportCollection('users');
     await exportCollection('chats');
     await exportCollection('apiKeys');
     await exportCollection('integrations');
     await exportCollection('usage');
   }
   
   exportAll().then(() => console.log('Export complete'));
   ```

2. Transform data for Supabase format:
   ```javascript
   const fs = require('fs');
   
   // Load exported data
   const users = JSON.parse(fs.readFileSync('users.json'));
   
   // Transform for Supabase format
   const transformedUsers = users.map(user => ({
     id: user.uid,
     email: user.email,
     display_name: user.displayName,
     photo_url: user.photoURL,
     role: user.role || 'user',
     subscription: user.subscription || 'free',
     subscription_status: user.subscriptionStatus || 'active',
     stripe_customer_id: user.stripeCustomerId,
     stripe_subscription_id: user.stripeSubscriptionId,
     created_at: user.createdAt,
     updated_at: user.updatedAt || user.createdAt,
     last_login: user.lastLogin || user.createdAt
   }));
   
   fs.writeFileSync('supabase_users.json', JSON.stringify(transformedUsers, null, 2));
   ```

3. Import data to Supabase:
   - Use the Supabase dashboard or API to import the transformed data
   - For large datasets, use the pgAdmin connection to run COPY commands

### 4. Authentication Migration

1. Create users in Supabase Auth:
   - For each user in Firebase, create a corresponding user in Supabase Auth
   - This can be done using the Supabase Admin API or dashboard
   - Note: Users will need to reset their passwords as Firebase passwords cannot be migrated

2. Update the frontend to use Supabase Auth:
   - Replace `src/context/AuthContext.tsx` with `src/context/SupabaseAuthContext.tsx`
   - Update auth-related imports in all components

### 5. Edge Functions Migration

1. Create Supabase Edge Functions for Stripe integration:
   - `create-checkout-session` - Creates a Stripe checkout session
   - `create-customer-portal` - Creates a Stripe customer portal session
   - `stripe-webhook` - Handles Stripe webhook events

2. Update environment variables:
   - Set up the following in Supabase:
     ```
     STRIPE_SECRET_KEY=your_stripe_secret_key
     STRIPE_WEBHOOK_SECRET=your_webhook_secret
     ```

3. Deploy the Edge Functions:
   ```bash
   supabase functions deploy create-checkout-session
   supabase functions deploy create-customer-portal
   supabase functions deploy stripe-webhook
   ```

4. Update Stripe webhook URL in the Stripe dashboard to point to your new Supabase Edge Function

### 6. Frontend Code Updates

1. Install Supabase client:
   ```bash
   npm install @supabase/supabase-js
   ```

2. Create Supabase client configuration:
   ```typescript
   // src/supabase/client.ts
   import { createClient } from '@supabase/supabase-js';
   
   const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
   const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
   
   export const supabase = createClient(supabaseUrl, supabaseAnonKey);
   ```

3. Update service files to use Supabase:
   - Replace Firebase auth methods with Supabase equivalents
   - Update database queries to use Supabase's PostgreSQL syntax
   - Update storage operations to use Supabase Storage

4. Update environment variables in `.env` file:
   ```
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

### 7. Testing

1. Test authentication flows:
   - Sign up
   - Sign in
   - Password reset
   - Profile updates

2. Test database operations:
   - CRUD operations on all tables
   - Verify RLS policies are working correctly

3. Test Stripe integration:
   - Create checkout sessions
   - Process webhooks
   - Manage subscriptions

4. Test storage operations:
   - File uploads
   - File downloads
   - Access control

### 8. Deployment

1. Update deployment configuration:
   - Remove Firebase-specific configuration
   - Add Supabase configuration

2. Deploy to production:
   ```bash
   npm run build
   # Deploy to your hosting provider (Netlify, Vercel, etc.)
   ```

3. Monitor for any issues:
   - Check Supabase logs
   - Monitor error tracking
   - Watch for authentication issues

## Potential Challenges and Solutions

### 1. Authentication Transition

**Challenge**: Users will need to reset their passwords as Firebase passwords cannot be migrated.

**Solution**: Implement a password reset flow for all users:
- Send an email to all users explaining the migration
- Provide a link to reset their password
- Consider a grace period where both systems work in parallel

### 2. Real-time Updates

**Challenge**: Supabase's real-time capabilities work differently than Firebase.

**Solution**: Update real-time subscriptions to use Supabase's Realtime API:
```typescript
const subscription = supabase
  .from('chats')
  .on('*', (payload) => {
    // Handle real-time updates
  })
  .subscribe();
```

### 3. Query Differences

**Challenge**: Firestore and PostgreSQL have different query capabilities.

**Solution**: Refactor complex queries to use PostgreSQL syntax:
- Replace nested document queries with proper joins
- Update array operations to use PostgreSQL array functions
- Use PostgreSQL's full-text search instead of Firestore's simple queries

### 4. Security Rules vs. RLS

**Challenge**: Firestore security rules and Supabase RLS work differently.

**Solution**: Carefully test all RLS policies to ensure they provide the same security guarantees:
- Create comprehensive tests for each policy
- Verify that users can only access their own data
- Ensure admin operations are properly secured

## Rollback Plan

In case of critical issues during migration:

1. Keep the Firebase project active during the transition
2. Maintain a backup of all Firebase data
3. Be prepared to switch back to Firebase endpoints if necessary
4. Consider a phased rollout to minimize risk

## Post-Migration Tasks

1. Monitor performance and adjust as needed
2. Optimize database queries and indexes
3. Set up proper backup procedures for Supabase
4. Update documentation to reflect the new architecture
5. Train team members on Supabase-specific features and tools