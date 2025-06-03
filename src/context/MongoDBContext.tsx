import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { isDevelopment, isMockModeEnabled } from '../utils/envHelper';
import { isBrowser } from '../utils/runtime';

// Enhanced context with more functionality
interface MongoDBContextType {
  isReady: boolean;
  isError: boolean;
  errorMessage?: string;
  apiBaseUrl: string;
  isMockMode: boolean;
  checkConnection: () => Promise<boolean>;
  resetError: () => void;
}

// Default context values
const defaultContext: MongoDBContextType = {
  isReady: false,
  isError: false,
  apiBaseUrl: '/api',
  isMockMode: false,
  checkConnection: async () => false,
  resetError: () => {}
};

const MongoDBContext = createContext<MongoDBContextType>(defaultContext);

export const useMongoDBContext = () => useContext(MongoDBContext);

// Enhanced provider that properly handles browser environments
export const MongoDBProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const mockMode = isMockModeEnabled();
  
  const [state, setState] = useState<MongoDBContextType>({
    ...defaultContext,
    // Use different API base URL for development vs production
    apiBaseUrl: isDevelopment() ? `http://localhost:${import.meta.env.VITE_API_PORT || '3000'}/api` : '/api',
    isMockMode: mockMode,
    // If in mock mode, we're always ready
    isReady: mockMode
  });

  const checkConnection = useCallback(async () => {
    // If in mock mode, always return true
    if (mockMode) {
      setState(prev => ({
        ...prev,
        isReady: true,
        isError: false,
        errorMessage: undefined
      }));
      return true;
    }
    
    // If not in browser, assume ready
    if (!isBrowser) {
      setState(prev => ({
        ...prev,
        isReady: true,
        isError: false,
        errorMessage: undefined
      }));
      return true;
    }

    try {
      console.log(`Checking MongoDB connection at ${state.apiBaseUrl}/health`);
      const response = await fetch(`${state.apiBaseUrl}/health`);
      const isHealthy = response.ok;
      
      if (isHealthy) {
        console.log('MongoDB connection is healthy');
      } else {
        console.warn('MongoDB connection check failed');
      }
      
      setState(prev => ({
        ...prev,
        isReady: isHealthy,
        isError: !isHealthy,
        errorMessage: isHealthy ? undefined : 'Failed to connect to MongoDB API'
      }));
      
      return isHealthy;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('MongoDB connection error:', errorMessage);
      
      setState(prev => ({
        ...prev,
        isReady: false,
        isError: true,
        errorMessage: `Connection error: ${errorMessage}`
      }));
      return false;
    }
  }, [state.apiBaseUrl, mockMode]);

  const resetError = useCallback(() => {
    setState(prev => ({
      ...prev,
      isError: false,
      errorMessage: undefined
    }));
  }, []);

  // Initialize connection check
  useEffect(() => {
    const init = async () => {
      if (mockMode) {
        console.log('🔄 Running in mock mode, skipping MongoDB connection check');
        setState(prev => ({
          ...prev,
          isReady: true,
          isError: false,
          errorMessage: undefined
        }));
      } else {
        await checkConnection();
      }
    };
    
    init();
  }, [checkConnection, mockMode]);

  const contextValue = {
    ...state,
    checkConnection,
    resetError
  };

  return (
    <MongoDBContext.Provider value={contextValue}>
      {children}
    </MongoDBContext.Provider>
  );
};

export default MongoDBContext;