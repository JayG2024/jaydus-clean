// MongoDB initialization script
// Run with: node scripts/init-mongodb.js

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

// Sample data for development
const SAMPLE_DATA = {
  USERS: [
    {
      clerkId: 'dev_user_1',
      email: 'admin@example.com',
      displayName: 'Admin User',
      photoUrl: 'https://ui-avatars.com/api/?name=Admin+User',
      role: 'admin',
      subscription: 'pro',
      subscriptionStatus: 'active',
      createdAt: new Date(),
      updatedAt: new Date(),
      lastLogin: new Date()
    },
    {
      clerkId: 'dev_user_2',
      email: 'user@example.com',
      displayName: 'Regular User',
      photoUrl: 'https://ui-avatars.com/api/?name=Regular+User',
      role: 'user',
      subscription: 'free',
      subscriptionStatus: 'active',
      createdAt: new Date(),
      updatedAt: new Date(),
      lastLogin: new Date()
    }
  ],
  CHATS: [
    {
      userId: 'dev_user_1',
      title: 'Sample Chat 1',
      messages: [
        {
          role: 'user',
          content: 'Hello, how can I use the AI features?',
          timestamp: new Date()
        },
        {
          role: 'assistant',
          content: 'You can use the AI features by navigating to the Chat, Images, or Voice sections from the dashboard.',
          timestamp: new Date()
        }
      ],
      model: 'gpt-4o',
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ],
  USAGE: [
    {
      userId: 'dev_user_1',
      type: 'text',
      model: 'gpt-4o',
      tokensInput: 100,
      tokensOutput: 250,
      cost: 0.01,
      timestamp: new Date(),
      metadata: {
        prompt: 'Sample prompt for development'
      }
    },
    {
      userId: 'dev_user_1',
      type: 'image',
      model: 'dall-e-3',
      cost: 0.04,
      timestamp: new Date(),
      metadata: {
        prompt: 'Sample image prompt',
        size: '1024x1024'
      }
    }
  ]
};

async function initMongoDB() {
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
    
    // Insert sample data if collections are empty
    const shouldInsertSampleData = process.argv.includes('--with-sample-data');
    
    if (shouldInsertSampleData) {
      console.log('Inserting sample data...');
      
      // Insert users if collection is empty
      const usersCount = await db.collection(COLLECTIONS.USERS).countDocuments();
      if (usersCount === 0) {
        await db.collection(COLLECTIONS.USERS).insertMany(SAMPLE_DATA.USERS);
        console.log(`Inserted ${SAMPLE_DATA.USERS.length} sample users`);
      } else {
        console.log('Users collection already has data, skipping sample data insertion');
      }
      
      // Insert chats if collection is empty
      const chatsCount = await db.collection(COLLECTIONS.CHATS).countDocuments();
      if (chatsCount === 0) {
        await db.collection(COLLECTIONS.CHATS).insertMany(SAMPLE_DATA.CHATS);
        console.log(`Inserted ${SAMPLE_DATA.CHATS.length} sample chats`);
      } else {
        console.log('Chats collection already has data, skipping sample data insertion');
      }
      
      // Insert usage if collection is empty
      const usageCount = await db.collection(COLLECTIONS.USAGE).countDocuments();
      if (usageCount === 0) {
        await db.collection(COLLECTIONS.USAGE).insertMany(SAMPLE_DATA.USAGE);
        console.log(`Inserted ${SAMPLE_DATA.USAGE.length} sample usage records`);
      } else {
        console.log('Usage collection already has data, skipping sample data insertion');
      }
    }
    
    console.log('MongoDB initialization completed successfully');
  } catch (error) {
    console.error('Error initializing MongoDB:', error);
  } finally {
    await client.close();
    console.log('MongoDB connection closed');
  }
}

initMongoDB().catch(console.error);