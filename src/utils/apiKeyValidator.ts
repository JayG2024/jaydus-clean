/**
 * API Key Validation and Health Check Utilities
 * 
 * This module provides utilities to validate API keys and check service health
 * to prevent error loops caused by invalid credentials.
 */

import { logError, ErrorSeverity, AppError } from './errorLogger';

export interface ApiKeyValidationResult {
  isValid: boolean;
  service: string;
  error?: string;
  shouldFallbackToMock: boolean;
}

export interface ServiceHealthStatus {
  openai: ApiKeyValidationResult;
  stripe: ApiKeyValidationResult;
  clerk: ApiKeyValidationResult;
  overall: 'healthy' | 'degraded' | 'unavailable';
}

/**
 * Validate OpenAI API key format and test with a lightweight request
 */
export async function validateOpenAIKey(apiKey: string): Promise<ApiKeyValidationResult> {
  const result: ApiKeyValidationResult = {
    isValid: false,
    service: 'openai',
    shouldFallbackToMock: false
  };

  // Basic format validation
  if (!apiKey || !apiKey.startsWith('sk-')) {
    result.error = 'Invalid API key format';
    result.shouldFallbackToMock = true;
    return result;
  }

  // Length validation (OpenAI keys are typically 51 characters)
  if (apiKey.length < 40) {
    result.error = 'API key appears to be truncated';
    result.shouldFallbackToMock = true;
    return result;
  }

  try {
    // Test the key with a minimal request
    const response = await fetch('https://api.openai.com/v1/models', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      signal: AbortSignal.timeout(5000) // 5 second timeout
    });

    if (response.ok) {
      result.isValid = true;
      return result;
    } else if (response.status === 401) {
      result.error = 'API key is invalid or expired';
      result.shouldFallbackToMock = true;
    } else if (response.status === 429) {
      result.error = 'Rate limit exceeded';
      result.isValid = true; // Key is valid but rate limited
    } else {
      result.error = `API returned status ${response.status}`;
      result.shouldFallbackToMock = true;
    }
  } catch (error) {
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        result.error = 'Request timeout - service may be unavailable';
      } else {
        result.error = error.message;
      }
    } else {
      result.error = 'Unknown error occurred';
    }
    result.shouldFallbackToMock = true;
  }

  return result;
}

/**
 * Validate Stripe publishable key format
 */
export function validateStripeKey(publishableKey: string): ApiKeyValidationResult {
  const result: ApiKeyValidationResult = {
    isValid: false,
    service: 'stripe',
    shouldFallbackToMock: false
  };

  if (!publishableKey || !publishableKey.startsWith('pk_')) {
    result.error = 'Invalid Stripe publishable key format';
    result.shouldFallbackToMock = true;
    return result;
  }

  // Check if it's a test or live key
  const isTestKey = publishableKey.startsWith('pk_test_');
  const isLiveKey = publishableKey.startsWith('pk_live_');

  if (!isTestKey && !isLiveKey) {
    result.error = 'Stripe key must be either test or live key';
    result.shouldFallbackToMock = true;
    return result;
  }

  result.isValid = true;
  return result;
}

/**
 * Validate Clerk publishable key format
 */
export function validateClerkKey(publishableKey: string): ApiKeyValidationResult {
  const result: ApiKeyValidationResult = {
    isValid: false,
    service: 'clerk',
    shouldFallbackToMock: false
  };

  if (!publishableKey || !publishableKey.startsWith('pk_')) {
    result.error = 'Invalid Clerk publishable key format';
    result.shouldFallbackToMock = true;
    return result;
  }

  // Basic length check (Clerk keys are typically longer)
  if (publishableKey.length < 20) {
    result.error = 'Clerk key appears to be truncated';
    result.shouldFallbackToMock = true;
    return result;
  }

  result.isValid = true;
  return result;
}

/**
 * Check OpenAI key validity via API endpoint
 */
async function checkOpenAIKeyViaAPI(): Promise<ServiceValidationResult> {
  try {
    const response = await fetch('/api/openai-key-check');
    if (response.ok) {
      const data = await response.json();
      return {
        isValid: data.valid || false,
        service: 'openai',
        error: data.error
      };
    }
    return {
      isValid: false,
      service: 'openai',
      error: 'Failed to validate OpenAI key'
    };
  } catch (error) {
    return {
      isValid: false,
      service: 'openai',
      error: 'Unable to check OpenAI key status'
    };
  }
}

/**
 * Check overall service health and determine if mock mode should be enabled
 */
export async function checkServiceHealth(): Promise<ServiceHealthStatus> {
  // OpenAI key validation should be done server-side only
  // For client-side, we'll check via API endpoint
  const stripeKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY as string;
  const clerkKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY as string;

  // Validate services (OpenAI validation moved to server-side)
  const [openaiResult, stripeResult, clerkResult] = await Promise.allSettled([
    checkOpenAIKeyViaAPI(), // Check via API endpoint instead
    Promise.resolve(validateStripeKey(stripeKey)),
    Promise.resolve(validateClerkKey(clerkKey))
  ]);

  const status: ServiceHealthStatus = {
    openai: openaiResult.status === 'fulfilled' ? openaiResult.value : {
      isValid: false,
      service: 'openai',
      error: 'Validation failed',
      shouldFallbackToMock: true
    },
    stripe: stripeResult.status === 'fulfilled' ? stripeResult.value : {
      isValid: false,
      service: 'stripe',
      error: 'Validation failed',
      shouldFallbackToMock: true
    },
    clerk: clerkResult.status === 'fulfilled' ? clerkResult.value : {
      isValid: false,
      service: 'clerk',
      error: 'Validation failed',
      shouldFallbackToMock: true
    },
    overall: 'unavailable'
  };

  // Determine overall health
  const validServices = [status.openai, status.stripe, status.clerk].filter(s => s.isValid).length;
  
  if (validServices === 3) {
    status.overall = 'healthy';
  } else if (validServices >= 1) {
    status.overall = 'degraded';
  } else {
    status.overall = 'unavailable';
  }

  // Log service status
  logError(
    new AppError(
      `Service health check completed: ${status.overall}`,
      'SERVICE_HEALTH_CHECK',
      status.overall === 'healthy' ? ErrorSeverity.INFO : ErrorSeverity.WARNING,
      {
        openaiValid: status.openai.isValid,
        stripeValid: status.stripe.isValid,
        clerkValid: status.clerk.isValid,
        overall: status.overall
      },
      false
    ),
    {
      message: 'Service health status determined',
      context: {
        validServices,
        totalServices: 3,
        shouldUseMockMode: status.overall === 'unavailable'
      },
      tags: ['health-check', 'startup']
    },
    status.overall === 'healthy' ? ErrorSeverity.INFO : ErrorSeverity.WARNING
  );

  return status;
}

/**
 * Auto-enable mock mode if all services are unavailable
 */
export function shouldAutoEnableMockMode(healthStatus: ServiceHealthStatus): boolean {
  const hasAnyInvalidService = [healthStatus.openai, healthStatus.stripe, healthStatus.clerk]
    .some(service => service.shouldFallbackToMock);
  
  return healthStatus.overall === 'unavailable' || hasAnyInvalidService;
}

/**
 * Get user-friendly error messages for service issues
 */
export function getServiceErrorMessage(healthStatus: ServiceHealthStatus): string {
  const issues: string[] = [];

  if (!healthStatus.openai.isValid) {
    issues.push(`OpenAI: ${healthStatus.openai.error}`);
  }
  if (!healthStatus.stripe.isValid) {
    issues.push(`Stripe: ${healthStatus.stripe.error}`);
  }
  if (!healthStatus.clerk.isValid) {
    issues.push(`Clerk: ${healthStatus.clerk.error}`);
  }

  if (issues.length === 0) {
    return 'All services are healthy';
  }

  return `Service issues detected: ${issues.join(', ')}`;
}

export default {
  validateOpenAIKey,
  validateStripeKey,
  validateClerkKey,
  checkServiceHealth,
  shouldAutoEnableMockMode,
  getServiceErrorMessage
};