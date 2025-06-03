export interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  interval: 'month' | 'year';
  features: string[];
  limits: {
    textGenerations: number;
    imageGenerations: number;
    videoGenerations: number;
    textTokens: number;
  };
}

export const subscriptionPlans: SubscriptionPlan[] = [
  {
    id: 'free',
    name: 'Free',
    price: 0,
    interval: 'month',
    features: [
      'Access to 1 text model',
      'Limited generations',
      'Community support'
    ],
    limits: {
      textGenerations: 25,
      imageGenerations: 0,
      videoGenerations: 0,
      textTokens: 25000
    }
  },
  {
    id: 'basic',
    name: 'Basic',
    price: 9.99,
    interval: 'month',
    features: [
      'Access to 3 text models',
      'Access to 2 image models',
      'Basic support'
    ],
    limits: {
      textGenerations: 100,
      imageGenerations: 20,
      videoGenerations: 0,
      textTokens: 100000
    }
  },
  {
    id: 'pro',
    name: 'Professional',
    price: 29.99,
    interval: 'month',
    features: [
      'Access to all text models',
      'Access to all image models',
      'Access to 2 video models',
      'Priority support'
    ],
    limits: {
      textGenerations: 500,
      imageGenerations: 100,
      videoGenerations: 10,
      textTokens: 500000
    }
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 99.99,
    interval: 'month',
    features: [
      'Access to all models',
      'Unlimited generations',
      'Dedicated support',
      'Custom model fine-tuning'
    ],
    limits: {
      textGenerations: -1, // unlimited
      imageGenerations: -1, // unlimited
      videoGenerations: -1, // unlimited
      textTokens: -1 // unlimited
    }
  }
];

// Create checkout session
export async function createCheckoutSession(priceId: string, successUrl: string, cancelUrl: string) {
  const response = await fetch('/.netlify/functions/create-checkout', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      priceId,
      successUrl,
      cancelUrl
    }),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to create checkout session');
  }
  
  const { url } = await response.json();
  return url;
}

// Get user subscription
export async function getUserSubscription(userId: string) {
  // This would normally fetch from your database
  // For now, we'll return a mock subscription
  return {
    id: 'sub_123456',
    status: 'active',
    plan: 'pro',
    currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    usage: {
      textGenerations: 42,
      imageGenerations: 15,
      videoGenerations: 3,
      textTokens: 75000
    }
  };
}

// Track usage
export async function trackUsage(modelType: string, tokens?: number) {
  // This would normally update usage in your database
  console.log(`Tracking usage: ${modelType} ${tokens ? `(${tokens} tokens)` : ''}`);
  return true;
}