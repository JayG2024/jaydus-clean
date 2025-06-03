import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  PlusCircle, MoreVertical, Trash2, Download, Sparkles, Bot, 
  StopCircle, Archive, Share, History
} from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { Button } from '../../components/ui/Button';

import { toast } from 'sonner';
import { useAuth } from '../../context/SupabaseAuthContext';
import { saveChat, getUserChats, deleteChat, generateChatTitle } from '../../services/supabaseChatService';
import type { Chat, ChatMessage } from '../../services/supabaseChatService';
import { Card, CardContent } from '../../components/ui/Card';
import { EmptyState } from '../../components/ui/EmptyState';
import { format } from 'date-fns';

import ReactMarkdown from 'react-markdown';
import { v4 as uuidv4 } from 'uuid';
import ChatSettings from '../../components/chat/ChatSettings';

// Import custom components
import ModelSelector from '../../components/chat/ModelSelector';
import AssistantSelector from '../../components/chat/AssistantSelector';
import PromptTemplateDropdown from '../../components/chat/PromptTemplateDropdown';
import ChatHistoryPanel from '../../components/chat/ChatHistoryPanel';
import ChatInputBox, { UploadedFile } from '../../components/chat/ChatInputBox';
import MessageAttachments from '../../components/chat/MessageAttachments';

// Import streaming service
import { streamChatCompletion } from '../../services/streamingService';

// Mock assistant data (in a real app, this would come from the database)
const assistants = [
  {
    id: 'ast-123',
    name: 'Customer Support',
    description: 'Handles customer inquiries and troubleshooting',
    model: 'GPT-4',
    instructions: 'You are a helpful customer support representative. Answer user questions accurately and politely.'
  },
  {
    id: 'ast-456',
    name: 'Marketing Assistant',
    description: 'Helps create and analyze marketing campaigns',
    model: 'GPT-4',
    instructions: 'You are a marketing expert. Help users create compelling marketing content and analyze campaign effectiveness.'
  },
  {
    id: 'ast-789',
    name: 'Data Analyzer',
    description: 'Analyzes and visualizes business metrics',
    model: 'GPT-3.5 Turbo',
    instructions: 'You are a data analysis expert. Help users understand their business metrics and provide insights.'
  },
];

// Extended ChatMessage interface to support file attachments
interface ExtendedChatMessage extends ChatMessage {
  attachments?: {
    id: string;
    name: string;
    type: string;
    size: number;
    url?: string;
  }[];
}

const ChatPage: React.FC = () => {
  const { currentUser } = useAuth();
  const { chatId } = useParams();
  const navigate = useNavigate();
  
  // Chat state
  const [messages, setMessages] = useState<ExtendedChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [chats, setChats] = useState<Chat[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [selectedAssistantId, setSelectedAssistantId] = useState<string | null>(null);
  const [selectedModel, setSelectedModel] = useState<string>(localStorage.getItem('selectedModel') ?? 'gpt-4');
  const [showDeleteModal, setShowDeleteModal] = useState<string | null>(null);
  const [showHistoryPanel, setShowHistoryPanel] = useState(false);
  const [showChatMenu, setShowChatMenu] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  
  // Chat settings
  const [chatSettings, setChatSettings] = useState({
    temperature: 0.7,
    maxTokens: 2048,
    topP: 1,
    frequencyPenalty: 0,
    presencePenalty: 0,
  });
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Load user's chats on component mount
  useEffect(() => {
    loadChats();
  }, []);
  
  // Set user ID for usage tracking if the service supports it
  useEffect(() => {
    if (currentUser) {
      console.log(`🔗 User connected: ${currentUser?.id}`);
    }
  }, [currentUser]);
  
  // Scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  // Clean up object URLs on unmount or when files are removed
  useEffect(() => {
    return () => {
      uploadedFiles.forEach(file => {
        if (file.preview) {
          URL.revokeObjectURL(file.preview);
        }
      });
    };
  }, [uploadedFiles]);
  
  // Load user chats
  const loadChats = useCallback(async () => {
    if (!currentUser) return;
    
    try {
      const userChats = await getUserChats(currentUser.id);
      const parsedChats = userChats.map(chat => ({
        ...chat,
        last_updated: typeof chat.last_updated === 'string' ? new Date(chat.last_updated) : chat.last_updated
      }));
      setChats(prev => [...prev, ...parsedChats]);
      
      // If there's an active chat ID in the URL, load that chat
      if (chatId) {
        const chatToLoad = parsedChats.find(chat => chat.id === chatId);
        if (chatToLoad) {
          setActiveChatId(chatToLoad.id);
          setMessages(chatToLoad.messages);
        } else {
          // If the chat doesn't exist, redirect to the chat list
          navigate('/tools/chat');
        }
      }
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error('Error loading chats:', error);
      }
      console.error('Error loading chats:', error);
    }
  }, [currentUser, chatId, navigate]);
  
  // Handle creating a new chat
  const handleNewChat = async (assistantId?: string | null, assistantName?: string) => {
    // Create initial message if using an assistant
    const initialMessages: ExtendedChatMessage[] = [];
    
    if (assistantId && assistantName) {
      // Add a system message with the assistant's instructions
      const currentAssistant = assistants.find(a => a.id === assistantId);
      if (currentAssistant) {
        initialMessages.push({
          id: `msg-system-${Date.now()}`,
          role: 'system',
          content: currentAssistant.instructions,
          timestamp: new Date(),
        });
      }
      setSelectedAssistantId(assistantId);
    } else {
      setSelectedAssistantId(null);
    }
    
    setMessages(initialMessages);
    setActiveChatId(null); // Clear active chat ID to start a new chat
    setInputMessage(''); // Clear input message
    setUploadedFiles([]); // Clear any uploaded files
    
    // Save new chat to database
    if (currentUser) {
      try {
        const newChat = await saveChat(currentUser.id, {
          id: '', // New chat, no ID yet
          title: assistantName || 'New Chat',
          messages: serializeMessages(initialMessages),
          last_updated: new Date(),
          assistant_id: assistantId || undefined,
          assistant_name: assistantName,
        });
        
        // Update UI with new chat
        const updatedChat = {
          ...newChat,
          last_updated: new Date(newChat.last_updated)
        };
        setChats(prev => [updatedChat as Chat, ...prev]);
        setActiveChatId(newChat.id);
        console.log(`✅ New chat created with ID: ${newChat.id}`);
      } catch (error) {
        console.error('Error creating new chat:', error);
        console.error('Error creating new chat:', error);
      }
    }
    
    // Focus the input
    setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
  };
  
  // Handle selecting an existing chat
  const handleSelectChat = (chatId: string) => {
    const selectedChat = chats.find(chat => chat.id === chatId);
    if (selectedChat) {
      setMessages(selectedChat.messages);
      setActiveChatId(chatId);
      setSelectedAssistantId(selectedChat.assistant_id || null);
      setShowHistoryPanel(false);
      setInputMessage(''); // Clear input message
      setUploadedFiles([]); // Clear any uploaded files
    }
  };
  
  // Handle deleting a chat
  const handleDeleteChat = async (chatId: string) => {
    try {
      if (!currentUser) return;
      // Delete from database
      await deleteChat(chatId, currentUser.id);
      
      // Update UI
      setChats(prev => prev.filter(chat => chat.id !== chatId));
      
      // If the active chat was deleted, select another one
      if (activeChatId === chatId) {
        const remainingChats = chats.filter(chat => chat.id !== chatId);
        if (remainingChats.length > 0) {
          handleSelectChat(remainingChats[0].id);
        } else {
          setMessages([]);
          setActiveChatId(null);
          setSelectedAssistantId(null);
        }
      }
      
      toast.success('Chat deleted successfully');
    } catch (error) {
      console.error('Error deleting chat:', error);
      console.error('Error deleting chat:', error);
    } finally {
      setShowDeleteModal(null);
    }
  };
  
  // Handle stopping generation
  const handleStopGeneration = () => {
    setIsGenerating(false);
    setIsSubmitting(false);
    console.log('⚠️ Stopping AI generation');
    toast.info('Generation stopped');
  };
  
  // Define the structure of message attachments
  interface MessageAttachment {
    id: string;
    name: string;
    type: string;
    size: number;
    url?: string;
  }
  
  // Handle file upload processing
  const processUploadedFiles = (files: UploadedFile[]): {
    attachments: MessageAttachment[],
    fileDescriptions: string
  } => {
    // Create attachment objects for the message
    const attachments: MessageAttachment[] = files.map(file => ({
      id: file.id,
      name: file.file.name,
      type: file.file.type || (file.type === 'pdf' ? 'application/pdf' : file.type === 'csv' ? 'text/csv' : 'application/octet-stream'),
      size: file.file.size,
      url: file.preview
    }));

    // Create file descriptions to include in the prompt
    const fileDescriptions = files.length > 0
      ? files.map(file => {
          const fileType = file.type === 'image' ? 'Image' :
                          file.type === 'pdf' ? 'PDF' :
                          file.type === 'csv' ? 'CSV Spreadsheet' :
                          file.type === 'code' ? 'Code file' : 'File';
          return `- ${fileType}: "${file.file.name}" (${(file.file.size / (1024 * 1024)).toFixed(2)} MB)`;
        }).join('\n')
      : '';

    return { attachments, fileDescriptions };
  };
  
  // Handle sending a message
  const handleSendMessage = async () => {
    if (!inputMessage.trim() && uploadedFiles.length === 0) return;
    
    // Process uploaded files
    const { attachments, fileDescriptions } = processUploadedFiles(uploadedFiles);
    
    // Create message content based on text and/or files
    const messageContent = inputMessage.trim() 
      ? (fileDescriptions ? `${inputMessage}\n\nAttached files:\n${fileDescriptions}` : inputMessage) 
      : (fileDescriptions ? `I've uploaded the following files:\n${fileDescriptions}` : 'Attached file(s)');
    
    // Add user message to state
    const userMessage: ExtendedChatMessage = {
      id: `msg-${uuidv4()}`,
      role: 'user',
      content: messageContent,
      timestamp: new Date(),
      attachments: attachments.length > 0 ? attachments : undefined
    };
    
    // Create a new title from the first message if this is a new chat
    let chatTitle = '';
    if (!activeChatId && chats.length === 0) {
      chatTitle = generateChatTitle(inputMessage || 'File upload');
    }
    
    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setUploadedFiles([]);
    setIsSubmitting(true);
    setIsGenerating(true);
    
    try {
      const isUsingMockAPI = import.meta.env.VITE_ENABLE_MOCK_MODE === 'true';
      
      if (isUsingMockAPI) {
        console.log('⚠️ Using mock OpenAI API - in production, real API calls will be made');
      } else {
        console.log(`🚀 Sending message to real OpenAI API using model: ${selectedModel}`);
      }
      
      // Format messages for OpenAI (including system message if present)
      // Prepare messages for OpenAI API
      const messagesForOpenAI = messages.map((m: ChatMessage) => ({
        role: m.role as 'user' | 'assistant' | 'system',
        content: m.content
      }));
      
      // Add user message to the messages
      messagesForOpenAI.push({
        role: 'user' as const,
        content: userMessage.content,
      });
      
      console.log(`🔄 Sending ${messagesForOpenAI.length} messages to OpenAI`);
      
      // Create a placeholder for the assistant's message with empty content
      const assistantMessageId = `msg-${uuidv4()}`;
      const assistantMessage: ExtendedChatMessage = {
        id: assistantMessageId,
        role: 'assistant',
        content: '',
        timestamp: new Date(),
      };
      
      // Add empty message to state so we can stream into it
      setMessages(prev => [...prev, assistantMessage]);
      
      // Stream the response from OpenAI
      console.log('🔄 Starting streaming response from OpenAI');
      
      // Helper to update the assistant message content as chunks arrive
      const updateAssistantMessage = (content: string) => {
        setMessages(prev => {
          return prev.map(msg => {
            if (msg.id === assistantMessageId) {
              return { ...msg, content: msg.content + content };
            }
            return msg;
          });
        });
      };
      
      try {
        // Use streaming service to get response chunks
        await streamChatCompletion(
          { 
            model: selectedModel, 
            messages: messagesForOpenAI, 
            max_tokens: 1000, 
            temperature: 0.7 
          },
          // Process each chunk as it arrives
          (chunk) => {
            updateAssistantMessage(chunk);
          },
          // When streaming is done
          () => {
            console.log('✅ Completed streaming response from OpenAI');
          },
          // On error
          (error) => {
            console.error('Error during streaming:', error);
            toast.error('Error receiving response. Please try again.');
          }
        );
        
        // Get the final content after streaming
        let finalContent = '';
        setMessages(prev => {
          const assistantMsg = prev.find(msg => msg.id === assistantMessageId);
          finalContent = assistantMsg?.content || '';
          return prev;
        });
        
        // If user only uploaded files without a message, make the response focused on the files
        if (attachments.length > 0 && !inputMessage.trim() && !finalContent.includes("I've received your file") && !finalContent.includes("I've received your uploaded file")) {
          const updatedContent = `I've received your uploaded file${attachments.length > 1 ? 's' : ''}. ${finalContent}`;
          updateAssistantMessage(updatedContent.replace(finalContent, ''));
          finalContent = updatedContent;
        }
        
        // Save chat to database
        if (currentUser) {
          try {
            // Get current messages including the updated assistant message
            const currentMessages: ExtendedChatMessage[] = [];
            setMessages(prev => {
              currentMessages.push(...prev); // Copy all current messages
              return prev; // Don't actually update state here
            });
            
            // If no active chat, create a new one
            // Otherwise update the existing one
            const updatedChat = await saveChat(currentUser.id, {
              id: activeChatId || '',
              title: chatTitle || (chats.find(c => c.id === activeChatId)?.title || 'New Chat'),
              messages: serializeMessages(currentMessages),
              last_updated: new Date(),
              assistant_id: selectedAssistantId || undefined,
              assistant_name: selectedAssistantId ? assistants.find(a => a.id === selectedAssistantId)?.name : undefined,
            });
            
            // If this was a new chat, set the active chat ID and update chats list
            if (!activeChatId) {
              setActiveChatId(updatedChat.id);
              setChats(prev => [updatedChat as Chat, ...prev]);
            } else {
              // Update the existing chat in the chats list
              setChats(prev => 
                prev.map(chat => 
                  chat.id === activeChatId 
                    ? { 
                        ...chat, 
                        messages: serializeMessages(currentMessages), 
                        last_updated: new Date() 
                      } 
                    : chat
                )
              );
            }
          } catch (error) {
            console.error('Error saving chat:', error);
            toast.error('Failed to save chat. Please try again.');
          }
        }
      } catch (error) {
        console.error('Error sending message:', error);
        toast.error('Error communicating with AI. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
      setIsGenerating(false);
    }
  };
  
  // Export chat as JSON
  const exportChat = () => {
    const chat = chats.find(c => c.id === activeChatId);
    if (!chat) return;
    
    const chatData = {
      title: chat.title,
      messages: chat.messages
        .filter(m => m.role !== 'system') // Don't include system messages
        .map(m => ({
          role: m.role,
          content: m.content,
          timestamp: m.timestamp,
          attachments: (m as ExtendedChatMessage).attachments
        })),
      exportedAt: new Date().toISOString()
    };
    
    const dataStr = JSON.stringify(chatData, null, 2);
    const dataUri = `data:application/json;charset=utf-8,${encodeURIComponent(dataStr)}`;
    
    const exportFileDefaultName = `${chat.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_${format(new Date(), 'yyyyMMdd_HHmmss')}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    
    toast.success('Chat exported successfully');
  };
  
  // Share chat (in a real app, this would generate a shareable link)
  const shareChat = () => {
    toast.success('Sharing link generated and copied to clipboard');
  };
  
  // Handle selecting a prompt template
  function handleSelectPrompt(template: string) {
    setInputMessage(template);
  }
  
  // Handle changing the assistant
  function handleAssistantChange(assistantId: string | null) {
    setSelectedAssistantId(assistantId);
    
    // If changing assistant in an existing chat, create a new chat
    if (activeChatId) {
      if (assistantId) {
        const selectedAssistant = assistants.find(a => a.id === assistantId);
        if (selectedAssistant) {
          handleNewChat(assistantId, selectedAssistant.name);
        }
      } else {
        handleNewChat();
      }
    } else {
      // If starting a new chat, update the assistant
      if (assistantId) {
        const selectedAssistant = assistants.find(a => a.id === assistantId);
        if (selectedAssistant) {
          // Add a system message with the assistant's instructions
          const initialMessages: ExtendedChatMessage[] = [
            {
              id: `msg-system-${Date.now()}`,
              role: 'system',
              content: selectedAssistant.instructions,
              timestamp: new Date(),
            }
          ];
          setMessages(initialMessages);
        }
      } else {
        // Clear any system messages if no assistant
        setMessages([]);
      }
    }
  }
  
  // Serialize messages to JSON
  const serializeMessages = (messages: ChatMessage[]): any => {
    return JSON.stringify(messages);
  };

  return (
    <div className="h-[calc(100vh-12rem)] flex flex-col">
      {/* Chat header with model selector and other options */}
      <div className="border-b border-gray-200 dark:border-gray-800 p-3 flex items-center justify-between bg-white dark:bg-gray-900 rounded-t-xl">
        <div className="flex items-center space-x-2">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setShowHistoryPanel(true)}
            className="md:hidden"
          >
            <History className="h-5 w-5" />
          </Button>
          
          <ModelSelector 
            selectedModel={selectedModel}
            onModelChange={setSelectedModel}
            className="hidden md:block"
          />
          
          <AssistantSelector 
            selectedAssistantId={selectedAssistantId}
            onAssistantChange={handleAssistantChange}
            className="hidden md:block"
          />
        </div>
        
        <div className="flex items-center space-x-1.5">
          <PromptTemplateDropdown 
            onSelectTemplate={handleSelectPrompt}
            className="hidden md:block"
          />
          
          <ChatSettings 
            settings={chatSettings}
            onChange={setChatSettings}
          />
          
          <button
            onClick={() => setShowHistoryPanel(true)}
            className="hidden md:flex items-center justify-center rounded-lg border border-gray-300 dark:border-gray-700 p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            <Archive className="h-5 w-5" />
          </button>
          
          <div className="relative">
            <button
              onClick={() => setShowChatMenu(!showChatMenu)}
              className="flex items-center justify-center rounded-lg border border-gray-300 dark:border-gray-700 p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              aria-label="Chat menu"
            >
              <MoreVertical className="h-5 w-5" />
            </button>
            
            <AnimatePresence>
              {showChatMenu && (
                <>
                  {/* Backdrop */}
                  <div 
                    className="fixed inset-0 z-10"
                    onClick={() => setShowChatMenu(false)}
                  />
                  
                  {/* Dropdown menu */}
                  <motion.div
                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className="absolute right-0 top-full mt-2 w-48 rounded-lg shadow-lg z-20 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 py-1"
                  >
                    <button
                      className="flex w-full items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                      onClick={() => {
                        setShowChatMenu(false);
                        handleNewChat();
                      }}
                    >
                      <PlusCircle className="h-4 w-4 mr-3 text-gray-500 dark:text-gray-400" />
                      New Chat
                    </button>
                    
                    <button
                      className="flex w-full items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 md:hidden"
                      onClick={() => {
                        setShowChatMenu(false);
                        setSelectedModel('gpt-4');
                      }}
                    >
                      <Sparkles className="h-4 w-4 mr-3 text-gray-500 dark:text-gray-400" />
                      Change Model
                    </button>
                    
                    <button
                      className="flex w-full items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                      onClick={() => {
                        setShowChatMenu(false);
                        exportChat();
                      }}
                      disabled={!activeChatId}
                    >
                      <Download className="h-4 w-4 mr-3 text-gray-500 dark:text-gray-400" />
                      Export Chat
                    </button>
                    
                    <button
                      className="flex w-full items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                      onClick={() => {
                        setShowChatMenu(false);
                        shareChat();
                      }}
                      disabled={!activeChatId}
                    >
                      <Share className="h-4 w-4 mr-3 text-gray-500 dark:text-gray-400" />
                      Share Chat
                    </button>
                    
                    {activeChatId && (
                      <button
                        className="flex w-full items-center px-4 py-2 text-sm text-error-600 dark:text-error-400 hover:bg-gray-100 dark:hover:bg-gray-800"
                        onClick={() => {
                          setShowChatMenu(false);
                          setShowDeleteModal(activeChatId);
                        }}
                      >
                        <Trash2 className="h-4 w-4 mr-3 text-error-600 dark:text-error-400" />
                        Delete Chat
                      </button>
                    )}
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
      
      {/* Main chat content area */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 bg-gray-50 dark:bg-gray-950">
        {messages.length === 0 ? (
          <EmptyState 
            icon={<Sparkles className="h-8 w-8 text-primary-500" />}
            title={selectedAssistantId ? `Chat with ${assistants.find(a => a.id === selectedAssistantId)?.name}` : "Start a new conversation"}
            description={
              selectedAssistantId 
                ? `This assistant is designed to ${assistants.find(a => a.id === selectedAssistantId)?.description.toLowerCase() || 'help you with various tasks'}`
                : "Type a message or upload files to start chatting with the AI assistant"
            }
          />
        ) : (
          <>
            {messages.filter(message => message.role !== 'system').map((message) => (
              <div 
                key={message.id} 
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className={`flex max-w-[85%] md:max-w-2xl ${message.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
                >
                  <div className={`flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center ${
                    message.role === 'user' 
                      ? 'bg-primary-500 text-white ml-2' 
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 mr-2'
                  }`}>
                    {message.role === 'user' ? (
                      <div className="text-sm font-semibold">
                        {currentUser?.user_metadata?.display_name?.[0] || currentUser?.email?.[0] || 'U'}
                      </div>
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
                    
                    {/* Display file attachments if present */}
                    {message.attachments && message.attachments.length > 0 && (
                      <MessageAttachments 
                        attachments={message.attachments}
                        isUserMessage={message.role === 'user'} 
                      />
                    )}
                    
                    <div className={`mt-1 text-xs ${
                      message.role === 'user' ? 'text-primary-100' : 'text-gray-500 dark:text-gray-400'
                    }`}>
                      {message.timestamp instanceof Date 
                        ? format(message.timestamp, 'h:mm a') 
                        : format(new Date(message.timestamp), 'h:mm a')}
                    </div>
                  </div>
                </motion.div>
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
            
            {/* Stop generation button */}
            {isGenerating && (
              <div className="flex justify-center">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleStopGeneration}
                  className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-sm"
                >
                  <StopCircle className="h-4 w-4 text-error-600 dark:text-error-400 mr-2" />
                  Stop generating
                </Button>
              </div>
            )}
          </>
        )}
      </div>
      
      {/* Input area with tools */}
      <div className="border-t border-gray-200 dark:border-gray-800 p-3 bg-white dark:bg-gray-900">
        <ChatInputBox 
          inputMessage={inputMessage}
          setInputMessage={setInputMessage}
          onSendMessage={handleSendMessage}
          isSubmitting={isSubmitting}
        />
      </div>
      
      {/* Chat history panel */}
      <ChatHistoryPanel
        isOpen={showHistoryPanel}
        onClose={() => setShowHistoryPanel(false)}
        chats={chats.map(chat => ({
          id: chat.id,
          title: chat.title,
          lastUpdated: chat.last_updated instanceof Date ? chat.last_updated : new Date(chat.last_updated),
          assistantId: chat.assistant_id || undefined,
          assistantName: chat.assistant_name || undefined
        }))}
        onSelectChat={handleSelectChat}
        onNewChat={() => handleNewChat()}
        onDeleteChat={(chatId) => setShowDeleteModal(chatId)}
        activeChatId={activeChatId}
      />
      
      {/* Delete confirmation modal */}
      <AnimatePresence>
        {showDeleteModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="bg-white dark:bg-gray-900 rounded-xl p-6 w-full max-w-md"
            >
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Delete Chat</h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Are you sure you want to delete this chat? This action cannot be undone.
              </p>
              <div className="flex justify-end space-x-3">
                <Button variant="outline" onClick={() => setShowDeleteModal(null)}>
                  Cancel
                </Button>
                <Button 
                  variant="destructive" 
                  onClick={() => showDeleteModal && handleDeleteChat(showDeleteModal)}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ChatPage;