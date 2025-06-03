// Utility for API endpoints
const API_BASE_URL = process.env.NODE_ENV === 'development' 
  ? 'http://localhost:5001/jaydus-platform/us-central1/api'
  : 'https://us-central1-jaydus-platform.cloudfunctions.net/api';

// Mock mode flag - aligned with other services
const MOCK_ENABLED = false;

// Stripe API endpoints
export const STRIPE_API = {
  createCheckoutSession: `${API_BASE_URL}/create-checkout-session`,
  createCustomerPortal: `${API_BASE_URL}/create-customer-portal-session`,
};

// Generic API request function
export const apiRequest = async (
  url: string, 
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET', 
  data?: any,
  headers?: Record<string, string>
) => {
  // Handle mock mode
  if (MOCK_ENABLED) {
    console.log(`Mock API request: ${method} ${url}`, data);
    
    // Mock responses based on the endpoint
    if (url.includes('create-checkout-session')) {
      return {
        sessionId: `mock_session_${Date.now()}`,
        url: 'https://mock-stripe-checkout.example.com'
      };
    } else if (url.includes('create-customer-portal')) {
      return {
        url: 'https://mock-stripe-portal.example.com'
      };
    }
    
    // Generic mock response
    return { success: true, data: 'mock_data', mockMode: false };
  }

  try {
    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
      ...(data ? { body: JSON.stringify(data) } : {}),
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      throw new Error(
        errorData?.error || `Request failed with status ${response.status}`
      );
    }
    
    return response.json();
  } catch (error) {
    console.error('API request error:', error);
    throw error;
  }
};