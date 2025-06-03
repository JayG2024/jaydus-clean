import supabase from '../supabase/client';

export interface Integration {
  id: string;
  user_id: string;
  name: string;
  status: 'connected' | 'disconnected';
  connected_at?: string;
  config?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

// Get all integrations for a user
export const getIntegrations = async (userId: string): Promise<Integration[]> => {
  try {
    const { data, error } = await supabase
      .from('integrations')
      .select('*')
      .eq('user_id', userId)
      .order('name');
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error getting integrations:', error);
    throw error;
  }
};

// Connect an integration
export const connectIntegration = async (
  userId: string, 
  name: string, 
  config: Record<string, any> = {}
): Promise<Integration> => {
  try {
    // Check if integration already exists
    const { data: existingIntegration, error: checkError } = await supabase
      .from('integrations')
      .select('*')
      .eq('user_id', userId)
      .eq('name', name)
      .maybeSingle();
    
    if (checkError) throw checkError;
    
    const now = new Date().toISOString();
    
    if (existingIntegration) {
      // Update existing integration
      const { data, error } = await supabase
        .from('integrations')
        .update({
          status: 'connected',
          connected_at: now,
          config,
          updated_at: now
        })
        .eq('id', existingIntegration.id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    } else {
      // Create new integration
      const { data, error } = await supabase
        .from('integrations')
        .insert({
          user_id: userId,
          name,
          status: 'connected',
          connected_at: now,
          config,
          created_at: now,
          updated_at: now
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    }
  } catch (error) {
    console.error('Error connecting integration:', error);
    throw error;
  }
};

// Disconnect an integration
export const disconnectIntegration = async (integrationId: string, userId: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('integrations')
      .update({
        status: 'disconnected',
        connected_at: null,
        updated_at: new Date().toISOString()
      })
      .eq('id', integrationId)
      .eq('user_id', userId);
    
    if (error) throw error;
  } catch (error) {
    console.error('Error disconnecting integration:', error);
    throw error;
  }
};