import { logError, ErrorSeverity } from '../utils/errorLogger';
import { COLLECTIONS } from '../utils/browserStorage';

// API URLs for production environment
const API_BASE = '/api';

// Type for MongoDB ObjectId to prevent TypeScript errors
type ObjectId = string | { toString: () => string };

// Check if running in browser
const isBrowser = typeof window !== 'undefined';

// Determine if we're in development mode
const isDev = isBrowser && (window.location.hostname === 'localhost' || (import.meta as any)?.env?.DEV === true);

// Helper to create a new ObjectId-like string
const createObjectId = () => Math.random().toString(36).substring(2, 15);

// Browser DB interface
interface BrowserDB {
  findOne(collection: string, query: any): Promise<any>;
  find(collection: string, query: any): Promise<any[]>;
  updateOne(collection: string, query: any, update: any): Promise<void>;
  insertOne(collection: string, doc: any): Promise<void>;
  deleteOne(collection: string, query: any): Promise<void>;
}

// Cast browserDB to the correct type
const browserDB = (window as any).browserDB as BrowserDB;

export interface ChatMessage {
  id?: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  attachments?: {
    id: string;
    name: string;
    type: string;
    size: number;
    url?: string;
  }[];
}

export interface Chat {
  _id?: string | ObjectId;
  id?: string;
  userId: string;
  title: string;
  messages: ChatMessage[];
  model: string;
  createdAt: Date;
  updatedAt: Date;
  last_updated?: Date;
  assistant_id?: string | null;
  assistant_name?: string | undefined;
  // Store the original MongoDB _id as a string for API calls
  mongoId?: string;
}

export async function createChat(chatData: Omit<Chat, 'createdAt' | 'updatedAt'>) {
  try {
    const now = new Date();
    
    // Create a new chat object
    const newChat = {
      ...chatData,
      id: chatData.id || createObjectId(),
      createdAt: now,
      updatedAt: now,
      last_updated: now
    };
    
    if (isBrowser && isDev) {
      // Use browser storage in development
      await browserDB.insertOne(COLLECTIONS.CHATS, newChat);
      return newChat;
    } else {
      // Use API in production
      const response = await fetch(`${API_BASE}/create-chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newChat)
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to create chat via API');
      }
      
      const data = await response.json();
      // Handle the response format from the API
      if (data.chat) {
        // Convert _id to id for consistency
        return {
          ...data.chat,
          id: data.chat._id?.toString() || data.chat.id,
          last_updated: data.chat.updatedAt || data.chat.last_updated
        };
      }
      return data;
    }
  } catch (error) {
    logError(
      'Error creating chat in MongoDB',
      {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        context: { chatData },
        tags: ['mongodb', 'chat', 'create']
      },
      ErrorSeverity.ERROR
    );
    throw error;
  }
}

export async function getChatById(chatId: string) {
  try {
    if (isBrowser && isDev) {
      // Use browser storage in development
      const chat = await browserDB.findOne(COLLECTIONS.CHATS, { id: chatId });
      return chat || null;
    } else {
      // Use API in production
      const response = await fetch(`${API_BASE}/get-chat?chatId=${chatId}`);
      
      if (!response.ok) {
        if (response.status === 404) return null;
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to fetch chat via API');
      }
      
      return await response.json();
    }
  } catch (error) {
    logError(
      'Error getting chat by ID from MongoDB',
      {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        context: { chatId },
        tags: ['mongodb', 'chat', 'read']
      },
      ErrorSeverity.ERROR
    );
    throw error;
  }
}

export async function getUserChats(userId: string) {
  try {
    if (isBrowser && isDev) {
      // Use browser storage in development
      const allChats = await browserDB.find(COLLECTIONS.CHATS, { userId }) || [];
      return allChats
        .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
        .map(chat => ({
          ...chat,
          last_updated: chat.last_updated || chat.updatedAt
        }));
    } else {
      // Use API in production
      const response = await fetch(`${API_BASE}/get-user-chats?userId=${userId}`);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to fetch user chats via API');
      }
      
      const data = await response.json();
      // Handle the response format from the API
      if (data.chats) {
        return data.chats.map((chat: any) => ({
          ...chat,
          id: chat._id?.toString() || chat.id,
          last_updated: chat.updatedAt || chat.last_updated
        }));
      }
      return data;
    }
  } catch (error) {
    logError(
      'Error getting user chats from MongoDB',
      {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        context: { userId },
        tags: ['mongodb', 'chat', 'read']
      },
      ErrorSeverity.ERROR
    );
    throw error;
  }
}

export async function updateChat(chatId: string, chatData: Partial<Chat>) {
  try {
    const now = new Date();
    
    // Remove _id and id from update data if present
    const { _id, id, ...dataToUpdate } = chatData;
    
    const updateData = {
      ...dataToUpdate,
      updatedAt: now,
      last_updated: now
    };
    
    if (isBrowser && isDev) {
      // Use browser storage in development
      const existingChat = await browserDB.findOne(COLLECTIONS.CHATS, { id: chatId });
      if (!existingChat) {
        throw new Error(`Chat with ID ${chatId} not found`);
      }
      
      const updatedChat = {
        ...existingChat,
        ...updateData,
        id: chatId,
        updatedAt: now,
        last_updated: now
      };
      
      await browserDB.updateOne(COLLECTIONS.CHATS, { id: chatId }, updatedChat);
      return updatedChat;
    } else {
      // Use API in production
      const response = await fetch(`${API_BASE}/update-chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chatId, chatData: updateData })
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to update chat via API');
      }
      
      const data = await response.json();
      // Handle the response format from the API
      if (data.chat) {
        // Convert _id to id for consistency
        return {
          ...data.chat,
          id: data.chat._id?.toString() || data.chat.id,
          last_updated: data.chat.updatedAt || data.chat.last_updated
        };
      }
      return data;
    }
    
    // The return is already handled in the if-else blocks above
  } catch (error) {
    logError(
      'Error updating chat in MongoDB',
      {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        context: { chatId, chatData },
        tags: ['mongodb', 'chat', 'update']
      },
      ErrorSeverity.ERROR
    );
    throw error;
  }
}

export async function addMessageToChat(chatId: string, message: ChatMessage) {
  try {
    if (isBrowser && isDev) {
      // Use browser storage in development
      const chat = await browserDB.findOne(COLLECTIONS.CHATS, { id: chatId });
      if (!chat) {
        throw new Error(`Chat with ID ${chatId} not found`);
      }
      
      // Update the chat with the new message
      const updatedChat = {
        ...chat,
        messages: [...(chat.messages || []), message],
        updatedAt: new Date(),
        last_updated: new Date()
      };
      
      await browserDB.updateOne(COLLECTIONS.CHATS, { id: chatId }, updatedChat);
      return updatedChat;
    } else {
      // Use API in production or when not in browser
      const now = new Date();
      const response = await fetch(`${API_BASE}/update-chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chatId,
          chatData: {
            messages: [...(await getChatById(chatId))?.messages || [], message],
            updatedAt: now,
            last_updated: now
          }
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to add message to chat via API');
      }
      
      return await response.json();
    }
  } catch (error) {
    logError(
      'Error adding message to chat in MongoDB',
      {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        context: { 
          chatId,
          messageContent: message.content,
          messageRole: message.role
        },
        tags: ['mongodb', 'chat', 'update']
      },
      ErrorSeverity.ERROR
    );
    throw error;
  }
}

export async function deleteChat(chatId: string) {
  try {
    if (isBrowser && isDev) {
      // Use browser storage in development
      await browserDB.deleteOne(COLLECTIONS.CHATS, { id: chatId });
      return { success: true };
    } else {
      // Use API in production
      const response = await fetch(`${API_BASE}/delete-chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chatId })
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to delete chat via API');
      }
      
      return { success: true };
    }
  } catch (error) {
    logError(
      'Error deleting chat from MongoDB',
      {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        context: { chatId },
        tags: ['mongodb', 'chat', 'delete']
      },
      ErrorSeverity.ERROR
    );
    throw error;
  }
}