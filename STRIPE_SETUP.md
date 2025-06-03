# Stripe Integration Setup Guide

This guide will help you set up Stripe integration for the Lucky application.

## Prerequisites

- A Stripe account (you can create one at [stripe.com](https://stripe.com))
- Netlify CLI installed (`npm install -g netlify-cli`)
- Netlify account with deployment access to the Lucky application

## Setting Up Stripe Variables in Netlify

### Option 1: Using the Setup Script (Recommended)

We've created a script to help you set up all the required environment variables in Netlify:

1. Make sure you're logged in to Netlify CLI:
   ```bash
   netlify login
   ```

2. Run the setup script:
   ```bash
   ./scripts/setup-netlify-env.sh
   ```

3. Follow the prompts to enter your Stripe API keys and other required information.

4. The script will automatically set up all required environment variables in your Netlify project.

### Option 2: Manual Setup

If you prefer to set up the variables manually:

1. Go to your Netlify dashboard: https://app.netlify.com/
2. Select your site (Lucky)
3. Go to Site settings > Environment variables
4. Add the following environment variables:

   | Variable Name | Description | Is Secret |
   |---------------|-------------|-----------|
   | `VITE_STRIPE_PUBLISHABLE_KEY` | Your Stripe publishable key (starts with `pk_`) | No |
   | `STRIPE_SECRET_KEY` | Your Stripe secret key (starts with `sk_`) | Yes |
   | `STRIPE_WEBHOOK_SECRET` | Your Stripe webhook secret (starts with `whsec_`) | Yes |
   | `VITE_ENABLE_MOCK_MODE` | Set to `false` to use real Stripe integration | No |
   | `VITE_APP_URL` | Set to `https://lucky-jaydus.netlify.app` | No |

5. Save the changes and trigger a new deployment.

## Getting Your Stripe API Keys

1. Log in to your Stripe Dashboard: https://dashboard.stripe.com/
2. Go to Developers > API keys
3. You'll find your publishable key and secret key there
4. For the webhook secret, you'll need to create a webhook endpoint:
   - Go to Developers > Webhooks
   - Add an endpoint with the URL: `https://lucky-jaydus.netlify.app/.netlify/functions/stripe-webhook`
   - Select the events you want to listen for (at minimum: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`)
   - After creating the webhook, you'll see the signing secret

## Testing the Integration

After setting up the environment variables:

1. Deploy your application to Netlify
2. Visit the live site: https://lucky-jaydus.netlify.app/
3. Navigate to the upgrade page and try to make a test purchase
4. Use Stripe test card numbers for testing:
   - Success: `4242 4242 4242 4242`
   - Decline: `4000 0000 0000 0002`

## Troubleshooting

If you encounter issues with the Stripe integration:

1. Check the browser console for error messages
2. Verify that all environment variables are correctly set in Netlify
3. Make sure you're using the correct API keys for your environment (test or live)
4. Check the Netlify function logs for any backend errors

## Mock Mode

If you set `VITE_ENABLE_MOCK_MODE` to `true`, the application will use mock implementations for Stripe and other services. This is useful for development and testing without making real API calls.

In mock mode:
- No real payments will be processed
- Checkout and customer portal sessions will use mock URLs
- All subscription management features will use simulated data

## Additional Resources

- [Stripe API Documentation](https://stripe.com/docs/api)
- [Netlify Environment Variables](https://docs.netlify.com/configure-builds/environment-variables/)
- [Netlify Functions Documentation](https://docs.netlify.com/functions/overview/)