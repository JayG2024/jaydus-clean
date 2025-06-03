import { User, Session } from '@supabase/supabase-js';
import supabase from '../supabase/client';

// Sign up with email and password
export const signUp = async (email: string, password: string, displayName: string): Promise<User> => {
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          display_name: displayName,
        },
      },
    });

    if (error) throw error;
    if (!data.user) throw new Error('No user returned from sign up');

    try {
      // Create user profile directly with API call
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/rest/v1/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY}`,
          'apikey': `${import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY}`,
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify({
          id: data.user.id,
          email: data.user.email || '',
          display_name: displayName,
          role: 'user',
          subscription: 'free',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          last_login: new Date().toISOString(),
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Error creating user profile:', errorData);
      }
    } catch (profileError) {
      console.error('Error creating user profile:', profileError);
    }

    return data.user;
  } catch (error) {
    console.error('Error in signup:', error);
    throw error;
  }
};

// Sign in with email and password
export const signIn = async (email: string, password: string): Promise<User> => {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;
    if (!data.user) throw new Error('No user returned from sign in');

    // Update last login
    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/rest/v1/users?id=eq.${data.user.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY}`,
          'apikey': `${import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY}`,
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify({
          last_login: new Date().toISOString()
        })
      });
      
      if (!response.ok) {
        console.error('Error updating last login status:', await response.text());
      }
    } catch (updateError) {
      console.error('Error updating last login:', updateError);
    }

    return data.user;
  } catch (error) {
    console.error('Error in signin:', error);
    throw error;
  }
};

// Sign out
export const logOut = async (): Promise<void> => {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  } catch (error) {
    console.error('Error in signout:', error);
    throw error;
  }
};

// Send password reset email
export const resetPassword = async (email: string): Promise<void> => {
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) throw error;
  } catch (error) {
    console.error('Error in reset password:', error);
    throw error;
  }
};

// Update user profile
export const updateUserProfile = async (
  user: User,
  data: { displayName?: string; photoURL?: string }
): Promise<void> => {
  try {
    // Update auth metadata
    const { error: authError } = await supabase.auth.updateUser({
      data: {
        display_name: data.displayName,
        photo_url: data.photoURL,
      },
    });

    if (authError) throw authError;

    // Update profile in users table using service role key
    const updates: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };

    if (data.displayName) updates.display_name = data.displayName;
    if (data.photoURL) updates.photo_url = data.photoURL;

    const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/rest/v1/users?id=eq.${user.id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY}`,
        'apikey': `${import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY}`,
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify(updates)
    });
    
    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`Failed to update profile: ${errorData}`);
    }
  } catch (error) {
    console.error('Error updating profile:', error);
    throw error;
  }
};

// Get user data from the users table
export const getUserData = async (userId: string) => {
  try {
    // Use service role key to bypass RLS
    const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/rest/v1/users?id=eq.${userId}&select=*`, {
      headers: {
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY}`,
        'apikey': `${import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY}`
      }
    });
    
    if (!response.ok) {
      throw new Error(`Failed to get user data: ${await response.text()}`);
    }
    
    const data = await response.json();
    
    if (!data || data.length === 0) {
      // If no user profile exists, try to create one
      const { data: authUser } = await supabase.auth.getUser();
      
      if (authUser.user) {
        // Create new profile with service role
        const createResponse = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/rest/v1/users`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY}`,
            'apikey': `${import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY}`,
            'Prefer': 'return=minimal'
          },
          body: JSON.stringify({
            id: userId,
            email: authUser.user.email || '',
            display_name: authUser.user.user_metadata?.display_name || '',
            role: 'user',
            subscription: 'free',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            last_login: new Date().toISOString(),
          })
        });
        
        if (!createResponse.ok) {
          console.error('Failed to create user profile:', await createResponse.text());
        }
        
        // Return basic profile
        return {
          id: userId,
          email: authUser.user.email || '',
          display_name: authUser.user.user_metadata?.display_name || '',
          photo_url: null,
          role: 'user',
          subscription: 'free',
          created_at: new Date().toISOString(),
          last_login: new Date().toISOString(),
        };
      } 
      
      throw new Error('User not found');
    }
    
    return data[0];
  } catch (error) {
    console.error('Error getting user data:', error);
    throw error;
  }
};

// Get current session
export const getCurrentSession = async (): Promise<Session | null> => {
  try {
    const { data, error } = await supabase.auth.getSession();
    if (error) throw error;
    return data.session;
  } catch (error) {
    console.error('Error getting current session:', error);
    return null;
  }
};

// Get current user
export const getCurrentUser = async (): Promise<User | null> => {
  try {
    const { data, error } = await supabase.auth.getUser();
    if (error) throw error;
    return data.user;
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
};

// Listen to auth state changes
export const onAuthStateChange = (callback: (user: User | null) => void) => {
  return supabase.auth.onAuthStateChange((event, session) => {
    callback(session?.user || null);
  });
};