import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';
import { toast } from 'sonner';
import supabase from '../supabase/client';
import { 
  signUp, 
  signIn, 
  logOut, 
  resetPassword, 
  updateUserProfile, 
  getUserData, 
  getCurrentUser, 
  onAuthStateChange 
} from '../services/supabaseAuthService';
import { 
  getApiKeys, 
  createApiKey, 
  deleteApiKey 
} from '../services/supabaseApiKeyService';
import { 
  getIntegrations, 
  connectIntegration, 
  disconnectIntegration 
} from '../services/supabaseIntegrationService';

// Check if in local development
const isLocalDevelopment = () => import.meta.env.DEV === true;

// Skip authentication in local development if needed
const skipAuthInDevelopment = () => isLocalDevelopment() && true; // Set to 'true' to bypass auth in development

interface UserData {
  id: string;
  email: string;
  display_name: string | null;
  photo_url: string | null;
  role: string;
  subscription?: string;
  subscription_status?: string;
  stripe_customer_id?: string;
  stripe_subscription_id?: string;
  created_at?: string;
  last_login?: string;
}

export interface ApiKey {
  id: string;
  name: string;
  key: string;
  created_at: string;
  last_used?: string;
}

export interface Integration {
  id: string;
  name: string;
  status: 'connected' | 'disconnected';
  connected_at?: string;
  config?: Record<string, any>;
}

interface AuthContextType {
  currentUser: User | null;
  userData: UserData | null;
  loading: boolean;
  signup: (email: string, password: string, name: string) => Promise<User>;
  login: (email: string, password: string) => Promise<User>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateUserProfile: (data: { displayName?: string; photoURL?: string }) => Promise<void>;
  upgradeSubscription: (plan: string) => Promise<void>;
  getApiKeys: () => Promise<ApiKey[]>;
  createApiKey: (name: string) => Promise<ApiKey>;
  deleteApiKey: (id: string) => Promise<void>;
  getIntegrations: () => Promise<Integration[]>;
  connectIntegration: (name: string, config: any) => Promise<Integration>;
  disconnectIntegration: (id: string) => Promise<void>;
  exportUserData: (format: 'json' | 'csv') => Promise<Blob>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  
  async function signup(email: string, password: string, name: string) {
    if (skipAuthInDevelopment()) {
      console.log('🔍 Development mode: Bypassing authentication for signup');
      toast.success('Development mode: Signup simulated');
      return {} as User;
    }
    
    try {
      const user = await signUp(email, password, name);
      toast.success('Signup successful');
      return user;
    } catch (error) {
      console.error("Error in signup:", error);
      if (error instanceof Error) {
        toast.error(`Signup error: ${error.message}`);
      } else {
        toast.error('An unknown error occurred during signup');
      }
      throw error;
    }
  }

  async function login(email: string, password: string) {
    if (skipAuthInDevelopment()) {
      console.log('🔍 Development mode: Bypassing authentication for login');
      toast.success('Development mode: Login simulated');
      return {} as User;
    }
    
    try {
      const user = await signIn(email, password);
      toast.success('Login successful');
      return user;
    } catch (error) {
      console.error("Error in login:", error);
      if (error instanceof Error) {
        toast.error(`Login error: ${error.message}`);
      } else {
        toast.error('An unknown error occurred during login');
      }
      throw error;
    }
  }

  async function logout() {
    if (skipAuthInDevelopment()) {
      console.log('🔍 Development mode: Bypassing authentication for logout');
      toast.success('Development mode: Logout simulated');
      return;
    }
    
    try {
      await logOut();
      toast.success('Logged out successfully');
    } catch (error) {
      console.error("Error in logout:", error);
      if (error instanceof Error) {
        toast.error(`Logout error: ${error.message}`);
      } else {
        toast.error('An unknown error occurred during logout');
      }
      throw error;
    }
  }

  async function resetPassword(email: string) {
    if (skipAuthInDevelopment()) {
      console.log('🔍 Development mode: Bypassing authentication for reset password');
      toast.success('Development mode: Password reset email simulated');
      return;
    }
    
    try {
      await resetPassword(email);
      toast.success('Password reset email sent');
    } catch (error) {
      console.error("Error in reset password:", error);
      if (error instanceof Error) {
        toast.error(`Reset password error: ${error.message}`);
      } else {
        toast.error('An unknown error occurred during password reset');
      }
      throw error;
    }
  }

  async function updateUserProfile(data: { displayName?: string; photoURL?: string }) {
    if (skipAuthInDevelopment()) {
      console.log('🔍 Development mode: Bypassing profile update');
      // Update local state only in development mode
      if (data.displayName) {
        setUserData(prev => prev ? {...prev, display_name: data.displayName} : null);
      }
      if (data.photoURL) {
        setUserData(prev => prev ? {...prev, photo_url: data.photoURL} : null);
      }
      toast.success('Development mode: Profile update simulated');
      return;
    }
    
    if (!currentUser) throw new Error('No user is signed in');
    
    try {
      // Convert from React naming to Supabase naming
      const supabaseData = {
        displayName: data.displayName,
        photoURL: data.photoURL,
      };
      
      await updateUserProfile(currentUser, supabaseData);
      
      // Update local state
      setUserData(prev => prev ? {
        ...prev, 
        display_name: data.displayName || prev.display_name,
        photo_url: data.photoURL || prev.photo_url
      } : null);
      
      toast.success('Profile updated successfully');
    } catch (error) {
      console.error("Error updating profile:", error);
      if (error instanceof Error) {
        toast.error(`Profile update error: ${error.message}`);
      } else {
        toast.error('An unknown error occurred while updating profile');
      }
      throw error;
    }
  }
  
  async function upgradeSubscription(plan: string) {
    if (skipAuthInDevelopment()) {
      console.log('🔍 Development mode: Bypassing subscription upgrade');
      setUserData(prev => prev ? {...prev, subscription: plan} : null);
      toast.success(`Development mode: Upgrade to ${plan} plan simulated`);
      return;
    }
    
    if (!currentUser) throw new Error('No user is signed in');
    
    try {
      // Update subscription in Supabase using direct API call
      try {
        await fetch(`${import.meta.env.VITE_SUPABASE_URL}/rest/v1/users?id=eq.${currentUser.id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            'apikey': `${import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            'Prefer': 'return=minimal'
          },
          body: JSON.stringify({ 
            subscription: plan,
            updated_at: new Date().toISOString()
          })
        });
      } catch (error) {
        console.error("Error updating subscription in database:", error);
        throw error;
      }
      
      // Update local state
      setUserData(prev => prev ? {...prev, subscription: plan} : null);
      toast.success(`Upgraded to ${plan} plan`);
    } catch (error) {
      console.error("Error upgrading subscription:", error);
      if (error instanceof Error) {
        toast.error(`Subscription upgrade error: ${error.message}`);
      } else {
        toast.error('An unknown error occurred while upgrading subscription');
      }
      throw error;
    }
  }
  
  async function getApiKeys(): Promise<ApiKey[]> {
    if (skipAuthInDevelopment()) {
      console.log('🔍 Development mode: Using placeholder API keys');
      return [
        {
          id: 'dev-key-1',
          name: 'Development API Key',
          key: 'jay_dev_' + uuidv4().replace(/-/g, ''),
          created_at: new Date().toISOString(),
        }
      ];
    }
    
    if (!currentUser) throw new Error('No user is signed in');
    
    try {
      return await getApiKeys(currentUser.id);
    } catch (error) {
      console.error("Error getting API keys:", error);
      if (error instanceof Error) {
        toast.error(`Error retrieving API keys: ${error.message}`);
      } else {
        toast.error('An unknown error occurred while retrieving API keys');
      }
      throw error;
    }
  }
  
  async function createApiKey(name: string): Promise<ApiKey> {
    if (skipAuthInDevelopment()) {
      console.log('🔍 Development mode: Creating placeholder API key');
      return {
        id: `dev-key-${Date.now()}`,
        name,
        key: 'jay_dev_' + uuidv4().replace(/-/g, ''),
        created_at: new Date().toISOString()
      };
    }
    
    if (!currentUser) throw new Error('No user is signed in');
    
    try {
      const newKey = await createApiKey(currentUser.id, name);
      toast.success('API key created');
      return newKey;
    } catch (error) {
      console.error("Error creating API key:", error);
      if (error instanceof Error) {
        toast.error(`Error creating API key: ${error.message}`);
      } else {
        toast.error('An unknown error occurred while creating API key');
      }
      throw error;
    }
  }
  
  async function deleteApiKey(id: string): Promise<void> {
    if (skipAuthInDevelopment()) {
      console.log('🔍 Development mode: Deleting placeholder API key');
      toast.success('Development mode: API key deletion simulated');
      return;
    }
    
    if (!currentUser) throw new Error('No user is signed in');
    
    try {
      await deleteApiKey(id, currentUser.id);
      toast.success('API key deleted');
    } catch (error) {
      console.error("Error deleting API key:", error);
      if (error instanceof Error) {
        toast.error(`Error deleting API key: ${error.message}`);
      } else {
        toast.error('An unknown error occurred while deleting API key');
      }
      throw error;
    }
  }
  
  async function getIntegrations(): Promise<Integration[]> {
    if (skipAuthInDevelopment()) {
      console.log('🔍 Development mode: Using placeholder integrations');
      return [
        {
          id: 'dev-int-1',
          name: 'Example Integration',
          status: 'disconnected',
        }
      ];
    }
    
    if (!currentUser) throw new Error('No user is signed in');
    
    try {
      return await getIntegrations(currentUser.id);
    } catch (error) {
      console.error("Error getting integrations:", error);
      if (error instanceof Error) {
        toast.error(`Error retrieving integrations: ${error.message}`);
      } else {
        toast.error('An unknown error occurred while retrieving integrations');
      }
      throw error;
    }
  }
  
  async function connectIntegration(name: string, config: any): Promise<Integration> {
    if (skipAuthInDevelopment()) {
      console.log('🔍 Development mode: Connecting placeholder integration');
      return {
        id: `dev-int-${Date.now()}`,
        name,
        status: 'connected',
        connected_at: new Date().toISOString(),
        config
      };
    }
    
    if (!currentUser) throw new Error('No user is signed in');
    
    try {
      const integration = await connectIntegration(currentUser.id, name, config);
      toast.success(`${name} integration connected`);
      return integration;
    } catch (error) {
      console.error("Error connecting integration:", error);
      if (error instanceof Error) {
        toast.error(`Error connecting integration: ${error.message}`);
      } else {
        toast.error('An unknown error occurred while connecting integration');
      }
      throw error;
    }
  }
  
  async function disconnectIntegration(id: string): Promise<void> {
    if (skipAuthInDevelopment()) {
      console.log('🔍 Development mode: Disconnecting placeholder integration');
      toast.success('Development mode: Integration disconnection simulated');
      return;
    }
    
    if (!currentUser) throw new Error('No user is signed in');
    
    try {
      await disconnectIntegration(id, currentUser.id);
      toast.success('Integration disconnected');
    } catch (error) {
      console.error("Error disconnecting integration:", error);
      if (error instanceof Error) {
        toast.error(`Error disconnecting integration: ${error.message}`);
      } else {
        toast.error('An unknown error occurred while disconnecting integration');
      }
      throw error;
    }
  }
  
  async function exportUserData(format: 'json' | 'csv'): Promise<Blob> {
    if (skipAuthInDevelopment()) {
      console.log('🔍 Development mode: Exporting placeholder user data');
      
      // Create minimal placeholder data for export
      const placeholderData = {
        user: {
          id: 'placeholder-id',
          email: 'dev@example.com',
          display_name: 'Development User',
          subscription: 'free'
        }
      };
      
      if (format === 'json') {
        toast.success('Development mode: Data export simulated (JSON)');
        return new Blob([JSON.stringify(placeholderData, null, 2)], {type: 'application/json'});
      } else if (format === 'csv') {
        const csvData = `"id","email","display_name","subscription"\n"placeholder-id","dev@example.com","Development User","free"`;
        toast.success('Development mode: Data export simulated (CSV)');
        return new Blob([csvData], {type: 'text/csv'});
      }
      
      throw new Error(`Unsupported format: ${format}`);
    }
    
    if (!currentUser) throw new Error('No user is signed in');
    
    try {
      // Use service role key to bypass RLS
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/rest/v1/users?id=eq.${currentUser.id}&select=*`, {
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'apikey': `${import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to get user data: ${await response.text()}`);
      }
      
      const data = await response.json();
      
      if (!data || data.length === 0) {
        throw new Error('User data not found');
      }
      
      // Get API keys
      const keysResponse = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/rest/v1/api_keys?user_id=eq.${currentUser.id}&select=id,name,created_at,last_used`, {
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'apikey': `${import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY}`
        }
      });
      
      if (!keysResponse.ok) {
        throw new Error(`Failed to get API keys: ${await keysResponse.text()}`);
      }
      
      const apiKeys = await keysResponse.json();
      
      // Get integrations
      const integrationsResponse = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/rest/v1/integrations?user_id=eq.${currentUser.id}&select=*`, {
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'apikey': `${import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY}`
        }
      });
      
      if (!integrationsResponse.ok) {
        throw new Error(`Failed to get integrations: ${await integrationsResponse.text()}`);
      }
      
      const integrations = await integrationsResponse.json();
      
      // Compile all data
      const dataToExport = {
        user: data[0],
        apiKeys,
        integrations
      };
      
      if (format === 'json') {
        toast.success('Data exported as JSON');
        return new Blob([JSON.stringify(dataToExport, null, 2)], {type: 'application/json'});
      } else if (format === 'csv') {
        // Basic CSV conversion - in production you'd want to use a proper CSV library
        const user = dataToExport.user;
        const csvData = `"id","email","display_name","role","subscription","created_at"\n"${user.id}","${user.email}","${user.display_name || ''}","${user.role || ''}","${user.subscription || ''}","${user.created_at || ''}"`;
        toast.success('Data exported as CSV');
        return new Blob([csvData], {type: 'text/csv'});
      }
      
      throw new Error(`Unsupported format: ${format}`);
    } catch (error) {
      console.error("Error exporting user data:", error);
      if (error instanceof Error) {
        toast.error(`Error exporting data: ${error.message}`);
      } else {
        toast.error('An unknown error occurred while exporting data');
      }
      throw error;
    }
  }

  useEffect(() => {
    if (skipAuthInDevelopment()) {
      console.log('🔍 Development mode: Bypassing authentication checks');
      setLoading(false);
      return () => {};
    }
    
    // Subscribe to auth state changes
    const { data: { subscription } } = onAuthStateChange(async (user) => {
      setCurrentUser(user);
      
      if (user) {
        // Get additional user data from Supabase
        try {
          const userData = await getUserData(user.id);
          if (userData) {
            setUserData(userData);
          }
          
          // Update last login using direct API call
          try {
            await fetch(`${import.meta.env.VITE_SUPABASE_URL}/rest/v1/users?id=eq.${user.id}`, {
              method: 'PATCH',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY}`,
                'apikey': `${import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY}`,
                'Prefer': 'return=minimal'
              },
              body: JSON.stringify({
                last_login: new Date().toISOString()
              })
            });
          } catch (updateError) {
            console.error("Error updating last login:", updateError);
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
        }
      } else {
        setUserData(null);
      }
      
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const value = {
    currentUser,
    userData,
    loading,
    signup,
    login,
    logout,
    resetPassword,
    updateUserProfile,
    upgradeSubscription,
    getApiKeys,
    createApiKey,
    deleteApiKey,
    getIntegrations,
    connectIntegration,
    disconnectIntegration,
    exportUserData
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}