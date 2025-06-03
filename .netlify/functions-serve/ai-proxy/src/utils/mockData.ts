import { v4 as uuidv4 } from 'uuid';

// Mock Stripe Customer
export const mockStripeCustomer = {
  id: 'cus_mock123456789',
  object: 'customer',
  created: Math.floor(Date.now() / 1000) - 86400, // 1 day ago
  email: 'developer@example.com',
  name: 'Developer User',
  default_source: null,
  metadata: {
    userId: 'mock-user-123'
  }
};

// Mock Stripe Subscription
export const mockStripeSubscription = {
  id: 'sub_mock123456789',
  object: 'subscription',
  customer: mockStripeCustomer.id,
  current_period_end: Math.floor(Date.now() / 1000) + 2592000, // 30 days from now
  current_period_start: Math.floor(Date.now() / 1000),
  status: 'active',
  items: {
    data: [
      {
        id: 'si_mock123456789',
        price: {
          id: 'price_real_monthly_basic'
        }
      }
    ]
  }
};

// Mock Stripe Checkout Session
export const createMockCheckoutSession = (priceId: string, customerId?: string, metadata?: Record<string, string>) => {
  const sessionId = `cs_mock_${Date.now()}`;
  return {
    sessionId,
    id: sessionId,
    object: 'checkout.session',
    customer: customerId || mockStripeCustomer.id,
    subscription: mockStripeSubscription.id,
    url: `https://mock-checkout.stripe.com/pay/${sessionId}?test=true`,
    metadata: metadata || { userId: 'mock-user-123' }
  };
};

// Mock Stripe Customer Portal Session
export const createMockCustomerPortalSession = (customerId: string, returnUrl: string) => {
  return {
    url: `https://mock-portal.stripe.com/customers/${customerId}?return_url=${encodeURIComponent(returnUrl)}`
  };
};

// Mock webhook events
export const mockWebhookEvents = {
  'checkout.session.completed': {
    id: `evt_mock_checkout_${uuidv4().substring(0, 8)}`,
    object: 'event',
    type: 'checkout.session.completed',
    data: {
      object: createMockCheckoutSession('price_real_monthly_basic')
    }
  },
  'customer.subscription.updated': {
    id: `evt_mock_sub_update_${uuidv4().substring(0, 8)}`,
    object: 'event',
    type: 'customer.subscription.updated',
    data: {
      object: {
        ...mockStripeSubscription,
        status: 'active'
      }
    }
  },
  'customer.subscription.deleted': {
    id: `evt_mock_sub_delete_${uuidv4().substring(0, 8)}`,
    object: 'event',
    type: 'customer.subscription.deleted',
    data: {
      object: {
        ...mockStripeSubscription,
        status: 'canceled',
        canceled_at: Math.floor(Date.now() / 1000)
      }
    }
  },
  'invoice.payment_failed': {
    id: `evt_mock_invoice_fail_${uuidv4().substring(0, 8)}`,
    object: 'event',
    type: 'invoice.payment_failed',
    data: {
      object: {
        id: `in_mock_${uuidv4().substring(0, 8)}`,
        customer: mockStripeCustomer.id,
        status: 'open',
        amount_due: 1900, // $19.00
        currency: 'usd'
      }
    }
  }
};