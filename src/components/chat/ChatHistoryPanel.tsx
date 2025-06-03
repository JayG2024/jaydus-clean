import React, { useState } from 'react';
import { Search, Clock, Bot, PlusCircle, MoreVertical, Trash2, Download, X, MessageSquare } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { Button } from '../ui/Button';
import { formatDistanceToNow } from 'date-fns';

export interface ChatHistoryItem {
  id: string;
  title: string;
  lastUpdated: Date;
  assistantId?: string;
  assistantName?: string;
}

interface ChatHistoryPanelProps {
  isOpen: boolean;
  onClose: () => void;
  chats: ChatHistoryItem[];
  onSelectChat: (chatId: string) => void;
  onNewChat: () => void;
  onDeleteChat: (chatId: string) => void;
  activeChatId: string | null;
}

const ChatHistoryPanel: React.FC<ChatHistoryPanelProps> = ({
  isOpen,
  onClose,
  chats,
  onSelectChat,
  onNewChat,
  onDeleteChat,
  activeChatId
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [menuOpenForId, setMenuOpenForId] = useState<string | null>(null);
  
  // Filter chats based on search query
  const filteredChats = searchQuery
    ? chats.filter(chat => chat.title.toLowerCase().includes(searchQuery.toLowerCase()))
    : chats;

  // Format a date relative to now
  const formatDate = (date: Date) => {
    try {
      return formatDistanceToNow(date, { addSuffix: true });
    } catch (e) {
      return 'recently';
    }
  };
  
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ x: '-100%' }}
          animate={{ x: 0 }}
          exit={{ x: '-100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="fixed inset-0 z-40 md:z-20 md:inset-auto md:top-0 md:bottom-0 md:left-0 md:w-80 bg-white dark:bg-gray-900 md:border-r border-gray-200 dark:border-gray-800 shadow-xl md:shadow-none flex flex-col"
        >
          <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex justify-between items-center">
            <h2 className="text-lg font-medium text-gray-900 dark:text-white flex items-center">
              <Clock className="h-5 w-5 mr-2 text-primary-600" />
              Chat History
            </h2>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={onClose}
              aria-label="Close chat history"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
          
          <div className="p-4 border-b border-gray-200 dark:border-gray-800">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500 dark:text-gray-400" />
              <input
                type="text"
                placeholder="Search conversations..."
                className="w-full pl-9 pr-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 text-sm"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <Button 
              variant="outline" 
              className="w-full mt-3 justify-center"
              onClick={onNewChat}
            >
              <PlusCircle className="h-4 w-4 mr-2" />
              New Chat
            </Button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-2">
            {filteredChats.length === 0 ? (
              <div className="text-center py-8">
                {searchQuery ? (
                  <>
                    <p className="text-gray-500 dark:text-gray-400 text-sm mb-2">No matching conversations found</p>
                    <button
                      className="text-xs font-medium text-primary-600 dark:text-primary-400 hover:underline"
                      onClick={() => setSearchQuery('')}
                    >
                      Clear search
                    </button>
                  </>
                ) : (
                  <>
                    <MessageSquare className="h-10 w-10 mx-auto text-gray-400 dark:text-gray-600 mb-2" />
                    <p className="text-gray-500 dark:text-gray-400 text-sm mb-2">No conversations yet</p>
                    <button
                      className="text-xs font-medium text-primary-600 dark:text-primary-400 hover:underline inline-flex items-center"
                      onClick={onNewChat}
                    >
                      <PlusCircle className="h-3 w-3 mr-1" />
                      Start a new chat
                    </button>
                  </>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                {filteredChats.map((chat) => (
                  <div 
                    key={chat.id} 
                    className={`relative group p-3 rounded-lg cursor-pointer ${
                      activeChatId === chat.id 
                        ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400' 
                        : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-900 dark:text-gray-100'
                    }`}
                    onClick={() => onSelectChat(chat.id)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3 flex-1 min-w-0">
                        <div className={`flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center ${
                          chat.assistantId 
                            ? 'bg-secondary-100 dark:bg-secondary-900/30 text-secondary-600' 
                            : 'bg-primary-100 dark:bg-primary-900/30 text-primary-600'
                        }`}>
                          {chat.assistantId ? (
                            <Bot className="h-4 w-4" />
                          ) : (
                            <MessageSquare className="h-4 w-4" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-medium truncate">
                            {chat.title}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 flex items-center">
                            <Clock className="h-3 w-3 mr-1 inline" />
                            {formatDate(chat.lastUpdated)}
                            {chat.assistantName && (
                              <>
                                <span className="mx-1.5">•</span>
                                <Bot className="h-3 w-3 mr-1 inline" />
                                {chat.assistantName}
                              </>
                            )}
                          </p>
                        </div>
                      </div>
                      
                      <div className="relative">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setMenuOpenForId(menuOpenForId === chat.id ? null : chat.id);
                          }}
                          className={`p-1 rounded-md ${
                            menuOpenForId === chat.id 
                              ? 'text-gray-800 dark:text-gray-200 bg-gray-200 dark:bg-gray-700'
                              : 'text-gray-500 opacity-0 group-hover:opacity-100 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700'
                          }`}
                        >
                          <MoreVertical className="h-4 w-4" />
                        </button>
                        
                        {menuOpenForId === chat.id && (
                          <div className="absolute right-0 mt-1 w-48 rounded-md shadow-lg bg-white dark:bg-gray-900 ring-1 ring-black ring-opacity-5 z-10 border border-gray-200 dark:border-gray-700">
                            <div className="py-1" onClick={(e) => e.stopPropagation()}>
                              <button
                                className="flex w-full items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                              >
                                <Download className="h-4 w-4 mr-3 text-gray-500 dark:text-gray-400" />
                                Export Chat
                              </button>
                              <button
                                className="flex w-full items-center px-4 py-2 text-sm text-error-600 dark:text-error-400 hover:bg-gray-100 dark:hover:bg-gray-800"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setMenuOpenForId(null);
                                  onDeleteChat(chat.id);
                                }}
                              >
                                <Trash2 className="h-4 w-4 mr-3 text-error-600 dark:text-error-400" />
                                Delete Chat
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ChatHistoryPanel;