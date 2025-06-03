import { getDb, COLLECTIONS } from '../mongodb/client';
import { logError, ErrorSeverity } from '../utils/errorLogger';
import { ObjectId } from 'mongodb';

export interface User {
  _id?: string | ObjectId;
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

export async function createUser(userData: Omit<User, 'createdAt' | 'updatedAt'>) {
  try {
    const db = getDb();
    const collection = db.collection(COLLECTIONS.USERS);
    
    const now = new Date();
    // Create a new user object without the _id field if it's a string
    const { _id, ...userDataWithoutId } = userData;
    const newUser = {
      ...userDataWithoutId,
      createdAt: now,
      updatedAt: now,
    };
    
    const result = await collection.insertOne(newUser);
    return { ...newUser, _id: result.insertedId };
  } catch (error) {
    logError(
      'Error creating user in MongoDB',
      {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        userData,
        tags: ['mongodb', 'user', 'create']
      },
      ErrorSeverity.ERROR
    );
    throw error;
  }
}

export async function getUserByClerkId(clerkId: string) {
  try {
    const db = getDb();
    const collection = db.collection(COLLECTIONS.USERS);
    
    return await collection.findOne({ clerkId }) as User | null;
  } catch (error) {
    logError(
      'Error getting user by Clerk ID from MongoDB',
      {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        clerkId,
        tags: ['mongodb', 'user', 'read']
      },
      ErrorSeverity.ERROR
    );
    throw error;
  }
}

export async function updateUser(clerkId: string, userData: Partial<User>) {
  try {
    const db = getDb();
    const collection = db.collection(COLLECTIONS.USERS);
    
    const updateData = {
      ...userData,
      updatedAt: new Date()
    };
    
    const result = await collection.updateOne(
      { clerkId },
      { $set: updateData }
    );
    
    if (result.matchedCount === 0) {
      throw new Error(`User with Clerk ID ${clerkId} not found`);
    }
    
    return await getUserByClerkId(clerkId);
  } catch (error) {
    logError(
      'Error updating user in MongoDB',
      {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        clerkId,
        userData,
        tags: ['mongodb', 'user', 'update']
      },
      ErrorSeverity.ERROR
    );
    throw error;
  }
}

export async function deleteUser(clerkId: string) {
  try {
    const db = getDb();
    const collection = db.collection(COLLECTIONS.USERS);
    
    const result = await collection.deleteOne({ clerkId });
    
    if (result.deletedCount === 0) {
      throw new Error(`User with Clerk ID ${clerkId} not found`);
    }
    
    return { success: true };
  } catch (error) {
    logError(
      'Error deleting user from MongoDB',
      {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        clerkId,
        tags: ['mongodb', 'user', 'delete']
      },
      ErrorSeverity.ERROR
    );
    throw error;
  }
}

export async function updateUserSubscription(
  clerkId: string, 
  subscription: User['subscription'],
  subscriptionStatus: User['subscriptionStatus'],
  stripeCustomerId?: string,
  stripeSubscriptionId?: string
) {
  try {
    return await updateUser(clerkId, {
      subscription,
      subscriptionStatus,
      stripeCustomerId,
      stripeSubscriptionId,
    });
  } catch (error) {
    logError(
      'Error updating user subscription in MongoDB',
      {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        clerkId,
        subscription,
        subscriptionStatus,
        tags: ['mongodb', 'user', 'subscription']
      },
      ErrorSeverity.ERROR
    );
    throw error;
  }
}