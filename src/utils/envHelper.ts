/**
 * Environment Helper Utilities
 */

// Check if we're in development mode
export const isDevelopment = () => 
  import.meta.env.DEV === true || 
  window.location.hostname === 'localhost' || 
  window.location.hostname === '127.0.0.1';

// Check if we're in production mode
export const isProduction = () => !isDevelopment();

// Check if mock mode is enabled via environment variable
export const isMockModeEnabled = () => 
  import.meta.env.VITE_ENABLE_MOCK_MODE === 'true';

// Check if we're running in a browser environment
export const isBrowser = () => typeof window !== 'undefined';

// Safely access environment variables with fallbacks
export const getEnvVar = (key: string, fallback: string = ''): string => {
  const envVar = import.meta.env[key];
  return envVar !== undefined ? envVar : fallback;
};
