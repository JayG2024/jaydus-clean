import supabase from '../supabase/client';
import { isLocalDevelopment } from '../utils/validateEnv';
import { logError, ErrorSeverity } from '../utils/errorLogger';

// Interface for usage tracking
export interface UsageStats {
  id?: string;
  user_id: string;
  ai_credits_used: number;
  chat_messages: number;
  images_generated: number;
  voice_minutes: number;
  storage_used: number;  // in bytes
  last_updated: string;
}

// Initialize or update a user's usage record
export const initializeUserUsage = async (userId: string): Promise<void> => {
  if (isLocalDevelopment()) {
    console.log('Development mode: Skipping usage initialization');
    return;
  }

  try {
    // Check if usage record exists using service role key
    const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/rest/v1/usage?user_id=eq.${userId}&select=id`, {
      headers: {
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY}`,
        'apikey': `${import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY}`
      }
    });
    
    if (!response.ok) {
      throw new Error(`Failed to check usage: ${await response.text()}`);
    }
    
    const data = await response.json();
    
    // If no record exists, create one
    if (!data || data.length === 0) {
      const insertResponse = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/rest/v1/usage`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY}`,
          'apikey': `${import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY}`,
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify({
          user_id: userId,
          ai_credits_used: 0,
          chat_messages: 0,
          images_generated: 0,
          voice_minutes: 0,
          storage_used: 0,
          last_updated: new Date().toISOString()
        })
      });
      
      if (!insertResponse.ok) {
        throw new Error(`Failed to create usage record: ${await insertResponse.text()}`);
      }
    }
  } catch (error) {
    logError(
      error instanceof Error ? error : new Error('Failed to initialize usage'),
      {
        message: 'Error initializing usage tracking',
        context: { userId },
        tags: ['usage', 'initialization']
      },
      ErrorSeverity.ERROR
    );
    throw error;
  }
};

// Track API usage
export const trackApiUsage = async (
  userId: string,
  usageType: 'chat' | 'image' | 'voice' | 'storage',
  amount: number = 1
): Promise<void> => {
  try {
    if (!userId) {
      console.warn('No user ID provided for usage tracking');
      return;
    }
    
    if (isLocalDevelopment()) {
      console.log(`Development mode: Skipping usage tracking for ${usageType}, amount: ${amount}`);
      return;
    }
    
    // Initialize usage record if it doesn't exist
    await initializeUserUsage(userId);
    
    // Get current usage
    const getResponse = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/rest/v1/usage?user_id=eq.${userId}&select=*`, {
      headers: {
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY}`,
        'apikey': `${import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY}`
      }
    });
    
    if (!getResponse.ok) {
      throw new Error(`Failed to get usage: ${await getResponse.text()}`);
    }
    
    const data = await getResponse.json();
    
    if (!data || data.length === 0) {
      throw new Error('Usage record not found');
    }
    
    // Prepare updates
    const updates: Partial<UsageStats> = {
      ai_credits_used: (data[0].ai_credits_used || 0) + amount,
      last_updated: new Date().toISOString()
    };
    
    // Update specific metric based on type
    switch (usageType) {
      case 'chat':
        updates.chat_messages = (data[0].chat_messages || 0) + amount;
        break;
      case 'image':
        updates.images_generated = (data[0].images_generated || 0) + amount;
        break;
      case 'voice':
        updates.voice_minutes = (data[0].voice_minutes || 0) + amount;
        break;
      case 'storage':
        updates.storage_used = (data[0].storage_used || 0) + amount;
        break;
    }
    
    // Update the record
    const updateResponse = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/rest/v1/usage?user_id=eq.${userId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY}`,
        'apikey': `${import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY}`,
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify(updates)
    });
    
    if (!updateResponse.ok) {
      throw new Error(`Failed to update usage: ${await updateResponse.text()}`);
    }
  } catch (error) {
    logError(
      error instanceof Error ? error : new Error('Failed to track API usage'),
      {
        message: 'Error tracking API usage',
        context: { userId, usageType, amount },
        tags: ['usage', 'api', usageType]
      },
      ErrorSeverity.ERROR
    );
    throw error;
  }
};

// Get current usage statistics for a user
export const getUserUsage = async (userId: string): Promise<UsageStats> => {
  try {
    if (!userId) {
      console.warn('No user ID provided for usage retrieval');
      return {
        user_id: '',
        ai_credits_used: 0,
        chat_messages: 0,
        images_generated: 0,
        voice_minutes: 0,
        storage_used: 0,
        last_updated: new Date().toISOString()
      };
    }
    
    if (isLocalDevelopment()) {
      console.log('Development mode: Returning placeholder usage data');
      return {
        user_id: userId,
        ai_credits_used: 0,
        chat_messages: 0,
        images_generated: 0,
        voice_minutes: 0,
        storage_used: 0,
        last_updated: new Date().toISOString()
      };
    }
    
    // Get usage record
    const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/rest/v1/usage?user_id=eq.${userId}&select=*`, {
      headers: {
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY}`,
        'apikey': `${import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY}`
      }
    });
    
    if (!response.ok) {
      throw new Error(`Failed to get usage: ${await response.text()}`);
    }
    
    const data = await response.json();
    
    // If no record exists, initialize one
    if (!data || data.length === 0) {
      await initializeUserUsage(userId);
      return {
        user_id: userId,
        ai_credits_used: 0,
        chat_messages: 0,
        images_generated: 0,
        voice_minutes: 0,
        storage_used: 0,
        last_updated: new Date().toISOString()
      };
    }
    
    return data[0];
  } catch (error) {
    logError(
      error instanceof Error ? error : new Error('Failed to get user usage'),
      {
        message: 'Error getting user usage',
        context: { userId },
        tags: ['usage', 'retrieval']
      },
      ErrorSeverity.ERROR
    );
    
    // Return a default object in case of error
    return {
      user_id: userId,
      ai_credits_used: 0,
      chat_messages: 0,
      images_generated: 0,
      voice_minutes: 0,
      storage_used: 0,
      last_updated: new Date().toISOString()
    };
  }
};

// Check if user has enough credits for an operation
export const checkUserCredits = async (
  userId: string,
  operation: 'chat' | 'image' | 'voice',
  quantity: number = 1
): Promise<boolean> => {
  // For local development, always return true
  if (isLocalDevelopment()) {
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
    const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/rest/v1/users?id=eq.${userId}&select=subscription`, {
      headers: {
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY}`,
        'apikey': `${import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY}`
      }
    });
    
    if (!response.ok) {
      throw new Error(`Failed to get user subscription: ${await response.text()}`);
    }
    
    const userData = await response.json();
    const userPlan = userData[0]?.subscription || 'free';
    
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
    const remainingCredits = planLimit - usage.ai_credits_used;
    
    return remainingCredits >= requiredCredits;
  } catch (error) {
    logError(
      error instanceof Error ? error : new Error('Failed to check user credits'),
      {
        message: 'Error checking user credits',
        context: { userId, operation, quantity },
        tags: ['usage', 'credits', 'verification']
      },
      ErrorSeverity.ERROR
    );
    
    // Default to allowing operations if there's an error checking credits
    // This is a business decision - better to potentially give free service than block users incorrectly
    return true;
  }
};