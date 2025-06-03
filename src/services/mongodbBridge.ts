/**
 * This file serves as a bridge between server-side MongoDB and client-side code
 * It automatically selects the right implementation based on the environment
 */

// Import both implementations
import * as serverMongo from '../mongodb/client';
import * as browserMongo from '../mongodb/browser-client';

// Determine if we're in a browser environment
const isBrowser = typeof window !== 'undefined';

// Export the appropriate implementation
export const DB_NAME = isBrowser ? browserMongo.DB_NAME : serverMongo.DB_NAME;
export const COLLECTIONS = isBrowser ? browserMongo.COLLECTIONS : serverMongo.COLLECTIONS;
export const getDb = isBrowser ? browserMongo.getDb : serverMongo.getDb;

// Re-export the types
export type User = serverMongo.User;
export type Chat = serverMongo.Chat;
export type ChatMessage = serverMongo.ChatMessage;
export type UsageRecord = serverMongo.UsageRecord;
export type ApiKey = serverMongo.ApiKey;

// Add safe wrappers for common MongoDB operations
export async function safeMongoOp<T>(operation: () => Promise<T>, fallback: T): Promise<T> {
  try {
    // In production, this would call the API endpoint
    if (isBrowser) {
      console.warn('MongoDB operation attempted in browser. Use API endpoints in production.');
      return fallback;
    }
    return await operation();
  } catch (error) {
    console.error('MongoDB operation failed:', error);
    return fallback;
  }
}
