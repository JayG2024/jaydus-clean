/**
 * IMPORTANT: This file is for server-side use only (Netlify Functions, Edge Functions, etc.)
 * It should not be imported directly in browser code.
 * 
 * For client-side code, use the API endpoints that interact with MongoDB.
 */

// This file serves as a reference for MongoDB collection structure and naming
// The actual MongoDB connection will be handled in Netlify Functions

import { Db } from 'mongodb';

// Database and collections
export const DB_NAME = 'jaydus_platform';

// Collections
export const COLLECTIONS = {
  USERS: 'users',
  CHATS: 'chats',
  USAGE: 'usage',
  API_KEYS: 'api_keys',
  INTEGRATIONS: 'integrations',
  SUBSCRIPTIONS: 'subscriptions',
};

// This is a placeholder function for client-side code
// The actual implementation is in netlify/functions/utils/mongodb.cjs
export function getDb(): Db {
  throw new Error('getDb() should not be called directly in browser code. Use API endpoints instead.');
}

// User collection schema
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

// Chat collection schema
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

// Usage collection schema
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

// API Key collection schema
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