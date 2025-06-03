// MongoDB setup script
// Run with: node scripts/setup-mongodb.js

import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

// Database and collections
const DB_NAME = 'jaydus_platform';
const COLLECTIONS = {
  USERS: 'users',
  CHATS: 'chats',
  USAGE: 'usage',
  API_KEYS: 'api_keys',
  INTEGRATIONS: 'integrations',
  SUBSCRIPTIONS: 'subscriptions',
};

async function setupMongoDB() {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017';
  console.log(`Connecting to MongoDB at ${uri.split('@').pop()}`);
  
  const client = new MongoClient(uri);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db(DB_NAME);
    
    // Create collections
    for (const collectionName of Object.values(COLLECTIONS)) {
      try {
        await db.createCollection(collectionName);
        console.log(`Created collection: ${collectionName}`);
      } catch (error) {
        if (error.code === 48) {
          console.log(`Collection ${collectionName} already exists`);
        } else {
          throw error;
        }
      }
    }
    
    // Create indexes
    
    // Users collection
    await db.collection(COLLECTIONS.USERS).createIndexes([
      { key: { clerkId: 1 }, unique: true },
      { key: { email: 1 }, unique: true },
      { key: { stripeCustomerId: 1 }, sparse: true }
    ]);
    console.log('Created indexes for users collection');
    
    // Chats collection
    await db.collection(COLLECTIONS.CHATS).createIndexes([
      { key: { userId: 1 } },
      { key: { createdAt: -1 } }
    ]);
    console.log('Created indexes for chats collection');
    
    // Usage collection
    await db.collection(COLLECTIONS.USAGE).createIndexes([
      { key: { userId: 1 } },
      { key: { timestamp: -1 } },
      { key: { type: 1 } }
    ]);
    console.log('Created indexes for usage collection');
    
    // API Keys collection
    await db.collection(COLLECTIONS.API_KEYS).createIndexes([
      { key: { userId: 1 } },
      { key: { hashedKey: 1 }, unique: true }
    ]);
    console.log('Created indexes for api_keys collection');
    
    console.log('MongoDB setup completed successfully');
  } catch (error) {
    console.error('Error setting up MongoDB:', error);
  } finally {
    await client.close();
    console.log('MongoDB connection closed');
  }
}

setupMongoDB().catch(console.error);