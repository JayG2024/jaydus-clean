import { logError, ErrorSeverity, AppError } from './errorLogger';

/**
 * Environment variable validation utility
 * 
 * This utility provides functions to validate environment variables
 * and handle missing or invalid values gracefully.
 */

// Define environment variable types
type EnvVarType = 'string' | 'number' | 'boolean' | 'url' | 'email' | 'json';

interface EnvVarDefinition {
  name: string;
  type: EnvVarType;
  required: boolean;
  default?: any;
  validator?: (value: any) => boolean;
  mockValue?: any; // Value to use in mock mode
}

// Check if mock mode is enabled
const isMockMode = () => import.meta.env.VITE_ENABLE_MOCK_MODE === 'true';

// Check if we're in development mode
const isDevelopment = () => import.meta.env.DEV === true;

/**
 * Get an environment variable with validation and error handling
 */
export function getEnvVar<T>(definition: EnvVarDefinition): T {
  const { name, type, required, default: defaultValue, validator, mockValue } = definition;
  
  // If in mock mode and a mock value is provided, use that
  if (isMockMode() && mockValue !== undefined) {
    return mockValue as T;
  }
  
  // Get the raw value from environment
  const rawValue = (import.meta.env as any)[name];
  
  // If value is missing but not required, return default
  if ((rawValue === undefined || rawValue === null || rawValue === '') && !required) {
    return defaultValue as T;
  }
  
  // If value is missing and required, handle the error
  if ((rawValue === undefined || rawValue === null || rawValue === '') && required) {
    // In development, we can use a default or mock value
    if (isDevelopment()) {
      if (mockValue !== undefined) {
        console.warn(`Missing required environment variable ${name}, using mock value in development`);
        return mockValue as T;
      }
      if (defaultValue !== undefined) {
        console.warn(`Missing required environment variable ${name}, using default value in development`);
        return defaultValue as T;
      }
    }
    
    // In production, log a critical error
    const error = new AppError(
      `Missing required environment variable: ${name}`,
      'ENV_VAR_MISSING',
      ErrorSeverity.CRITICAL,
      { varName: name, required: true },
      false
    );
    
    error.log();
    
    // Return default if available, otherwise throw
    if (defaultValue !== undefined) {
      return defaultValue as T;
    }
    
    throw error;
  }
  
  // Convert the value to the correct type
  let value: any = rawValue;
  
  try {
    switch (type) {
      case 'number':
        value = Number(rawValue);
        if (isNaN(value)) {
          throw new Error(`Environment variable ${name} is not a valid number`);
        }
        break;
      case 'boolean':
        value = rawValue === 'true' || rawValue === '1' || rawValue === 'yes';
        break;
      case 'url':
        try {
          new URL(rawValue);
        } catch (e) {
          throw new Error(`Environment variable ${name} is not a valid URL`);
        }
        break;
      case 'email':
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(rawValue)) {
          throw new Error(`Environment variable ${name} is not a valid email`);
        }
        break;
      case 'json':
        try {
          value = JSON.parse(rawValue);
        } catch (e) {
          throw new Error(`Environment variable ${name} is not valid JSON`);
        }
        break;
    }
  } catch (error) {
    // Log the error
    logError(
      error as Error,
      {
        message: `Invalid environment variable: ${name}`,
        context: { varName: name, type, rawValue: typeof rawValue === 'string' ? rawValue.substring(0, 10) + '...' : typeof rawValue },
        tags: ['config', 'env-vars']
      },
      ErrorSeverity.CRITICAL
    );
    
    // In development, use default or mock value if available
    if (isDevelopment()) {
      if (mockValue !== undefined) {
        console.warn(`Invalid environment variable ${name}, using mock value in development`);
        return mockValue as T;
      }
      if (defaultValue !== undefined) {
        console.warn(`Invalid environment variable ${name}, using default value in development`);
        return defaultValue as T;
      }
    }
    
    // In production, return default if available, otherwise throw
    if (defaultValue !== undefined) {
      return defaultValue as T;
    }
    
    throw error;
  }
  
  // Run custom validator if provided
  if (validator && !validator(value)) {
    const error = new Error(`Environment variable ${name} failed validation`);
    
    // Log the error
    logError(
      error,
      {
        message: `Environment variable validation failed: ${name}`,
        context: { varName: name, type },
        tags: ['config', 'env-vars', 'validation']
      },
      ErrorSeverity.CRITICAL
    );
    
    // In development, use default or mock value if available
    if (isDevelopment()) {
      if (mockValue !== undefined) {
        return mockValue as T;
      }
      if (defaultValue !== undefined) {
        return defaultValue as T;
      }
    }
    
    // In production, return default if available, otherwise throw
    if (defaultValue !== undefined) {
      return defaultValue as T;
    }
    
    throw error;
  }
  
  return value as T;
}

/**
 * Validate all required environment variables at once
 */
export function validateRequiredEnvVars(definitions: EnvVarDefinition[]): boolean {
  const missingVars: string[] = [];
  const invalidVars: string[] = [];
  
  // Check each variable
  for (const def of definitions) {
    try {
      getEnvVar(def);
    } catch (error) {
      if (error instanceof AppError && error.code === 'ENV_VAR_MISSING') {
        missingVars.push(def.name);
      } else {
        invalidVars.push(def.name);
      }
    }
  }
  
  // If we're in mock mode, we can continue even with missing vars
  if (isMockMode() && (missingVars.length > 0 || invalidVars.length > 0)) {
    console.warn(`Running in mock mode with missing or invalid environment variables: ${[...missingVars, ...invalidVars].join(', ')}`);
    return true;
  }
  
  // In development, warn but continue
  if (isDevelopment() && (missingVars.length > 0 || invalidVars.length > 0)) {
    console.warn(`Development mode: Missing or invalid environment variables: ${[...missingVars, ...invalidVars].join(', ')}`);
    return true;
  }
  
  // In production, log a critical error if any vars are missing or invalid
  if (missingVars.length > 0 || invalidVars.length > 0) {
    logError(
      new Error(`Missing or invalid environment variables: ${[...missingVars, ...invalidVars].join(', ')}`),
      {
        message: 'Application started with missing or invalid environment variables',
        context: { missingVars, invalidVars },
        tags: ['config', 'env-vars', 'startup']
      },
      ErrorSeverity.CRITICAL
    );
    return false;
  }
  
  return true;
}

/**
 * Define and validate Stripe-related environment variables
 */
export function getStripeEnvVars() {
  return {
    publishableKey: getEnvVar<string>({
      name: 'VITE_STRIPE_PUBLISHABLE_KEY',
      type: 'string',
      required: true,
      mockValue: 'pk_test_mock_key_for_development',
      validator: (value) => value.startsWith('pk_')
    }),
    mockMode: isMockMode()
  };
}

/**
 * Define and validate all application environment variables
 */
export function validateAppEnvVars(): boolean {
  const definitions: EnvVarDefinition[] = [
    // Clerk authentication
    {
      name: 'VITE_CLERK_PUBLISHABLE_KEY',
      type: 'string',
      required: true,
      mockValue: 'pk_clerk_mock_key_for_development'
    },
    
    // Stripe
    {
      name: 'VITE_STRIPE_PUBLISHABLE_KEY',
      type: 'string',
      required: !isMockMode(), // Only required if not in mock mode
      mockValue: 'pk_test_mock_key_for_development',
      validator: (value) => value.startsWith('pk_')
    },
    
    // Application URL
    {
      name: 'VITE_APP_URL',
      type: 'url',
      required: true,
      default: 'http://localhost:3000',
      mockValue: 'https://lucky-jaydus.netlify.app'
    },
    
    // Mock mode flag
    {
      name: 'VITE_ENABLE_MOCK_MODE',
      type: 'boolean',
      required: false,
      default: false
    }
  ];
  
  return validateRequiredEnvVars(definitions);
}

export default {
  getEnvVar,
  validateRequiredEnvVars,
  getStripeEnvVars,
  validateAppEnvVars,
  isMockMode,
  isDevelopment
};