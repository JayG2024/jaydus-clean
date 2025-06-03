import { getDb, COLLECTIONS } from '../mongodb/client';
import { logError, ErrorSeverity } from '../utils/errorLogger';
import { ObjectId } from 'mongodb';
import { v4 as uuidv4 } from 'uuid';
import * as crypto from 'crypto';

export interface ApiKey {
  _id?: string | ObjectId;
  userId: string;
  name: string;
  key: string;
  hashedKey: string;
  lastUsed?: Date;
  createdAt: Date;
  expiresAt?: Date;
  isActive: boolean;
}

// Generate a secure API key
function generateApiKey() {
  return `jd_${uuidv4().replace(/-/g, '')}`;
}

// Hash an API key for storage
function hashApiKey(key: string) {
  return crypto.createHash('sha256').update(key).digest('hex');
}

export async function createApiKey(userId: string, name: string, expiresAt?: Date) {
  try {
    const db = getDb();
    const collection = db.collection(COLLECTIONS.API_KEYS);
    
    const key = generateApiKey();
    const hashedKey = hashApiKey(key);
    
    const now = new Date();
    const newApiKey = {
      userId,
      name,
      key: key.substring(0, 8) + '...',  // Store only a preview of the key
      hashedKey,
      createdAt: now,
      expiresAt,
      isActive: true
    };
    
    const result = await collection.insertOne(newApiKey);
    
    // Return the full key only once during creation
    return { 
      ...newApiKey, 
      _id: result.insertedId,
      key  // Return the full key only during creation
    };
  } catch (error) {
    logError(
      'Error creating API key in MongoDB',
      {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        userId,
        name,
        tags: ['mongodb', 'apikey', 'create']
      },
      ErrorSeverity.ERROR
    );
    throw error;
  }
}

export async function getUserApiKeys(userId: string) {
  try {
    const db = getDb();
    const collection = db.collection(COLLECTIONS.API_KEYS);
    
    return await collection.find({ userId }).sort({ createdAt: -1 }).toArray() as ApiKey[];
  } catch (error) {
    logError(
      'Error getting user API keys from MongoDB',
      {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        userId,
        tags: ['mongodb', 'apikey', 'read']
      },
      ErrorSeverity.ERROR
    );
    throw error;
  }
}

export async function verifyApiKey(apiKey: string) {
  try {
    const db = getDb();
    const collection = db.collection(COLLECTIONS.API_KEYS);
    
    const hashedKey = hashApiKey(apiKey);
    const key = await collection.findOne({ 
      hashedKey,
      isActive: true,
      $or: [
        { expiresAt: { $exists: false } },
        { expiresAt: null },
        { expiresAt: { $gt: new Date() } }
      ]
    }) as ApiKey | null;
    
    if (!key) {
      return null;
    }
    
    // Update last used timestamp
    await collection.updateOne(
      { _id: key._id },
      { $set: { lastUsed: new Date() } }
    );
    
    return key;
  } catch (error) {
    logError(
      'Error verifying API key in MongoDB',
      {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        tags: ['mongodb', 'apikey', 'verify']
      },
      ErrorSeverity.ERROR
    );
    throw error;
  }
}

export async function deactivateApiKey(userId: string, keyId: string) {
  try {
    const db = getDb();
    const collection = db.collection(COLLECTIONS.API_KEYS);
    
    const result = await collection.updateOne(
      { _id: new ObjectId(keyId), userId } as any,
      { $set: { isActive: false } }
    );
    
    if (result.matchedCount === 0) {
      throw new Error(`API key with ID ${keyId} not found or does not belong to user ${userId}`);
    }
    
    return { success: true };
  } catch (error) {
    logError(
      'Error deactivating API key in MongoDB',
      {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        userId,
        keyId,
        tags: ['mongodb', 'apikey', 'update']
      },
      ErrorSeverity.ERROR
    );
    throw error;
  }
}