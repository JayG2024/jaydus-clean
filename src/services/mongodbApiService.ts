/**
 * MongoDB API Service
 * 
 * This service provides methods to interact with MongoDB through Netlify Functions.
 * It handles all MongoDB operations by making API calls to the server.
 */

import { User, Chat, UsageRecord, ApiKey } from '../mongodb/client';

const API_BASE_URL = import.meta.env.DEV ? '/.netlify/functions' : '/api';

// Helper function to handle API responses
async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `API error: ${response.status}`);
  }
  return await response.json();
}

// User API methods
export async function getCurrentUser(clerkId: string): Promise<User | null> {
  const response = await fetch(`${API_BASE_URL}/get-user-data?userId=${clerkId}`);
  return handleResponse<{ user: User | null }>(response).then(data => data.user);
}

export async function createUserProfile(userData: Partial<User>): Promise<User> {
  const response = await fetch(`${API_BASE_URL}/create-user`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(userData)
  });
  return handleResponse<{ user: User }>(response).then(data => data.user);
}

export async function updateUserProfile(clerkId: string, userData: Partial<User>): Promise<User> {
  const response = await fetch(`${API_BASE_URL}/update-user`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ clerkId, userData })
  });
  return handleResponse<{ user: User }>(response).then(data => data.user);
}

// Chat API methods
export async function getUserChats(userId: string): Promise<Chat[]> {
  const response = await fetch(`${API_BASE_URL}/get-user-chats?userId=${userId}`);
  return handleResponse<{ chats: Chat[] }>(response).then(data => data.chats);
}

export async function createChat(chatData: Partial<Chat>): Promise<Chat> {
  const response = await fetch(`${API_BASE_URL}/create-chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(chatData)
  });
  return handleResponse<{ chat: Chat }>(response).then(data => data.chat);
}

export async function updateChat(chatId: string, chatData: Partial<Chat>): Promise<Chat> {
  const response = await fetch(`${API_BASE_URL}/update-chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chatId, chatData })
  });
  return handleResponse<{ chat: Chat }>(response).then(data => data.chat);
}

export async function deleteChat(chatId: string): Promise<{ success: boolean }> {
  const response = await fetch(`${API_BASE_URL}/delete-chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chatId })
  });
  return handleResponse<{ success: boolean }>(response);
}

// Usage API methods
export async function recordUsage(usageData: Partial<UsageRecord>): Promise<UsageRecord> {
  const response = await fetch(`${API_BASE_URL}/record-usage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(usageData)
  });
  return handleResponse<{ usage: UsageRecord }>(response).then(data => data.usage);
}

export async function getUserUsage(userId: string, startDate?: Date, endDate?: Date): Promise<UsageRecord[]> {
  let url = `${API_BASE_URL}/get-user-usage?userId=${userId}`;
  if (startDate) url += `&startDate=${startDate.toISOString()}`;
  if (endDate) url += `&endDate=${endDate.toISOString()}`;
  
  const response = await fetch(url);
  return handleResponse<{ usage: UsageRecord[] }>(response).then(data => data.usage);
}

// API Key methods
export async function getUserApiKeys(userId: string): Promise<ApiKey[]> {
  const response = await fetch(`${API_BASE_URL}/get-user-api-keys?userId=${userId}`);
  return handleResponse<{ apiKeys: ApiKey[] }>(response).then(data => data.apiKeys);
}

export async function createApiKey(userId: string, name: string): Promise<ApiKey> {
  const response = await fetch(`${API_BASE_URL}/create-api-key`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, name })
  });
  return handleResponse<{ apiKey: ApiKey }>(response).then(data => data.apiKey);
}

export async function deactivateApiKey(userId: string, keyId: string): Promise<{ success: boolean }> {
  const response = await fetch(`${API_BASE_URL}/deactivate-api-key`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, keyId })
  });
  return handleResponse<{ success: boolean }>(response);
}

// Mock implementations for development
if (import.meta.env.DEV && import.meta.env.VITE_ENABLE_MOCK_MODE === 'true') {
  const mockUser: User = {
    _id: 'mock-user-id',
    clerkId: 'mock-clerk-id',
    email: 'mock@example.com',
    displayName: 'Mock User',
    role: 'admin',
    subscription: 'pro',
    subscriptionStatus: 'active',
    createdAt: new Date(),
    updatedAt: new Date(),
    lastLogin: new Date()
  };
  
  const mockChat: Chat = {
    _id: 'mock-chat-id',
    userId: 'mock-clerk-id',
    title: 'Mock Chat',
    messages: [
      { role: 'user', content: 'Hello', timestamp: new Date() },
      { role: 'assistant', content: 'Hi there! How can I help you?', timestamp: new Date() }
    ],
    model: 'gpt-4o',
    createdAt: new Date(),
    updatedAt: new Date()
  };
  
  const mockApiKey: ApiKey = {
    _id: 'mock-api-key-id',
    userId: 'mock-clerk-id',
    name: 'Mock API Key',
    key: 'jay_mock_key',
    hashedKey: 'hashed_mock_key',
    createdAt: new Date(),
    isActive: true
  };
  
  // Create mock implementations
  const mockGetCurrentUser = async (clerkId: string): Promise<User | null> => {
    console.log('Using mock getCurrentUser', { clerkId });
    return { ...mockUser, clerkId };
  };
  
  const mockCreateUserProfile = async (userData: Partial<User>): Promise<User> => {
    console.log('Using mock createUserProfile', userData);
    return { ...mockUser, ...userData };
  };
  
  const mockUpdateUserProfile = async (clerkId: string, userData: Partial<User>): Promise<User> => {
    console.log('Using mock updateUserProfile', { clerkId, userData });
    return { ...mockUser, ...userData, clerkId };
  };
  
  const mockGetUserChats = async (userId: string): Promise<Chat[]> => {
    console.log('Using mock getUserChats', { userId });
    return [{ ...mockChat, userId }];
  };
  
  const mockCreateChat = async (chatData: Partial<Chat>): Promise<Chat> => {
    console.log('Using mock createChat', chatData);
    return { ...mockChat, ...chatData };
  };
  
  const mockUpdateChat = async (chatId: string, chatData: Partial<Chat>): Promise<Chat> => {
    console.log('Using mock updateChat', { chatId, chatData });
    return { ...mockChat, ...chatData, _id: chatId };
  };
  
  const mockDeleteChat = async (chatId: string): Promise<{ success: boolean }> => {
    console.log('Using mock deleteChat', { chatId });
    return { success: true };
  };
  
  const mockGetUserApiKeys = async (userId: string): Promise<ApiKey[]> => {
    console.log('Using mock getUserApiKeys', { userId });
    return [{ ...mockApiKey, userId }];
  };
  
  const mockCreateApiKey = async (userId: string, name: string): Promise<ApiKey> => {
    console.log('Using mock createApiKey', { userId, name });
    return { ...mockApiKey, userId, name };
  };
  
  const mockDeactivateApiKey = async (userId: string, keyId: string): Promise<{ success: boolean }> => {
    console.log('Using mock deactivateApiKey', { userId, keyId });
    return { success: true };
  };
  
  // Replace the original functions with mocks
  // @ts-ignore
  getCurrentUser = mockGetCurrentUser;
  // @ts-ignore
  createUserProfile = mockCreateUserProfile;
  // @ts-ignore
  updateUserProfile = mockUpdateUserProfile;
  // @ts-ignore
  getUserChats = mockGetUserChats;
  // @ts-ignore
  createChat = mockCreateChat;
  // @ts-ignore
  updateChat = mockUpdateChat;
  // @ts-ignore
  deleteChat = mockDeleteChat;
  // @ts-ignore
  getUserApiKeys = mockGetUserApiKeys;
  // @ts-ignore
  createApiKey = mockCreateApiKey;
  // @ts-ignore
  deactivateApiKey = mockDeactivateApiKey;
}