/**
 * Environment variable validation utility
 * 
 * This utility helps ensure all required environment variables are present
 * and properly formatted before the application runs.
 */

interface EnvVariables {
  VITE_SUPABASE_URL: string;
  VITE_SUPABASE_ANON_KEY: string;
  VITE_SUPABASE_SERVICE_ROLE_KEY: string;
  VITE_STRIPE_PUBLISHABLE_KEY: string;
  VITE_ENABLE_MOCK_MODE: string;
}

export function getEnvVariables(): EnvVariables {
  const variables = {
    VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
    VITE_SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY,
    VITE_SUPABASE_SERVICE_ROLE_KEY: import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY,
    // VITE_OPENAI_API_KEY is server-only, removed from client-side env
    VITE_STRIPE_PUBLISHABLE_KEY: import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY,
    VITE_ENABLE_MOCK_MODE: import.meta.env.VITE_ENABLE_MOCK_MODE,
  };

  // Add warning message for development if using placeholder/missing keys
  if (import.meta.env.DEV) {
    const missingVars: string[] = [];

    Object.entries(variables).forEach(([key, value]) => {
      if (!value || value.includes('your_') || value.includes('placeholder')) {
        missingVars.push(key);
      }
    });

    if (missingVars.length > 0) {
      console.warn(
        `⚠️ Missing or placeholder environment variables: ${missingVars.join(', ')}\n` +
        `For local development, the app will run with development mode enabled.`
      );
    }
  }

  return variables;
}

export function validateEnvironment(): boolean {
  // In development, we allow missing variables
  if (import.meta.env.DEV) {
    return true;
  }

  // In production, we require all variables to be present
  const variables = getEnvVariables();
  const missingVars: string[] = [];

  Object.entries(variables).forEach(([key, value]) => {
    // Skip non-essential checks
    if (key === 'VITE_ENABLE_MOCK_MODE') return;
    
    if (!value || value.includes('your_') || value.includes('placeholder')) {
      missingVars.push(key);
    }
  });

  if (missingVars.length > 0) {
    console.error(
      `❌ Missing required environment variables: ${missingVars.join(', ')}\n` +
      `Please set these variables in your deployment environment.`
    );
    return false;
  }

  return true;
}

// Helper to check if we're in local development
export function isLocalDevelopment(): boolean {
  return import.meta.env.DEV === true;
}

// Helper to check if we should bypass auth in development
export function skipAuthInDevelopment(): boolean {
  return isLocalDevelopment();
}