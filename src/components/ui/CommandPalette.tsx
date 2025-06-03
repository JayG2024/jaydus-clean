import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, 
  MessageSquare, 
  Image as ImageIcon, 
  Mic, 
  Bot, 
  Users, 
  Settings, 
  User, 
  LayoutDashboard,
  CreditCard,
  Command,
  ArrowRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Command {
  id: string;
  name: string;
  shortcut?: string[];
  icon: React.ReactNode;
  action: () => void;
  section: string;
}

export const CommandPalette: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [commandGroups, setCommandGroups] = useState<Record<string, Command[]>>({});
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const commandPaletteRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  
  // Define all commands
  useEffect(() => {
    const commands: Command[] = [
      {
        id: 'goto-dashboard',
        name: 'Go to Dashboard',
        icon: <LayoutDashboard className="h-5 w-5" />,
        action: () => { navigate('/dashboard'); setIsOpen(false); },
        section: 'Navigation'
      },
      {
        id: 'goto-chat',
        name: 'New Chat',
        shortcut: ['g', 'c'],
        icon: <MessageSquare className="h-5 w-5" />,
        action: () => { navigate('/chat'); setIsOpen(false); },
        section: 'AI Tools'
      },
      {
        id: 'goto-images',
        name: 'Generate Image',
        shortcut: ['g', 'i'],
        icon: <ImageIcon className="h-5 w-5" />,
        action: () => { navigate('/images'); setIsOpen(false); },
        section: 'AI Tools'
      },
      {
        id: 'goto-voice',
        name: 'Voice Generator',
        icon: <Mic className="h-5 w-5" />,
        action: () => { navigate('/voice'); setIsOpen(false); },
        section: 'AI Tools'
      },
      {
        id: 'goto-assistants',
        name: 'AI Assistants',
        icon: <Bot className="h-5 w-5" />,
        action: () => { navigate('/assistants'); setIsOpen(false); },
        section: 'AI Tools'
      },
      {
        id: 'goto-team',
        name: 'Team Management',
        icon: <Users className="h-5 w-5" />,
        action: () => { navigate('/team'); setIsOpen(false); },
        section: 'Management'
      },
      {
        id: 'goto-profile',
        name: 'View Profile',
        icon: <User className="h-5 w-5" />,
        action: () => { navigate('/profile'); setIsOpen(false); },
        section: 'Management'
      },
      {
        id: 'goto-settings',
        name: 'Settings',
        shortcut: ['g', 's'],
        icon: <Settings className="h-5 w-5" />,
        action: () => { navigate('/settings'); setIsOpen(false); },
        section: 'Management'
      },
      {
        id: 'goto-upgrade',
        name: 'Upgrade Plan',
        icon: <CreditCard className="h-5 w-5" />,
        action: () => { navigate('/upgrade'); setIsOpen(false); },
        section: 'Management'
      },
      {
        id: 'toggle-theme',
        name: 'Toggle Dark Mode',
        shortcut: ['ctrl', 'd'],
        icon: <div className="h-5 w-5 bg-gray-800 dark:bg-gray-200 rounded-full"></div>,
        action: () => {
          document.documentElement.classList.toggle('dark');
          localStorage.theme = document.documentElement.classList.contains('dark') ? 'dark' : 'light';
          setIsOpen(false);
        },
        section: 'Preferences'
      }
    ];

    // Group commands by section
    const groups: Record<string, Command[]> = {};
    commands.forEach(command => {
      if (!groups[command.section]) {
        groups[command.section] = [];
      }
      groups[command.section].push(command);
    });
    
    setCommandGroups(groups);
  }, [navigate]);

  // Filter commands based on search query
  const filteredGroups = searchQuery.length > 0
    ? Object.entries(commandGroups).reduce((acc, [section, commands]) => {
        const filtered = commands.filter(command => 
          command.name.toLowerCase().includes(searchQuery.toLowerCase())
        );
        if (filtered.length > 0) {
          acc[section] = filtered;
        }
        return acc;
      }, {} as Record<string, Command[]>)
    : commandGroups;

  // Flatten commands for keyboard navigation
  const allFilteredCommands = Object.values(filteredGroups).flat();

  // Reset active index when filtered commands change
  useEffect(() => {
    setActiveIndex(0);
  }, [searchQuery]);

  // Keyboard shortcut to open command palette (Cmd+K or Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
        event.preventDefault();
        setIsOpen(prev => !prev);
      }
      
      if (isOpen) {
        // Escape to close
        if (event.key === 'Escape') {
          setIsOpen(false);
        }
        
        // Arrow navigation
        if (event.key === 'ArrowDown') {
          setActiveIndex(prev => (prev + 1) % allFilteredCommands.length);
        }
        if (event.key === 'ArrowUp') {
          setActiveIndex(prev => (prev - 1 + allFilteredCommands.length) % allFilteredCommands.length);
        }
        
        // Enter to execute
        if (event.key === 'Enter' && allFilteredCommands.length > 0) {
          allFilteredCommands[activeIndex].action();
        }
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, allFilteredCommands, activeIndex]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
    }
  }, [isOpen]);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (commandPaletteRef.current && !commandPaletteRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  if (!isOpen) {
    return (
      <button
        className="fixed bottom-6 right-6 bg-primary-600 text-white p-3 rounded-full shadow-lg hover:bg-primary-700 transition-colors z-50"
        onClick={() => setIsOpen(true)}
        title="Command Palette (Ctrl+K)"
      >
        <Command className="h-5 w-5" />
      </button>
    );
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-start justify-center pt-[20vh]">
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            ref={commandPaletteRef}
            className="bg-white dark:bg-gray-900 w-full max-w-xl rounded-xl shadow-2xl border border-gray-200 dark:border-gray-800 overflow-hidden"
          >
            <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex items-center">
              <Search className="h-5 w-5 text-gray-500 dark:text-gray-400 mr-2" />
              <input
                ref={inputRef}
                type="text"
                placeholder="Search commands..."
                className="flex-1 outline-none bg-transparent placeholder-gray-500 text-gray-900 dark:text-gray-100"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                <span className="inline-block px-1.5 py-0.5 rounded border border-gray-300 dark:border-gray-700">esc</span>
                <span>to close</span>
              </div>
            </div>
            
            <div className="max-h-80 overflow-y-auto p-2">
              {Object.keys(filteredGroups).length === 0 ? (
                <div className="py-6 text-center">
                  <Search className="h-8 w-8 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-500 dark:text-gray-400">No commands found</p>
                </div>
              ) : (
                Object.entries(filteredGroups).map(([section, commands]) => (
                  <div key={section} className="mb-3">
                    <div className="text-xs font-medium text-gray-500 dark:text-gray-400 px-2 py-1">
                      {section}
                    </div>
                    <ul>
                      {commands.map((command, index) => {
                        // Calculate if this command is active based on its position in the flattened list
                        const isActive = allFilteredCommands.indexOf(command) === activeIndex;
                        
                        return (
                          <li 
                            key={command.id}
                            onClick={command.action}
                            onMouseEnter={() => setActiveIndex(allFilteredCommands.indexOf(command))}
                            className={`px-3 py-2 cursor-pointer rounded-md flex items-center justify-between group ${
                              isActive ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400' : 
                              'hover:bg-gray-50 dark:hover:bg-gray-800'
                            }`}
                          >
                            <div className="flex items-center">
                              <div className={`h-8 w-8 rounded-md flex items-center justify-center mr-3 ${
                                isActive ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-600' : 
                                'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                              }`}>
                                {command.icon}
                              </div>
                              <span>{command.name}</span>
                            </div>
                            
                            {(command.shortcut || isActive) && (
                              <div className="flex items-center">
                                {command.shortcut && (
                                  <div className="hidden md:flex items-center gap-1">
                                    {command.shortcut.map((key, i) => (
                                      <React.Fragment key={i}>
                                        <kbd className="px-1.5 py-0.5 rounded text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border border-gray-300 dark:border-gray-700">
                                          {key}
                                        </kbd>
                                        {i < command.shortcut!.length - 1 && <span>+</span>}
                                      </React.Fragment>
                                    ))}
                                  </div>
                                )}
                                {isActive && (
                                  <ArrowRight className="h-4 w-4 ml-2 text-primary-600 dark:text-primary-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                                )}
                              </div>
                            )}
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                ))
              )}
            </div>
            
            <div className="p-3 border-t border-gray-200 dark:border-gray-800 text-xs text-gray-500 dark:text-gray-400 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div>
                  <span className="inline-block px-1.5 py-0.5 rounded border border-gray-300 dark:border-gray-700 mr-1">↑</span>
                  <span className="inline-block px-1.5 py-0.5 rounded border border-gray-300 dark:border-gray-700">↓</span> to navigate
                </div>
                <div>
                  <span className="inline-block px-1.5 py-0.5 rounded border border-gray-300 dark:border-gray-700">enter</span> to select
                </div>
              </div>
              <div>
                <span className="text-xs">Tip: Press <kbd className="px-1.5 py-0.5 rounded border border-gray-300 dark:border-gray-700">Ctrl</kbd>+<kbd className="px-1.5 py-0.5 rounded border border-gray-300 dark:border-gray-700">K</kbd> to open</span>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};