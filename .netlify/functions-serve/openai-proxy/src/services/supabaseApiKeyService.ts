import supabase from '../supabase/client';
import { v4 as uuidv4 } from 'uuid';

export interface ApiKey {
  id: string;
  user_id: string;
  name: string;
  key: string;
  created_at: string;
  last_used?: string;
}

// Get all API keys for a user
export const getApiKeys = async (userId: string): Promise<ApiKey[]> => {
  try {
    const { data, error } = await supabase
      .from('api_keys')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error getting API keys:', error);
    throw error;
  }
};

// Create a new API key
export const createApiKey = async (userId: string, name: string): Promise<ApiKey> => {
  try {
    const key = 'jay_' + uuidv4().replace(/-/g, '');
    
    const { data, error } = await supabase
      .from('api_keys')
      .insert({
        user_id: userId,
        name,
        key,
        created_at: new Date().toISOString()
      })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error creating API key:', error);
    throw error;
  }
};

// Delete an API key
export const deleteApiKey = async (keyId: string, userId: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('api_keys')
      .delete()
      .eq('id', keyId)
      .eq('user_id', userId);
    
    if (error) throw error;
  } catch (error) {
    console.error('Error deleting API key:', error);
    throw error;
  }
};

// Update last used timestamp for an API key
export const updateApiKeyUsage = async (key: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('api_keys')
      .update({ last_used: new Date().toISOString() })
      .eq('key', key);
    
    if (error) throw error;
  } catch (error) {
    console.error('Error updating API key usage:', error);
    throw error;
  }
};