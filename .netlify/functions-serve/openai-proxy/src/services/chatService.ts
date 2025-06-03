import { collection, addDoc, query, where, orderBy, getDocs, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { v4 as uuidv4 } from 'uuid';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  assistant?: {
    id: string;
    name: string;
  };
}

export interface Chat {
  id: string;
  userId: string;
  title: string;
  messages: ChatMessage[];
  lastUpdated: Date;
  assistantId?: string;
  assistantName?: string;
}

// Mock storage for chats in development mode
let mockChats: Chat[] = [];
const MOCK_ENABLED = true; // Same as Firebase mock setting

// Save a new chat or update an existing one
export const saveChat = async (userId: string, chat: Omit<Chat, 'userId'>) => {
  // For mock mode, save to localStorage and memory
  if (MOCK_ENABLED) {
    console.log('Using mock chat service - saveChat operation');
    const existingChats = JSON.parse(localStorage.getItem('chatSessions') || '[]');
    const chatWithUser = { ...chat, userId };
    
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
  
  // For real Firebase mode
  try {
    if (chat.id) {
      // Update existing chat
      const chatRef = doc(db, 'chats', chat.id);
      await updateDoc(chatRef, {
        title: chat.title,
        messages: chat.messages.map(msg => ({
          ...msg,
          timestamp: msg.timestamp instanceof Date ? msg.timestamp.toISOString() : msg.timestamp
        })),
        lastUpdated: new Date().toISOString(),
        assistantId: chat.assistantId || null,
        assistantName: chat.assistantName || null
      });
      return chat;
    } else {
      // Create new chat
      const chatData = {
        userId,
        title: chat.title,
        messages: chat.messages.map(msg => ({
          ...msg,
          timestamp: msg.timestamp instanceof Date ? msg.timestamp.toISOString() : msg.timestamp
        })),
        lastUpdated: new Date().toISOString(),
        assistantId: chat.assistantId || null,
        assistantName: chat.assistantName || null
      };
      
      const docRef = await addDoc(collection(db, 'chats'), chatData);
      return {
        ...chat,
        id: docRef.id
      };
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
        lastUpdated: new Date(chat.lastUpdated)
      }));
    }
    
    // Filter for the user's chats and sort by lastUpdated
    return mockChats
      .filter(chat => chat.userId === userId)
      .sort((a, b) => b.lastUpdated.getTime() - a.lastUpdated.getTime());
  }
  
  // For real Firebase mode
  try {
    const chatsQuery = query(
      collection(db, 'chats'),
      where('userId', '==', userId),
      orderBy('lastUpdated', 'desc')
    );
    
    const snapshot = await getDocs(chatsQuery);
    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        userId: data.userId,
        title: data.title,
        messages: data.messages.map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp)
        })),
        lastUpdated: new Date(data.lastUpdated),
        assistantId: data.assistantId || undefined,
        assistantName: data.assistantName || undefined
      } as Chat;
    });
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
  
  // For real Firebase mode
  try {
    await deleteDoc(doc(db, 'chats', chatId));
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