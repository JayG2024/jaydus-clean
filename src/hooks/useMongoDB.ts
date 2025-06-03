import { useCallback, useState } from 'react';
import { useMongoDBContext } from '../context/MongoDBContext';
import { logError, ErrorSeverity } from '../utils/errorLogger';

type MongoOperation<T> = () => Promise<T>;

interface UseMongoDBReturn<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
  execute: (operation: MongoOperation<T>) => Promise<T | null>;
  clearError: () => void;
}

export function useMongoDB<T = any>(): UseMongoDBReturn<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  const { checkConnection } = useMongoDBContext();

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const execute = useCallback(async <T>(operation: MongoOperation<T>): Promise<T | null> => {
    setLoading(true);
    setError(null);
    
    try {
      // Check connection first
      const isConnected = await checkConnection();
      if (!isConnected) {
        throw new Error('Not connected to MongoDB');
      }
      
      // Execute the operation
      const result = await operation();
      setData(result as any);
      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error occurred');
      
      logError(
        'MongoDB operation failed',
        {
          message: error.message,
          stack: error.stack,
          tags: ['mongodb', 'operation', 'error']
        },
        ErrorSeverity.ERROR
      );
      
      setError(error);
      return null;
    } finally {
      setLoading(false);
    }
  }, [checkConnection]);

  return {
    data,
    loading,
    error,
    execute,
    clearError,
  };
}

export function useMongoDBOperation<T = any>() {
  const { execute, ...rest } = useMongoDB<T>();
  
  const executeOperation = useCallback(async <T>(
    operation: MongoOperation<T>,
    onSuccess?: (data: T) => void,
    onError?: (error: Error) => void
  ) => {
    const result = await execute(operation);
    
    if (result !== null) {
      onSuccess?.(result);
    } else {
      onError?.(new Error('Operation failed'));
    }
    
    return result;
  }, [execute]);
  
  return {
    ...rest,
    execute: executeOperation,
  };
}
