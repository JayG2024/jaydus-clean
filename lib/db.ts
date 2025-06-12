import { sql } from '@vercel/postgres';
import { drizzle } from 'drizzle-orm/vercel-postgres';
import { pgTable, uuid, text, timestamp, integer, bigint, jsonb, boolean } from 'drizzle-orm/pg-core';

// Database schema definitions
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').notNull().unique(),
  fullName: text('full_name'),
  avatarUrl: text('avatar_url'),
  subscription: text('subscription').notNull().default('free'),
  subscriptionStatus: text('subscription_status').default('active'),
  stripeCustomerId: text('stripe_customer_id'),
  stripeSubscriptionId: text('stripe_subscription_id'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const usage = pgTable('usage', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  aiCreditsUsed: integer('ai_credits_used').default(0),
  chatMessages: integer('chat_messages').default(0),
  imagesGenerated: integer('images_generated').default(0),
  voiceMinutes: integer('voice_minutes').default(0),
  storageUsed: bigint('storage_used', { mode: 'number' }).default(0),
  lastUpdated: timestamp('last_updated').defaultNow(),
});

export const chats = pgTable('chats', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  messages: jsonb('messages').notNull().default([]),
  model: text('model').notNull().default('openai/gpt-3.5-turbo'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
  assistantId: text('assistant_id'),
  assistantName: text('assistant_name'),
});

export const apiKeys = pgTable('api_keys', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  key: text('key').notNull().unique(),
  createdAt: timestamp('created_at').defaultNow(),
  lastUsed: timestamp('last_used'),
});

// Initialize Drizzle with Vercel Postgres
export const db = drizzle(sql);

// Database utility functions
export async function createUser(userData: {
  email: string;
  fullName?: string;
  avatarUrl?: string;
}) {
  try {
    const [user] = await db.insert(users).values(userData).returning();
    
    // Create initial usage record
    await db.insert(usage).values({ userId: user.id });
    
    return user;
  } catch (error) {
    console.error('Error creating user:', error);
    throw error;
  }
}

export async function getUserByEmail(email: string) {
  try {
    const [user] = await db.select().from(users).where(sql`email = ${email}`);
    return user;
  } catch (error) {
    console.error('Error getting user by email:', error);
    throw error;
  }
}

export async function getUserUsage(userId: string) {
  try {
    const [userUsage] = await db.select().from(usage).where(sql`user_id = ${userId}`);
    return userUsage;
  } catch (error) {
    console.error('Error getting user usage:', error);
    throw error;
  }
}

export async function getUserChats(userId: string) {
  try {
    const userChats = await db
      .select()
      .from(chats)
      .where(sql`user_id = ${userId}`)
      .orderBy(sql`updated_at DESC`);
    return userChats;
  } catch (error) {
    console.error('Error getting user chats:', error);
    throw error;
  }
}

export async function createChat(chatData: {
  userId: string;
  title: string;
  messages?: any[];
  model?: string;
}) {
  try {
    const [chat] = await db.insert(chats).values(chatData).returning();
    return chat;
  } catch (error) {
    console.error('Error creating chat:', error);
    throw error;
  }
}

export async function updateChat(chatId: string, updates: {
  title?: string;
  messages?: any[];
  updatedAt?: Date;
}) {
  try {
    const [chat] = await db
      .update(chats)
      .set({ ...updates, updatedAt: new Date() })
      .where(sql`id = ${chatId}`)
      .returning();
    return chat;
  } catch (error) {
    console.error('Error updating chat:', error);
    throw error;
  }
}