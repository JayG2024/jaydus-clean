import { doc, updateDoc, getDoc, setDoc, increment } from 'firebase/firestore';
import { db } from '../firebase/config';

// Mock mode flag
const MOCK_ENABLED = true; // Set to false for production

// Mock storage
let mockUsage = {
  'mock-user-123': {
    aiCreditsUsed: 240,
    chatMessages: 75,
    imagesGenerated: 12,
    voiceMinutes: 8,
    storageUsed: 5242880, // 5MB in bytes
    lastUpdated: new Date()
  }
};

// Interface for usage tracking
export interface UsageStats {
  aiCreditsUsed: number;
  chatMessages: number;
  imagesGenerated: number;
  voiceMinutes: number;
  storageUsed: number;  // in bytes
  lastUpdated: Date;
}

// Initialize or update a user's usage record
export const initializeUserUsage = async (userId: string): Promise<void> => {
  if (MOCK_ENABLED) {
    console.log('Using mock usage service - initializeUserUsage operation');
    if (!mockUsage[userId]) {
      mockUsage[userId] = {
        aiCreditsUsed: 0,
        chatMessages: 0,
        imagesGenerated: 0,
        voiceMinutes: 0,
        storageUsed: 0,
        lastUpdated: new Date()
      };
    }
    return;
  }

  try {
    const usageRef = doc(db, 'usage', userId);
    const usageDoc = await getDoc(usageRef);
    
    if (!usageDoc.exists()) {
      // Create a new usage record if one doesn't exist
      await setDoc(usageRef, {
        aiCreditsUsed: 0,
        chatMessages: 0,
        imagesGenerated: 0,
        voiceMinutes: 0,
        storageUsed: 0,
        lastUpdated: new Date().toISOString()
      });
    }
  } catch (error) {
    console.error('Error initializing usage:', error);
    throw error;
  }
};

// Track API usage
export const trackApiUsage = async (
  userId: string,
  usageType: 'chat' | 'image' | 'voice' | 'storage',
  amount: number = 1
): Promise<void> => {
  if (MOCK_ENABLED) {
    console.log(`Using mock usage service - trackApiUsage operation: ${usageType}, amount: ${amount}`);
    
    if (!mockUsage[userId]) {
      await initializeUserUsage(userId);
    }
    
    // Update mock usage
    mockUsage[userId].aiCreditsUsed += amount;
    mockUsage[userId].lastUpdated = new Date();
    
    // Update specific metric
    switch (usageType) {
      case 'chat':
        mockUsage[userId].chatMessages += amount;
        break;
      case 'image':
        mockUsage[userId].imagesGenerated += amount;
        break;
      case 'voice':
        mockUsage[userId].voiceMinutes += amount;
        break;
      case 'storage':
        mockUsage[userId].storageUsed += amount;
        break;
      default:
        break;
    }
    
    return;
  }

  try {
    if (!userId) {
      console.warn('No user ID provided for usage tracking');
      return;
    }
    
    const usageRef = doc(db, 'usage', userId);
    
    // Initialize usage record if it doesn't exist
    await initializeUserUsage(userId);
    
    // Update the appropriate usage metric
    const updates: Record<string, any> = {
      lastUpdated: new Date().toISOString()
    };
    
    // Always increment AI credits
    updates.aiCreditsUsed = increment(amount);
    
    // Increment specific usage metric based on type
    switch (usageType) {
      case 'chat':
        updates.chatMessages = increment(amount);
        break;
      case 'image':
        updates.imagesGenerated = increment(amount);
        break;
      case 'voice':
        updates.voiceMinutes = increment(amount);
        break;
      case 'storage':
        updates.storageUsed = increment(amount);
        break;
      default:
        break;
    }
    
    await updateDoc(usageRef, updates);
  } catch (error) {
    console.error('Error tracking API usage:', error);
    throw error;
  }
};

// Get current usage statistics for a user
export const getUserUsage = async (userId: string): Promise<UsageStats> => {
  if (MOCK_ENABLED) {
    console.log('Using mock usage service - getUserUsage operation');
    
    if (!mockUsage[userId]) {
      await initializeUserUsage(userId);
    }
    
    return { ...mockUsage[userId] };
  }

  try {
    if (!userId) {
      console.warn('No user ID provided for usage retrieval');
      return {
        aiCreditsUsed: 0,
        chatMessages: 0,
        imagesGenerated: 0,
        voiceMinutes: 0,
        storageUsed: 0,
        lastUpdated: new Date()
      };
    }
    
    const usageRef = doc(db, 'usage', userId);
    const usageDoc = await getDoc(usageRef);
    
    if (!usageDoc.exists()) {
      // Initialize if not exists
      await initializeUserUsage(userId);
      return {
        aiCreditsUsed: 0,
        chatMessages: 0,
        imagesGenerated: 0,
        voiceMinutes: 0,
        storageUsed: 0,
        lastUpdated: new Date()
      };
    }
    
    const data = usageDoc.data();
    
    return {
      aiCreditsUsed: data.aiCreditsUsed || 0,
      chatMessages: data.chatMessages || 0,
      imagesGenerated: data.imagesGenerated || 0,
      voiceMinutes: data.voiceMinutes || 0,
      storageUsed: data.storageUsed || 0,
      lastUpdated: new Date(data.lastUpdated)
    };
  } catch (error) {
    console.error('Error getting user usage:', error);
    throw error;
  }
};

// Check if user has enough credits for an operation
export const checkUserCredits = async (
  userId: string,
  operation: 'chat' | 'image' | 'voice',
  quantity: number = 1
): Promise<boolean> => {
  if (MOCK_ENABLED) {
    console.log(`Using mock usage service - checkUserCredits operation: ${operation}, quantity: ${quantity}`);
    
    // In mock mode, always return true to allow operations
    return true;
  }

  try {
    // Credit costs per operation
    const creditCosts = {
      chat: 1,  // 1 credit per message
      image: 10, // 10 credits per image
      voice: 5,  // 5 credits per voice minute
    };
    
    // Get user's plan limits
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      return false;
    }
    
    const userData = userDoc.data();
    const userPlan = userData.subscription || 'free';
    
    // Plan limits
    const planLimits = {
      free: 5000,
      pro: 50000,
      business: 150000,
      enterprise: 500000
    };
    
    // Get current usage
    const usage = await getUserUsage(userId);
    
    // Calculate required credits
    const requiredCredits = creditCosts[operation] * quantity;
    
    // Check if user has enough credits left
    const planLimit = planLimits[userPlan as keyof typeof planLimits] || 5000;
    const remainingCredits = planLimit - usage.aiCreditsUsed;
    
    return remainingCredits >= requiredCredits;
  } catch (error) {
    console.error('Error checking user credits:', error);
    return false;
  }
};