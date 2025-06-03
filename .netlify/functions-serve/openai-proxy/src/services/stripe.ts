import { loadStripe } from '@stripe/stripe-js';
import { STRIPE_API, apiRequest } from './api';

// Mock mode flag - aligned with other services
const MOCK_ENABLED = true;

// Initialize Stripe with your publishable key
let stripePromise: Promise<any> | null = null;

export const getStripe = () => {
  if (MOCK_ENABLED) {
    console.log('Using mock Stripe service');
    return Promise.resolve({
      redirectToCheckout: async ({ sessionId }: { sessionId: string }) => {
        console.log(`Mock Stripe: redirecting to checkout with session ID ${sessionId}`);
        return { error: null };
      }
    });
  }

  if (!stripePromise) {
    const publishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
    stripePromise = loadStripe(publishableKey);
  }
  return stripePromise;
};

export const createCheckoutSession = async (
  priceId: string, 
  customerId?: string, 
  metadata?: Record<string, string>
) => {
  if (MOCK_ENABLED) {
    console.log('Using mock Stripe service - createCheckoutSession operation');
    // Simulate API response
    return {
      sessionId: `mock_session_${Date.now()}`,
      url: 'https://mock-stripe-checkout.example.com'
    };
  }

  try {
    // Call our API function to create a Stripe Checkout session
    return await apiRequest(
      STRIPE_API.createCheckoutSession,
      'POST',
      {
        priceId,
        customerId,
        successUrl: window.location.origin + '/dashboard?checkout=success',
        cancelUrl: window.location.origin + '/upgrade?checkout=canceled',
        userId: metadata?.userId,
      }
    );
  } catch (error) {
    console.error('Error creating checkout session:', error);
    throw error;
  }
};

export const createCustomerPortalSession = async (customerId: string) => {
  if (MOCK_ENABLED) {
    console.log('Using mock Stripe service - createCustomerPortalSession operation');
    // Simulate API response
    return {
      url: 'https://mock-stripe-portal.example.com'
    };
  }

  try {
    // Call our API function to create a Stripe Customer Portal session
    return await apiRequest(
      STRIPE_API.createCustomerPortal,
      'POST',
      {
        customerId,
        returnUrl: window.location.origin + '/settings',
      }
    );
  } catch (error) {
    console.error('Error creating customer portal session:', error);
    throw error;
  }
};

// Define available pricing plans
export const pricingPlans = [
  {
    id: 'price_monthly_basic',
    name: 'Pro',
    description: 'For individuals and small teams',
    price: 19,
    interval: 'month',
    currency: 'USD',
    features: [
      '50,000 AI credits per month',
      '10 GB storage',
      'Access to all premium AI models',
      'Priority support',
      'Unlimited team members'
    ],
    priceId: 'price_real_monthly_basic',
  },
  {
    id: 'price_monthly_premium',
    name: 'Business',
    description: 'For larger teams with advanced needs',
    price: 49,
    interval: 'month',
    currency: 'USD',
    features: [
      '150,000 AI credits per month',
      '50 GB storage',
      'Access to all premium AI models',
      'Priority support',
      'Unlimited team members',
      'Advanced analytics',
      'Custom integrations'
    ],
    priceId: 'price_real_monthly_premium',
    popular: true,
  },
  {
    id: 'price_monthly_enterprise',
    name: 'Enterprise',
    description: 'For organizations with specific requirements',
    price: 99,
    interval: 'month',
    currency: 'USD',
    features: [
      '500,000 AI credits per month',
      '200 GB storage',
      'Access to all premium AI models',
      'Priority support',
      'Unlimited team members',
      'Advanced analytics',
      'Custom integrations',
      'Dedicated account manager',
      'Custom API limits'
    ],
    priceId: 'price_real_monthly_enterprise',
  }
];