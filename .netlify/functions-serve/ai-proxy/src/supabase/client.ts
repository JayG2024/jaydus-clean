import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';
import { logError, ErrorSeverity } from '../utils/errorLogger';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Check if the environment variables are valid
if (!supabaseUrl || !supabaseAnonKey) {
  logError(
    'Missing Supabase environment variables',
    {
      message: 'Supabase URL or anon key is missing from environment variables',
      context: {
        mode: import.meta.env.MODE,
        isDevelopment: import.meta.env.DEV
      },
      tags: ['config', 'supabase']
    },
    ErrorSeverity.WARNING
  );
  
  if (import.meta.env.DEV) {
    console.log('Running in development mode, will use fallback values for Supabase');
  } else {
    console.error('Cannot run without proper Supabase configuration!');
  }
}

// Create the Supabase client
export const supabase = createClient<Database>(
  supabaseUrl || 'https://placeholder-url.supabase.co',
  supabaseAnonKey || 'placeholder-key'
);

// Add error handling for client
supabase.auth.onAuthStateChange((event, _session) => {
  if (event === 'SIGNED_OUT') {
    console.log('User signed out');
  } else if (event === 'SIGNED_IN') {
    console.log('User signed in');
  } else if (event === 'TOKEN_REFRESHED') {
    console.log('Token refreshed');
  } else if (event === 'USER_UPDATED') {
    console.log('User updated');
  } else if (event === 'PASSWORD_RECOVERY') {
    console.log('Password recovery initiated');
  }
});

export default supabase;