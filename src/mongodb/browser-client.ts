/**
 * This file provides mock implementations for MongoDB in browser environments
 * Use this for development and browser compatibility
 */

// Mock MongoDB functionality for browser
export const DB_NAME = 'jaydus_platform';

// Collections names (same as server)
export const COLLECTIONS = {
  USERS: 'users',
  CHATS: 'chats',
  USAGE: 'usage',
  API_KEYS: 'api_keys',
  INTEGRATIONS: 'integrations',
  SUBSCRIPTIONS: 'subscriptions',
};

// Mock Db interface to match MongoDB's Db
export interface MockDb {
  collection: (name: string) => any;
}

// Provide a mock implementation that uses localStorage or APIs
export function getDb(): MockDb {
  console.warn('Using browser-compatible MongoDB mock. In production, use API endpoints.');
  
  // Return a mock implementation that doesn't actually connect to MongoDB
  return {
    collection: (name: string) => ({
      // Mock methods that would typically be used
      findOne: async () => console.log(`Mock findOne called for ${name}`),
      find: async () => console.log(`Mock find called for ${name}`),
      insertOne: async () => console.log(`Mock insertOne called for ${name}`),
      updateOne: async () => console.log(`Mock updateOne called for ${name}`),
      deleteOne: async () => console.log(`Mock deleteOne called for ${name}`),
    }),
  };
}

// Type definitions (same as server)
export interface User {
  _id?: string;
  clerkId: string;
  email: string;
  displayName?: string;
  photoUrl?: string;
  role: 'user' | 'admin';
  subscription: 'free' | 'basic' | 'pro' | 'enterprise';
  subscriptionStatus: 'active' | 'trialing' | 'past_due' | 'canceled' | 'incomplete';
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  createdAt: Date;
  updatedAt: Date;
  lastLogin?: Date;
}

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
}

export interface Chat {
  _id?: string;
  userId: string;
  title: string;
  messages: ChatMessage[];
  model: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface UsageRecord {
  _id?: string;
  userId: string;
  type: 'text' | 'image' | 'video' | 'audio';
  model: string;
  tokensInput?: number;
  tokensOutput?: number;
  cost: number;
  timestamp: Date;
  metadata?: Record<string, any>;
}

export interface ApiKey {
  _id?: string;
  userId: string;
  name: string;
  key: string;
  hashedKey: string;
  lastUsed?: Date;
  createdAt: Date;
  expiresAt?: Date;
  isActive: boolean;
}
