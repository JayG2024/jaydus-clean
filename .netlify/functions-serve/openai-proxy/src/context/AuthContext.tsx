import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  User, 
  onAuthStateChanged
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, collection, addDoc, query, where, getDocs, deleteDoc } from 'firebase/firestore';
import { auth, db } from '../firebase/config';
import { v4 as uuidv4 } from 'uuid';
import { signUp, signIn, logOut, resetPassword, updateUserProfile, getUserData } from '../services/authService';
import { toast } from 'sonner';

// Create a mock user for development
const MOCK_USER_ENABLED = true; // Set to false for production

const mockUser: User = {
  uid: 'mock-user-123',
  email: 'developer@example.com',
  emailVerified: true,
  displayName: 'Developer User',
  isAnonymous: false,
  photoURL: null,
  providerData: [],
  stsTokenManager: { refreshToken: '', accessToken: '', expirationTime: 0 },
  delete: async () => Promise.resolve(),
  getIdToken: async () => 'mock-token',
  getIdTokenResult: async () => ({
    token: 'mock-token',
    signInProvider: 'password',
    expirationTime: new Date(Date.now() + 3600 * 1000).toISOString(),
    issuedAtTime: new Date().toISOString(),
    claims: {},
  }),
  reload: async () => Promise.resolve(),
  toJSON: () => ({}),
  tenantId: null,
  phoneNumber: null,
  providerId: 'password',
  metadata: { creationTime: Date.now().toString(), lastSignInTime: Date.now().toString() },
};

const mockUserData = {
  uid: mockUser.uid,
  email: mockUser.email,
  displayName: mockUser.displayName,
  photoURL: mockUser.photoURL,
  role: 'admin',
  teams: ['team-1'],
  subscription: 'free',
  createdAt: new Date().toISOString(),
  lastLogin: new Date().toISOString(),
};

interface UserData {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  role: string;
  teams: string[];
  subscription?: string;
  subscriptionStatus?: string;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  createdAt?: string;
  lastLogin?: string;
}

export interface ApiKey {
  id: string;
  name: string;
  key: string;
  createdAt: string;
  lastUsed?: string;
}

export interface Integration {
  id: string;
  name: string;
  status: 'connected' | 'disconnected';
  connectedAt?: string;
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
  const [currentUser, setCurrentUser] = useState<User | null>(MOCK_USER_ENABLED ? mockUser : null);
  const [userData, setUserData] = useState<UserData | null>(MOCK_USER_ENABLED ? mockUserData : null);
  const [loading, setLoading] = useState(!MOCK_USER_ENABLED);
  
  // Mock API keys for development
  const mockApiKeys: ApiKey[] = [
    {
      id: 'key-1',
      name: 'Development API Key',
      key: 'jay_dev_' + uuidv4().replace(/-/g, ''),
      createdAt: new Date().toISOString(),
    },
    {
      id: 'key-2',
      name: 'Production API Key',
      key: 'jay_prod_' + uuidv4().replace(/-/g, ''),
      createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      lastUsed: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    }
  ];
  
  // Mock integrations for development
  const mockIntegrations: Integration[] = [
    {
      id: 'int-1',
      name: 'Slack',
      status: 'connected',
      connectedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'int-2',
      name: 'Google Drive',
      status: 'disconnected',
    },
    {
      id: 'int-3',
      name: 'GitHub',
      status: 'disconnected',
    }
  ];

  async function signup(email: string, password: string, name: string) {
    if (MOCK_USER_ENABLED) {
      console.log('Using mock user - signup operation simulated');
      toast.success('Mock signup successful');
      return mockUser;
    }
    
    try {
      const user = await signUp(email, password, name);
      return user;
    } catch (error) {
      console.error("Error in signup:", error);
      throw error;
    }
  }

  async function login(email: string, password: string) {
    if (MOCK_USER_ENABLED) {
      console.log('Using mock user - login operation simulated');
      toast.success('Mock login successful');
      return mockUser;
    }
    
    try {
      const user = await signIn(email, password);
      return user;
    } catch (error) {
      console.error("Error in login:", error);
      throw error;
    }
  }

  async function logout() {
    if (MOCK_USER_ENABLED) {
      console.log('Using mock user - logout operation simulated');
      toast.success('Mock logout successful');
      return;
    }
    
    try {
      await logOut();
    } catch (error) {
      console.error("Error in logout:", error);
      throw error;
    }
  }

  async function resetPassword(email: string) {
    if (MOCK_USER_ENABLED) {
      console.log('Using mock user - reset password operation simulated');
      toast.success('Mock password reset email sent');
      return;
    }
    
    try {
      await resetPassword(email);
    } catch (error) {
      console.error("Error in reset password:", error);
      throw error;
    }
  }

  async function updateUserProfile(data: { displayName?: string; photoURL?: string }) {
    if (MOCK_USER_ENABLED) {
      console.log('Using mock user - profile update operation simulated');
      // Update mock user data
      if (data.displayName) {
        mockUser.displayName = data.displayName;
        setUserData(prev => prev ? {...prev, displayName: data.displayName} : null);
      }
      if (data.photoURL) {
        mockUser.photoURL = data.photoURL;
        setUserData(prev => prev ? {...prev, photoURL: data.photoURL} : null);
      }
      toast.success('Mock profile update successful');
      return;
    }
    
    if (!currentUser) throw new Error('No user is signed in');
    
    try {
      await updateUserProfile(currentUser, data);
      
      // Update local state
      setUserData(prev => prev ? {...prev, ...data} : null);
    } catch (error) {
      console.error("Error updating profile:", error);
      throw error;
    }
  }
  
  async function upgradeSubscription(plan: string) {
    if (MOCK_USER_ENABLED) {
      console.log('Using mock user - subscription upgrade operation simulated');
      setUserData(prev => prev ? {...prev, subscription: plan} : null);
      toast.success(`Mock upgrade to ${plan} plan successful`);
      return;
    }
    
    if (!currentUser) throw new Error('No user is signed in');
    
    try {
      // Update subscription in Firestore
      const userRef = doc(db, 'users', currentUser.uid);
      await updateDoc(userRef, { 
        subscription: plan,
        updatedAt: new Date().toISOString()
      });
      
      // Update local state
      setUserData(prev => prev ? {...prev, subscription: plan} : null);
      toast.success(`Upgraded to ${plan} plan`);
    } catch (error) {
      console.error("Error upgrading subscription:", error);
      throw error;
    }
  }
  
  async function getApiKeys(): Promise<ApiKey[]> {
    if (MOCK_USER_ENABLED) {
      console.log('Using mock user - getApiKeys operation simulated');
      return Promise.resolve([...mockApiKeys]);
    }
    
    if (!currentUser) throw new Error('No user is signed in');
    
    try {
      const keysQuery = query(collection(db, 'apiKeys'), where('userId', '==', currentUser.uid));
      const snapshot = await getDocs(keysQuery);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as ApiKey));
    } catch (error) {
      console.error("Error getting API keys:", error);
      throw error;
    }
  }
  
  async function createApiKey(name: string): Promise<ApiKey> {
    if (MOCK_USER_ENABLED) {
      console.log('Using mock user - createApiKey operation simulated');
      const newKey: ApiKey = {
        id: `key-${Date.now()}`,
        name,
        key: 'jay_' + uuidv4().replace(/-/g, ''),
        createdAt: new Date().toISOString()
      };
      mockApiKeys.push(newKey);
      toast.success('Mock API key created');
      return Promise.resolve(newKey);
    }
    
    if (!currentUser) throw new Error('No user is signed in');
    
    try {
      const keyData = {
        userId: currentUser.uid,
        name,
        key: 'jay_' + uuidv4().replace(/-/g, ''),
        createdAt: new Date().toISOString()
      };
      
      const docRef = await addDoc(collection(db, 'apiKeys'), keyData);
      toast.success('API key created');
      return {
        id: docRef.id,
        ...keyData
      };
    } catch (error) {
      console.error("Error creating API key:", error);
      throw error;
    }
  }
  
  async function deleteApiKey(id: string): Promise<void> {
    if (MOCK_USER_ENABLED) {
      console.log('Using mock user - deleteApiKey operation simulated');
      const index = mockApiKeys.findIndex(key => key.id === id);
      if (index !== -1) {
        mockApiKeys.splice(index, 1);
      }
      toast.success('Mock API key deleted');
      return Promise.resolve();
    }
    
    if (!currentUser) throw new Error('No user is signed in');
    
    try {
      await deleteDoc(doc(db, 'apiKeys', id));
      toast.success('API key deleted');
    } catch (error) {
      console.error("Error deleting API key:", error);
      throw error;
    }
  }
  
  async function getIntegrations(): Promise<Integration[]> {
    if (MOCK_USER_ENABLED) {
      console.log('Using mock user - getIntegrations operation simulated');
      return Promise.resolve([...mockIntegrations]);
    }
    
    if (!currentUser) throw new Error('No user is signed in');
    
    try {
      const integrationsQuery = query(collection(db, 'integrations'), where('userId', '==', currentUser.uid));
      const snapshot = await getDocs(integrationsQuery);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Integration));
    } catch (error) {
      console.error("Error getting integrations:", error);
      throw error;
    }
  }
  
  async function connectIntegration(name: string, config: any): Promise<Integration> {
    if (MOCK_USER_ENABLED) {
      console.log('Using mock user - connectIntegration operation simulated');
      
      // Update existing integration if it exists
      const existingIndex = mockIntegrations.findIndex(int => int.name === name);
      if (existingIndex !== -1) {
        mockIntegrations[existingIndex] = {
          ...mockIntegrations[existingIndex],
          status: 'connected',
          connectedAt: new Date().toISOString(),
          config
        };
        toast.success(`Mock ${name} integration connected`);
        return Promise.resolve(mockIntegrations[existingIndex]);
      }
      
      // Otherwise create a new one
      const newIntegration: Integration = {
        id: `int-${Date.now()}`,
        name,
        status: 'connected',
        connectedAt: new Date().toISOString(),
        config
      };
      mockIntegrations.push(newIntegration);
      toast.success(`Mock ${name} integration connected`);
      return Promise.resolve(newIntegration);
    }
    
    if (!currentUser) throw new Error('No user is signed in');
    
    try {
      // Check if integration already exists
      const integrationsQuery = query(
        collection(db, 'integrations'), 
        where('userId', '==', currentUser.uid),
        where('name', '==', name)
      );
      const snapshot = await getDocs(integrationsQuery);
      
      if (!snapshot.empty) {
        // Update existing integration
        const integrationDoc = snapshot.docs[0];
        const updateData = {
          status: 'connected',
          connectedAt: new Date().toISOString(),
          config
        };
        await updateDoc(doc(db, 'integrations', integrationDoc.id), updateData);
        
        toast.success(`${name} integration connected`);
        return {
          id: integrationDoc.id,
          ...integrationDoc.data(),
          ...updateData
        } as Integration;
      }
      
      // Create new integration
      const integrationData = {
        userId: currentUser.uid,
        name,
        status: 'connected' as const,
        connectedAt: new Date().toISOString(),
        config
      };
      
      const docRef = await addDoc(collection(db, 'integrations'), integrationData);
      toast.success(`${name} integration connected`);
      return {
        id: docRef.id,
        ...integrationData
      };
    } catch (error) {
      console.error("Error connecting integration:", error);
      throw error;
    }
  }
  
  async function disconnectIntegration(id: string): Promise<void> {
    if (MOCK_USER_ENABLED) {
      console.log('Using mock user - disconnectIntegration operation simulated');
      const index = mockIntegrations.findIndex(int => int.id === id);
      if (index !== -1) {
        mockIntegrations[index] = {
          ...mockIntegrations[index],
          status: 'disconnected',
          connectedAt: undefined
        };
      }
      toast.success('Mock integration disconnected');
      return Promise.resolve();
    }
    
    if (!currentUser) throw new Error('No user is signed in');
    
    try {
      await updateDoc(doc(db, 'integrations', id), {
        status: 'disconnected',
        connectedAt: null
      });
      toast.success('Integration disconnected');
    } catch (error) {
      console.error("Error disconnecting integration:", error);
      throw error;
    }
  }
  
  async function exportUserData(format: 'json' | 'csv'): Promise<Blob> {
    if (MOCK_USER_ENABLED) {
      console.log('Using mock user - exportUserData operation simulated');
      
      // Create mock data to export
      const mockDataToExport = {
        user: {
          ...mockUserData,
          // Remove any sensitive data
          uid: mockUser.uid,
        },
        apiKeys: mockApiKeys.map(key => ({
          id: key.id,
          name: key.name,
          createdAt: key.createdAt,
          lastUsed: key.lastUsed
          // Don't include the actual key
        })),
        integrations: mockIntegrations,
        activity: [
          {
            id: 'act-1',
            type: 'login',
            timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
          },
          {
            id: 'act-2',
            type: 'image_generation',
            timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
          }
        ]
      };
      
      if (format === 'json') {
        toast.success('Mock data exported as JSON');
        return Promise.resolve(new Blob([JSON.stringify(mockDataToExport, null, 2)], {type: 'application/json'}));
      } else if (format === 'csv') {
        // Simple CSV conversion (in a real app you'd use a proper CSV library)
        const user = mockDataToExport.user;
        const csvData = `"uid","email","displayName","role","subscription","createdAt"\n"${user.uid}","${user.email}","${user.displayName}","${user.role}","${user.subscription}","${user.createdAt}"`;
        toast.success('Mock data exported as CSV');
        return Promise.resolve(new Blob([csvData], {type: 'text/csv'}));
      }
      
      throw new Error(`Unsupported format: ${format}`);
    }
    
    if (!currentUser) throw new Error('No user is signed in');
    
    try {
      // Get user data
      const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
      if (!userDoc.exists()) throw new Error('User data not found');
      
      const userData = userDoc.data();
      
      // Get API keys
      const keysQuery = query(collection(db, 'apiKeys'), where('userId', '==', currentUser.uid));
      const keysSnapshot = await getDocs(keysQuery);
      const apiKeys = keysSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        // Exclude the actual key for security
        key: undefined
      }));
      
      // Get integrations
      const integrationsQuery = query(collection(db, 'integrations'), where('userId', '==', currentUser.uid));
      const integrationsSnapshot = await getDocs(integrationsQuery);
      const integrations = integrationsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // Compile all data
      const dataToExport = {
        user: userData,
        apiKeys,
        integrations
      };
      
      if (format === 'json') {
        toast.success('Data exported as JSON');
        return new Blob([JSON.stringify(dataToExport, null, 2)], {type: 'application/json'});
      } else if (format === 'csv') {
        // Basic CSV conversion - in production you'd want to use a proper CSV library
        const user = dataToExport.user;
        const csvData = `"uid","email","displayName","role","subscription","createdAt"\n"${user.uid}","${user.email}","${user.displayName}","${user.role}","${user.subscription}","${user.createdAt}"`;
        toast.success('Data exported as CSV');
        return new Blob([csvData], {type: 'text/csv'});
      }
      
      throw new Error(`Unsupported format: ${format}`);
    } catch (error) {
      console.error("Error exporting user data:", error);
      throw error;
    }
  }

  useEffect(() => {
    if (MOCK_USER_ENABLED) {
      // No need to subscribe to auth state changes when using mock user
      setLoading(false);
      return () => {};
    }
    
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      
      if (user) {
        // Get additional user data from Firestore
        try {
          const userData = await getUserData(user.uid);
          if (userData) {
            setUserData(userData as UserData);
          }
          
          // Update last login
          await updateDoc(doc(db, 'users', user.uid), {
            lastLogin: new Date().toISOString()
          });
        } catch (error) {
          console.error("Error fetching user data:", error);
        }
      } else {
        setUserData(null);
      }
      
      setLoading(false);
    });

    return unsubscribe;
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