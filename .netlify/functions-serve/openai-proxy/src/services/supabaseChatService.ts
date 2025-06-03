import supabase from '../supabase/client';
import { v4 as uuidv4 } from 'uuid';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date | string;
  assistant?: {
    id: string;
    name: string;
  };
}

export interface Chat {
  id: string;
  user_id: string;
  title: string;
  messages: ChatMessage[];
  last_updated: Date | string;
  assistant_id?: string;
  assistant_name?: string;
}

// Mock storage for chats in development mode
let mockChats: Chat[] = [];
const MOCK_ENABLED = import.meta.env.VITE_ENABLE_MOCK_MODE === 'true';

// Save a new chat or update an existing one
export const saveChat = async (userId: string, chat: Omit<Chat, 'user_id'>) => {
  // For mock mode, save to localStorage and memory
  if (MOCK_ENABLED) {
    console.log('Using mock chat service - saveChat operation');
    const existingChats = JSON.parse(localStorage.getItem('chatSessions') || '[]');
    const chatWithUser = { ...chat, user_id: userId };
    
    if (chatWithUser.id) {
      // Update existing chat
      const index = existingChats.findIndex((c: Chat) => c.id === chatWithUser.id);
      if (index !== -1) {
        existingChats[index] = chatWithUser;
      } else {
        existingChats.push(chatWithUser);
      }
      
      // Also update in-memory mock
      const memIndex = mockChats.findIndex(c => c.id === chatWithUser.id);
      if (memIndex !== -1) {
        mockChats[memIndex] = chatWithUser as Chat;
      } else {
        mockChats.push(chatWithUser as Chat);
      }
    } else {
      // New chat
      chatWithUser.id = `chat-${uuidv4()}`;
      existingChats.push(chatWithUser);
      mockChats.push(chatWithUser as Chat);
    }
    
    localStorage.setItem('chatSessions', JSON.stringify(existingChats));
    return chatWithUser;
  }
  
  // For real Supabase mode
  try {
    // Format messages for storage
    const formattedMessages = chat.messages.map(msg => ({
      ...msg,
      timestamp: msg.timestamp instanceof Date ? msg.timestamp.toISOString() : msg.timestamp
    }));
    
    if (chat.id) {
      // Update existing chat
      const { data, error } = await supabase
        .from('chats')
        .update({
          title: chat.title,
          messages: formattedMessages,
          last_updated: new Date().toISOString(),
          assistant_id: chat.assistant_id || null,
          assistant_name: chat.assistant_name || null
        })
        .eq('id', chat.id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    } else {
      // Create new chat
      const { data, error } = await supabase
        .from('chats')
        .insert({
          user_id: userId,
          title: chat.title,
          messages: formattedMessages,
          last_updated: new Date().toISOString(),
          assistant_id: chat.assistant_id || null,
          assistant_name: chat.assistant_name || null
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    }
  } catch (error) {
    console.error('Error saving chat:', error);
    throw error;
  }
};

// Get all chats for a user
export const getUserChats = async (userId: string): Promise<Chat[]> => {
  // For mock mode
  if (MOCK_ENABLED) {
    console.log('Using mock chat service - getUserChats operation');

    // If memory cache is empty, initialize from localStorage
    if (mockChats.length === 0) {
      const existingChats = JSON.parse(localStorage.getItem('chatSessions') || '[]');
      mockChats = existingChats.map((chat: any) => ({
        ...chat,
        messages: chat.messages.map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp)
        })),
        last_updated: new Date(chat.last_updated)
      }));
    }
    
    // Filter for the user's chats and sort by lastUpdated
    return mockChats
      .filter(chat => chat.user_id === userId)
      .sort((a, b) => {
        const dateA = a.last_updated instanceof Date ? a.last_updated : new Date(a.last_updated);
        const dateB = b.last_updated instanceof Date ? b.last_updated : new Date(b.last_updated);
        return dateB.getTime() - dateA.getTime();
      });
  }
  
  // For real Supabase mode
  try {
    const { data, error } = await supabase
      .from('chats')
      .select('*')
      .eq('user_id', userId)
      .order('last_updated', { ascending: false });
    
    if (error) throw error;
    
    // Format the data to match the expected interface
    return data.map(chat => ({
      ...chat,
      messages: chat.messages.map((msg: any) => ({
        ...msg,
        timestamp: new Date(msg.timestamp)
      })),
      last_updated: new Date(chat.last_updated)
    }));
  } catch (error) {
    console.error('Error getting user chats:', error);
    throw error;
  }
};

// Delete a chat
export const deleteChat = async (chatId: string, userId: string) => {
  // For mock mode
  if (MOCK_ENABLED) {
    console.log('Using mock chat service - deleteChat operation');
    mockChats = mockChats.filter(c => c.id !== chatId);
    
    // Also update localStorage
    const existingChats = JSON.parse(localStorage.getItem('chatSessions') || '[]');
    const filteredChats = existingChats.filter((c: Chat) => c.id !== chatId);
    localStorage.setItem('chatSessions', JSON.stringify(filteredChats));
    return;
  }
  
  // For real Supabase mode
  try {
    const { error } = await supabase
      .from('chats')
      .delete()
      .eq('id', chatId)
      .eq('user_id', userId);
    
    if (error) throw error;
  } catch (error) {
    console.error('Error deleting chat:', error);
    throw error;
  }
};

// Generate a title for a chat based on the first message
export const generateChatTitle = (message: string): string => {
  // Truncate and clean up the message to create a title
  let title = message.trim();
  
  // Remove markdown formatting if present
  title = title.replace(/[#*`_~]/g, '');
  
  // Limit length
  if (title.length > 60) {
    title = title.substring(0, 57) + '...';
  }
  
  return title || 'New Conversation';
};