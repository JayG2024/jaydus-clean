import { loadStripe } from '@stripe/stripe-js';
import supabase from '../supabase/client';
import { logApiError } from '../utils/errorLogger';
import { toast } from 'sonner';

// Initialize Stripe with your publishable key
let stripePromise: Promise<any> | null = null;

export const getStripe = () => {
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
  try {
    // Call Supabase Edge Function to create a Stripe Checkout session
    const { data, error } = await supabase.functions.invoke('create-checkout-session', {
      body: {
        priceId,
        customerId,
        successUrl: window.location.origin + '/upgrade?checkout=success',
        cancelUrl: window.location.origin + '/upgrade?checkout=canceled',
        userId: metadata?.userId,
      }
    });

    if (error) {
      logApiError('create-checkout-session', error, { priceId, customerId, metadata });
      throw error;
    }
    return data;
  } catch (error) {
    logApiError('create-checkout-session', error, { priceId, customerId, metadata });
    // If there's an error with the edge function, we might be in a situation where
    // the user needs to set up their stripe integration properly
    toast.error(
      'Stripe integration not properly configured. Please check your Supabase Edge Function configuration.',
      {
        description: 'Make sure you have set STRIPE_SECRET_KEY in your Supabase project.',
        duration: 5000,
      }
    );
    throw error;
  }
};

export const createCustomerPortalSession = async (
  customerId: string, 
  returnUrl: string = window.location.origin + '/settings'
) => {
  try {
    // Call Supabase Edge Function to create a Stripe Customer Portal session
    const { data, error } = await supabase.functions.invoke('create-customer-portal', {
      body: {
        customerId,
        returnUrl,
      }
    });

    if (error) {
      logApiError('create-customer-portal', error, { customerId, returnUrl });
      throw error;
    }
    return data;
  } catch (error) {
    logApiError('create-customer-portal', error, { customerId, returnUrl });
    
    // If there's an error with the edge function, we might be in a situation where
    // the user needs to set up their stripe integration properly
    toast.error(
      'Stripe integration not properly configured. Please check your Supabase Edge Function configuration.',
      {
        description: 'Make sure you have set STRIPE_SECRET_KEY in your Supabase project.',
        duration: 5000,
      }
    );
    
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

// Function to check if checkout was successful (to be called on page load/redirect)
export const checkStripeRedirect = () => {
  const urlParams = new URLSearchParams(window.location.search);
  const checkoutStatus = urlParams.get('checkout');
  
  if (checkoutStatus === 'success') {
    setTimeout(() => {
      window.history.replaceState(null, '', window.location.pathname);
    }, 1000);
    return {
      success: true,
      message: 'Payment processed successfully. Your subscription is now active.',
    };
  } else if (checkoutStatus === 'canceled') {
    setTimeout(() => {
      window.history.replaceState(null, '', window.location.pathname);
    }, 1000);
    return {
      success: false,
      message: 'Payment was canceled. Your subscription has not changed.',
    };
  }
  return null;
};