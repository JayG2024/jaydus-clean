import React from 'react';
import { useAuth } from '../../context/FirebaseAuthContext';

interface StripeProviderProps {
  children: React.ReactNode;
}

/**
 * Simplified StripeProvider.
 * Full Stripe integration with Firebase will require backend changes and database storage for subscription status.
 */
export const StripeProvider: React.FC<StripeProviderProps> = ({ children }) => {
  const { currentUser } = useAuth();
  
  // For now, this provider is a pass-through. 
  // Actual Stripe.js loading or context providing might be needed later.
  return <>{children}</>;
};

// Hook to get subscription data - TEMPORARY PLACEHOLDER
export const useSubscription = () => {
  const { currentUser, loading: authLoading } = useAuth();
  
  // Placeholder data - full implementation requires fetching from your DB linked to Firebase UID
  const subscription = undefined;
  
  return {
    subscription,
    isSubscribed: false, // Placeholder
    plan: 'free', // Placeholder
    isLoading: authLoading // Reflects auth loading state, data loading would also be included here
  };
};

// Pricing plans configuration
export const pricingPlans = [
  {
    id: 'free',
    name: 'Free',
    description: 'Perfect for getting started',
    price: 0,
    interval: 'month',
    currency: 'USD',
    features: [
      '25 AI generations per month',
      'Basic models access',
      'Community support'
    ],
    limits: {
      textGenerations: 25,
      imageGenerations: 5,
      videoGenerations: 0,
      textTokens: 25000
    }
    // No priceId for free plan
  },
  {
    id: 'pro',
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
    limits: {
      textGenerations: 500,
      imageGenerations: 100,
      videoGenerations: 10,
      textTokens: 500000
    },
    priceId: 'price_your_pro_plan_id' // Example: actual Stripe Price ID
  },
  {
    id: 'business',
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
    limits: {
      textGenerations: 1500,
      imageGenerations: 300,
      videoGenerations: 50,
      textTokens: 1500000
    },
    popular: true,
    priceId: 'price_your_business_plan_id' // Example: actual Stripe Price ID
  },
  {
    id: 'enterprise',
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
    limits: {
      textGenerations: -1, // unlimited
      imageGenerations: -1, // unlimited
      videoGenerations: -1, // unlimited
      textTokens: -1 // unlimited
    },
    priceId: 'price_your_enterprise_plan_id' // Example: actual Stripe Price ID
  }
];

export default StripeProvider;