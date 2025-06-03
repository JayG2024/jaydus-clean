import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, ChevronDown, User, LogOut, Settings, BrainCircuit, Bell, Search, Sun, Moon } from 'lucide-react';
import { useAuth } from '../../context/SupabaseAuthContext';
import { useTheme } from '../../context/ThemeContext';
import { Button } from '../ui/Button';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

type NavItem = {
  label: string;
  href: string;
};

const Navbar: React.FC = () => {
  const { currentUser, logout, userData } = useAuth();
  const { mode, setMode, isDark } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const location = useLocation();
  const navigate = useNavigate();
  
  const toggleMenu = () => setIsOpen(!isOpen);
  const toggleUserMenu = () => setShowUserMenu(!showUserMenu);
  
  const navItems: NavItem[] = [
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Chat', href: '/chat' },
    { label: 'Images', href: '/images' },
    { label: 'Voice', href: '/voice' },
    { label: 'Team', href: '/team' },
  ];
  
  const handleLogout = async () => {
    try {
      await logout();
      setShowUserMenu(false);
      navigate('/');
      toast.success('Logged out successfully');
    } catch (error) {
      console.error('Failed to log out', error);
      toast.error('Failed to log out');
    }
  };

  const toggleDarkMode = () => {
    setMode(isDark ? 'light' : 'dark');
  };

  // Handle scroll effect for navbar
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 10) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Mock notifications
  const notifications = [
    { id: 1, title: 'New feature available', message: 'Try our new voice generation feature!', time: '2 min ago', read: false },
    { id: 2, title: 'Welcome to Jaydus', message: 'Get started with our AI tools', time: '2 hours ago', read: true },
    { id: 3, title: '50% more credits', message: 'We\'ve added bonus credits to your account', time: 'Yesterday', read: true }
  ];
  
  return (
    <header className={`sticky top-0 z-40 w-full border-b border-gray-200 dark:border-gray-800 backdrop-blur-lg transition-all ${
      scrolled ? 'bg-white/80 dark:bg-gray-900/80' : 'bg-white dark:bg-gray-900'
    }`}>
      <div className="container mx-auto px-4 sm:px-6">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center">
            <Link to="/" className="flex items-center gap-2">
              <BrainCircuit className="h-8 w-8 text-primary-600" />
              <span className="text-xl font-bold text-gray-900 dark:text-white">Jaydus</span>
            </Link>
          </div>
          
          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center space-x-1">
            {currentUser && navItems.map((item) => (
              <Link
                key={item.href}
                to={item.href}
                className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                  location.pathname === item.href
                    ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>
          
          <div className="flex items-center gap-2">
            {/* Search button */}
            {currentUser && (
              <div className="relative hidden md:flex items-center">
                <div className="relative">
                  <input 
                    type="text" 
                    placeholder="Search..."
                    className="w-40 focus:w-60 py-1.5 pl-8 pr-4 rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 transition-all"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500 dark:text-gray-400" />
                </div>
              </div>
            )}

            {/* Dark mode toggle */}
            <button 
              onClick={toggleDarkMode}
              className="p-2 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 focus:outline-none"
              aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
            >
              {isDark ? (
                <Sun className="h-5 w-5" />
              ) : (
                <Moon className="h-5 w-5" />
              )}
            </button>

            {/* Notifications */}
            {currentUser && (
              <div className="relative">
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="p-2 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  <Bell className="h-5 w-5" />
                  <span className="absolute top-0.5 right-0.5 flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-primary-500"></span>
                  </span>
                </button>
                
                <AnimatePresence>
                  {showNotifications && (
                    <motion.div
                      initial={{ opacity: 0, y: -10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -10, scale: 0.95 }}
                      transition={{ duration: 0.2 }}
                      className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-900 rounded-lg shadow-lg ring-1 ring-black ring-opacity-5 z-10"
                    >
                      <div className="p-4 border-b border-gray-200 dark:border-gray-800">
                        <h3 className="font-medium text-gray-900 dark:text-white">Notifications</h3>
                      </div>
                      <div className="max-h-96 overflow-y-auto">
                        {notifications.length > 0 ? (
                          notifications.map((notification) => (
                            <div
                              key={notification.id}
                              className={`p-4 border-b border-gray-200 dark:border-gray-800 last:border-b-0 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 ${
                                !notification.read ? 'bg-primary-50 dark:bg-primary-900/20' : ''
                              }`}
                            >
                              <p className="text-sm font-medium text-gray-900 dark:text-white">
                                {notification.title}
                                {!notification.read && (
                                  <span className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800 dark:bg-primary-900/50 dark:text-primary-300">
                                    New
                                  </span>
                                )}
                              </p>
                              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                {notification.message}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                                {notification.time}
                              </p>
                            </div>
                          ))
                        ) : (
                          <div className="p-4 text-center">
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              No notifications yet
                            </p>
                          </div>
                        )}
                      </div>
                      <div className="p-2 border-t border-gray-200 dark:border-gray-800">
                        <button className="w-full px-4 py-2 text-sm text-center text-primary-600 dark:text-primary-400 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-md">
                          View all notifications
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
            
            {currentUser ? (
              <div className="relative">
                <button
                  onClick={toggleUserMenu}
                  className="flex items-center gap-2 rounded-full p-1 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-100 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400 overflow-hidden">
                    {currentUser.photoURL ? (
                      <img 
                        src={currentUser.photoURL} 
                        alt={currentUser.displayName || 'User'} 
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <span className="text-sm font-medium">
                        {currentUser.displayName?.[0] || currentUser.email?.[0] || 'U'}
                      </span>
                    )}
                  </div>
                  <span className="hidden md:block text-gray-700 dark:text-gray-200">
                    {userData?.subscription && userData.subscription !== 'free' && (
                      <span className="mr-2 inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800 dark:bg-primary-900/30 dark:text-primary-300 capitalize">
                        {userData.subscription}
                      </span>
                    )}
                    {currentUser.displayName || currentUser.email?.split('@')[0]}
                  </span>
                  <ChevronDown className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                </button>
                
                <AnimatePresence>
                  {showUserMenu && (
                    <motion.div
                      initial={{ opacity: 0, y: -10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -10, scale: 0.95 }}
                      transition={{ duration: 0.2 }}
                      className="absolute right-0 mt-2 w-56 origin-top-right rounded-lg bg-white dark:bg-gray-900 py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none"
                    >
                      <div className="border-b border-gray-200 dark:border-gray-800 pb-2 pt-1 px-4 mb-1">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {currentUser.displayName || currentUser.email?.split('@')[0]}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {currentUser.email}
                        </p>
                      </div>
                      <Link
                        to="/profile"
                        className="flex w-full items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                        onClick={() => setShowUserMenu(false)}
                      >
                        <User className="mr-2 h-4 w-4 text-gray-500 dark:text-gray-400" />
                        Profile
                      </Link>
                      <Link
                        to="/settings"
                        className="flex w-full items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                        onClick={() => setShowUserMenu(false)}
                      >
                        <Settings className="mr-2 h-4 w-4 text-gray-500 dark:text-gray-400" />
                        Settings
                      </Link>
                      <div className="border-t border-gray-200 dark:border-gray-800 mt-1 pt-1">
                        <button
                          onClick={handleLogout}
                          className="flex w-full items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                        >
                          <LogOut className="mr-2 h-4 w-4 text-gray-500 dark:text-gray-400" />
                          Logout
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Link to="/login">
                  <Button variant="ghost" size="default">
                    Log in
                  </Button>
                </Link>
                <Link to="/signup">
                  <Button variant="default" size="default">
                    Sign up
                  </Button>
                </Link>
              </div>
            )}
            
            {/* Mobile menu button */}
            <button
              onClick={toggleMenu}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-700 dark:text-gray-300 md:hidden hover:bg-gray-100 dark:hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-primary-500"
              aria-expanded={isOpen}
            >
              <span className="sr-only">{isOpen ? 'Close menu' : 'Open menu'}</span>
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>
      
      {/* Mobile menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="md:hidden border-t border-gray-200 dark:border-gray-800"
          >
            <div className="px-2 pt-2 pb-3 space-y-1">
              {/* Search on mobile */}
              <div className="p-2">
                <div className="relative">
                  <input 
                    type="text" 
                    placeholder="Search..."
                    className="w-full py-2 pl-10 pr-4 rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500 dark:text-gray-400" />
                </div>
              </div>

              {currentUser && navItems.map((item) => (
                <Link
                  key={item.href}
                  to={item.href}
                  className={`flex items-center px-3 py-2 rounded-md text-base font-medium ${
                    location.pathname === item.href
                      ? 'bg-primary-100 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`}
                  onClick={() => setIsOpen(false)}
                >
                  {item.label}
                </Link>
              ))}

              {/* Dark mode toggle on mobile */}
              <button 
                onClick={toggleDarkMode}
                className="flex w-full items-center px-3 py-2 rounded-md text-base font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                {isDark ? (
                  <>
                    <Sun className="mr-3 h-5 w-5 text-gray-500 dark:text-gray-400" />
                    Light Mode
                  </>
                ) : (
                  <>
                    <Moon className="mr-3 h-5 w-5 text-gray-500 dark:text-gray-400" />
                    Dark Mode
                  </>
                )}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};

export default Navbar;