"use client";

import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { openRouter, streamChatCompletion } from '@/lib/openrouter';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { MessageSquare, Send, Bot, User as UserIcon, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { v4 as uuidv4 } from 'uuid';
import ReactMarkdown from 'react-markdown';

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
}

interface Chat {
  id: string;
  title: string;
  messages: Message[];
  model: string;
  created_at: Date;
  updated_at: Date;
}

export default function ChatPage() {
  const [user, setUser] = useState<any>(null);
  const [chats, setChats] = useState<Chat[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedModel, setSelectedModel] = useState('openai/gpt-3.5-turbo');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load user data and chats
  useEffect(() => {
    async function loadUserData() {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      
      if (user) {
        // Load user's chats
        const { data: chatsData, error } = await supabase
          .from('chats')
          .select('*')
          .eq('user_id', user.id)
          .order('updated_at', { ascending: false });
          
        if (error) {
          console.error('Error loading chats:', error);
          toast.error('Failed to load chats');
        } else if (chatsData && chatsData.length > 0) {
          setChats(chatsData);
          // Load the most recent chat
          setCurrentChatId(chatsData[0].id);
          setMessages(chatsData[0].messages || []);
        }
      }
    }
    
    loadUserData();
  }, []);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const createNewChat = async () => {
    if (!user) return;
    
    try {
      const newChat = {
        id: uuidv4(),
        user_id: user.id,
        title: 'New Chat',
        messages: [],
        model: selectedModel,
        created_at: new Date(),
        updated_at: new Date()
      };
      
      const { data, error } = await supabase
        .from('chats')
        .insert([newChat])
        .select()
        .single();
        
      if (error) {
        throw error;
      }
      
      setChats([data, ...chats]);
      setCurrentChatId(data.id);
      setMessages([]);
      toast.success('New chat created');
    } catch (error) {
      console.error('Error creating chat:', error);
      toast.error('Failed to create new chat');
    }
  };

  const sendMessage = async () => {
    if (!inputMessage.trim() || isGenerating) return;
    if (!user) {
      toast.error('Please sign in to send messages');
      return;
    }

    // Create user message
    const userMessage: Message = {
      id: uuidv4(),
      role: 'user',
      content: inputMessage,
      timestamp: new Date()
    };

    // Add to messages state
    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsGenerating(true);

    try {
      // Create or update chat in Supabase
      let chatId = currentChatId;
      
      if (!chatId) {
        // Create a new chat
        const { data, error } = await supabase
          .from('chats')
          .insert([{
            user_id: user.id,
            title: inputMessage.slice(0, 30),
            messages: [userMessage],
            model: selectedModel,
            created_at: new Date(),
            updated_at: new Date()
          }])
          .select()
          .single();
          
        if (error) {
          throw error;
        }
        
        chatId = data.id;
        setCurrentChatId(chatId);
        setChats([data, ...chats]);
      }

      // Create assistant message placeholder
      const assistantMessage: Message = {
        id: uuidv4(),
        role: 'assistant',
        content: '',
        timestamp: new Date()
      };
      
      // Add empty assistant message to state
      setMessages(prev => [...prev, assistantMessage]);

      // Prepare messages for API
      const apiMessages = messages.map(m => ({
        role: m.role,
        content: m.content
      }));
      
      // Add user message
      apiMessages.push({
        role: 'user',
        content: inputMessage
      });

      // Stream the response
      const stream = await openRouter.chat.completions.create({
        model: selectedModel,
        messages: apiMessages,
        stream: true,
      });

      let fullResponse = '';
      
      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content || '';
        if (content) {
          fullResponse += content;
          
          // Update the assistant message with the new content
          setMessages(prev => 
            prev.map(m => 
              m.id === assistantMessage.id 
                ? { ...m, content: fullResponse }
                : m
            )
          );
        }
      }

      // Update chat in database with all messages
      const updatedMessages = [...messages, userMessage, { ...assistantMessage, content: fullResponse }];
      
      const { error } = await supabase
        .from('chats')
        .update({
          messages: updatedMessages,
          updated_at: new Date()
        })
        .eq('id', chatId);
        
      if (error) {
        throw error;
      }
      
      // Update chats list with new title if this was a new chat
      if (chats.findIndex(c => c.id === chatId) === -1) {
        setChats(prev => prev.map(chat => 
          chat.id === chatId 
            ? { ...chat, messages: updatedMessages, title: inputMessage.slice(0, 30) }
            : chat
        ));
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
      
      // Remove the assistant message if there was an error
      setMessages(prev => prev.filter(m => m.role !== 'assistant' || m.content !== ''));
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="h-[calc(100vh-12rem)] flex flex-col">
      {/* Chat header */}
      <div className="border-b border-gray-200 dark:border-gray-800 p-3 flex items-center justify-between bg-white dark:bg-gray-900 rounded-t-xl">
        <div className="flex items-center space-x-2">
          <select
            value={selectedModel}
            onChange={(e) => setSelectedModel(e.target.value)}
            className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-700"
          >
            <option value="openai/gpt-3.5-turbo">GPT-3.5 Turbo</option>
            <option value="openai/gpt-4">GPT-4</option>
            <option value="anthropic/claude-3-sonnet">Claude 3 Sonnet</option>
            <option value="anthropic/claude-3-haiku">Claude 3 Haiku</option>
            <option value="meta-llama/llama-3-70b-instruct">Llama 3 70B</option>
          </select>
        </div>
        
        <Button onClick={createNewChat} variant="outline" size="sm">
          <Sparkles className="h-4 w-4 mr-2" />
          New Chat
        </Button>
      </div>
      
      {/* Messages area */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 bg-gray-50 dark:bg-gray-950">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <MessageSquare className="h-16 w-16 text-gray-300 dark:text-gray-700 mb-4" />
            <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-2">Start a new conversation</h3>
            <p className="text-gray-600 dark:text-gray-400 max-w-md">
              Ask questions, generate content, brainstorm ideas, or just chat with AI.
            </p>
          </div>
        ) : (
          <>
            {messages.map((message) => (
              <div 
                key={message.id} 
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`flex max-w-[85%] md:max-w-2xl ${message.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                  <div className={`flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center ${
                    message.role === 'user' 
                      ? 'bg-primary-500 text-white ml-2' 
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 mr-2'
                  }`}>
                    {message.role === 'user' ? (
                      <UserIcon className="h-5 w-5" />
                    ) : (
                      <Bot className="h-5 w-5" />
                    )}
                  </div>
                  
                  <div className={`px-4 py-3 rounded-xl ${
                    message.role === 'user'
                      ? 'bg-primary-600 text-white'
                      : 'bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800'
                  }`}>
                    <div className={`prose prose-sm max-w-none ${message.role === 'user' ? 'prose-invert' : 'dark:prose-invert'}`}>
                      <ReactMarkdown>
                        {message.content}
                      </ReactMarkdown>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            
            {isGenerating && (
              <div className="flex justify-start">
                <div className="flex max-w-2xl">
                  <div className="flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 mr-2">
                    <Bot className="h-5 w-5" />
                  </div>
                  <div className="px-4 py-3 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
                    <div className="flex items-center space-x-2">
                      <div className="h-2 w-2 rounded-full bg-primary-600 animate-bounce"></div>
                      <div className="h-2 w-2 rounded-full bg-primary-600 animate-bounce delay-150"></div>
                      <div className="h-2 w-2 rounded-full bg-primary-600 animate-bounce delay-300"></div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </>
        )}
      </div>
      
      {/* Input area */}
      <div className="border-t border-gray-200 dark:border-gray-800 p-3 bg-white dark:bg-gray-900">
        <div className="rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 focus-within:ring-2 focus-within:ring-primary-500 focus-within:border-primary-500">
          <textarea
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
              }
            }}
            placeholder="Type a message..."
            className="w-full px-4 py-3 max-h-32 bg-transparent border-none focus:ring-0 resize-none text-gray-900 dark:text-gray-100"
            rows={1}
            disabled={isGenerating}
          />
          
          <div className="flex items-center justify-end px-3 py-2 border-t border-gray-200 dark:border-gray-700">
            <Button 
              onClick={sendMessage}
              disabled={!inputMessage.trim() || isGenerating}
              className="rounded-full h-10 w-10 p-0"
              aria-label="Send message"
            >
              <Send className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}