import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { saveAs } from 'file-saver';
import { 
  PaletteIcon, Moon, Sun, BellRing, Sliders, 
  Globe, KeyRound, Database, Download, PlugZap, Brush, 
  Copy, Shield, Trash2, CheckCircle, AlertCircle, Plus, 
  Monitor
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { useAuth } from "../../context/ClerkAuthContext";
import { useTheme } from '../../context/ThemeContext';
import { ApiKey, Integration } from "../../context/ClerkAuthContext";
import { AnimatePresence, motion } from 'framer-motion';

const SettingsPage: React.FC = () => {
  const { 
    getApiKeys, createApiKey, deleteApiKey, 
    getIntegrations, connectIntegration, disconnectIntegration,
    exportUserData
  } = useAuth();
  
  const { mode, setMode, colorScheme, setColorScheme, isDark } = useTheme();
  
  const [notifications, setNotifications] = useState({
    emailNotifications: true,
    appNotifications: true,
    marketingEmails: false,
  });
  
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [isLoadingApiKeys, setIsLoadingApiKeys] = useState(false);
  const [isLoadingIntegrations, setIsLoadingIntegrations] = useState(false);
  const [isCreatingApiKey, setIsCreatingApiKey] = useState(false);
  const [newApiKeyName, setNewApiKeyName] = useState('');
  const [showDeleteApiKeyModal, setShowDeleteApiKeyModal] = useState<string | null>(null);
  const [showCreateApiKeyModal, setShowCreateApiKeyModal] = useState(false);
  const [exportFormat, setExportFormat] = useState<'json' | 'csv'>('json');
  const [isExporting, setIsExporting] = useState(false);
  const [showConnectIntegrationModal, setShowConnectIntegrationModal] = useState(false);
  const [selectedIntegration, setSelectedIntegration] = useState('');
  const [integrationConfig, setIntegrationConfig] = useState('');
  
  // Color schemes with their UI colors
  const colorSchemes = [
    { id: 'blue', name: 'Blue', className: 'bg-blue-600' },
    { id: 'purple', name: 'Purple', className: 'bg-purple-600' },
    { id: 'green', name: 'Green', className: 'bg-green-600' },
    { id: 'orange', name: 'Orange', className: 'bg-orange-600' },
    { id: 'red', name: 'Red', className: 'bg-red-600' },
    { id: 'teal', name: 'Teal', className: 'bg-teal-600' },
    { id: 'pink', name: 'Pink', className: 'bg-pink-600' }
  ];
  
  // Load data on component mount
  useEffect(() => {
    loadApiKeys();
    loadIntegrations();
  }, []);
  
  const loadApiKeys = async () => {
    setIsLoadingApiKeys(true);
    try {
      const keys = await getApiKeys();
      setApiKeys(keys);
    } catch (error: any) {
      console.error('Error loading API keys:', error);
      toast.error('Failed to load API keys');
    } finally {
      setIsLoadingApiKeys(false);
    }
  };
  
  const loadIntegrations = async () => {
    setIsLoadingIntegrations(true);
    try {
      const ints = await getIntegrations();
      setIntegrations(ints);
    } catch (error: any) {
      console.error('Error loading integrations:', error);
      toast.error('Failed to load integrations');
    } finally {
      setIsLoadingIntegrations(false);
    }
  };
  
  const handleThemeChange = (newMode: 'light' | 'dark' | 'system') => {
    try {
      setMode(newMode);
      toast.success(`Theme changed to ${newMode}`);
    } catch (error) {
      console.error('Error changing theme:', error);
      toast.error('Failed to change theme');
    }
  };
  
  const handleColorSchemeChange = (newScheme: string) => {
    try {
      setColorScheme(newScheme as any);
      toast.success(`Color scheme changed to ${newScheme}`);
    } catch (error) {
      console.error('Error changing color scheme:', error);
      toast.error('Failed to change color scheme');
    }
  };
  
  const toggleNotification = (key: keyof typeof notifications) => {
    setNotifications({
      ...notifications,
      [key]: !notifications[key],
    });
    
    toast.success(`${key} ${!notifications[key] ? 'enabled' : 'disabled'}`);
  };
  
  const handleCreateApiKey = async () => {
    if (!newApiKeyName.trim()) {
      toast.error('Please provide a name for the API key');
      return;
    }
    
    setIsCreatingApiKey(true);
    try {
      const newKey = await createApiKey(newApiKeyName);
      setApiKeys(prev => [newKey, ...prev]);
      toast.success('API key created successfully');
      setShowCreateApiKeyModal(false);
      setNewApiKeyName('');
    } catch (error: any) {
      console.error('Error creating API key:', error);
      toast.error('Failed to create API key');
    } finally {
      setIsCreatingApiKey(false);
    }
  };
  
  const handleDeleteApiKey = async (id: string) => {
    try {
      await deleteApiKey(id);
      setApiKeys(prev => prev.filter(key => key.id !== id));
      toast.success('API key deleted successfully');
      setShowDeleteApiKeyModal(null);
    } catch (error: any) {
      console.error('Error deleting API key:', error);
      toast.error('Failed to delete API key');
    }
  };
  
  const handleCopyApiKey = (key: string) => {
    navigator.clipboard.writeText(key)
      .then(() => {
        toast.success('API key copied to clipboard');
      })
      .catch(() => {
        toast.error('Failed to copy API key');
      });
  };
  
  const handleConnectIntegration = async () => {
    if (!selectedIntegration) {
      toast.error('Please select an integration');
      return;
    }
    
    try {
      // Parse integration config if provided
      let config = {};
      if (integrationConfig.trim()) {
        try {
          config = JSON.parse(integrationConfig);
        } catch (e) {
          toast.error('Invalid configuration JSON');
          return;
        }
      }
      
      const integration = await connectIntegration(selectedIntegration, config);
      
      // Update the integrations list
      setIntegrations(prev => {
        const existingIndex = prev.findIndex(i => i.id === integration.id);
        if (existingIndex !== -1) {
          return prev.map(i => i.id === integration.id ? integration : i);
        } else {
          return [integration, ...prev];
        }
      });
      
      toast.success(`${selectedIntegration} connected successfully`);
      setShowConnectIntegrationModal(false);
      setSelectedIntegration('');
      setIntegrationConfig('');
    } catch (error: any) {
      console.error('Error connecting integration:', error);
      toast.error('Failed to connect integration');
    }
  };
  
  const handleDisconnectIntegration = async (id: string) => {
    try {
      await disconnectIntegration(id);
      
      // Update the integrations list
      setIntegrations(prev => prev.map(i => 
        i.id === id ? { ...i, status: 'disconnected' as const, connected_at: undefined } : i
      ));
      
      toast.success('Integration disconnected successfully');
    } catch (error: any) {
      console.error('Error disconnecting integration:', error);
      toast.error('Failed to disconnect integration');
    }
  };
  
  const handleExportData = async () => {
    setIsExporting(true);
    try {
      const blob = await exportUserData(exportFormat);
      saveAs(blob, `jaydus-data-export.${exportFormat}`);
      toast.success('Data exported successfully');
    } catch (error: any) {
      console.error('Error exporting data:', error);
      toast.error('Failed to export data');
    } finally {
      setIsExporting(false);
    }
  };
  
  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Settings</h1>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left sidebar - categories */}
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
            <div className="p-4">
              <nav className="space-y-1">
                <a 
                  href="#appearance" 
                  className="flex items-center px-3 py-2 text-sm font-medium rounded-lg bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400"
                >
                  <PaletteIcon className="h-5 w-5 mr-3" />
                  <span>Appearance</span>
                </a>
                <a 
                  href="#notifications" 
                  className="flex items-center px-3 py-2 text-sm font-medium rounded-lg text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  <BellRing className="h-5 w-5 mr-3 text-gray-500 dark:text-gray-400" />
                  <span>Notifications</span>
                </a>
                <a 
                  href="#preferences" 
                  className="flex items-center px-3 py-2 text-sm font-medium rounded-lg text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  <Sliders className="h-5 w-5 mr-3 text-gray-500 dark:text-gray-400" />
                  <span>Preferences</span>
                </a>
                <a 
                  href="#language" 
                  className="flex items-center px-3 py-2 text-sm font-medium rounded-lg text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  <Globe className="h-5 w-5 mr-3 text-gray-500 dark:text-gray-400" />
                  <span>Language & Region</span>
                </a>
                <a 
                  href="#apikeys" 
                  className="flex items-center px-3 py-2 text-sm font-medium rounded-lg text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  <KeyRound className="h-5 w-5 mr-3 text-gray-500 dark:text-gray-400" />
                  <span>API Keys</span>
                </a>
                <a 
                  href="#exportdata" 
                  className="flex items-center px-3 py-2 text-sm font-medium rounded-lg text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  <Download className="h-5 w-5 mr-3 text-gray-500 dark:text-gray-400" />
                  <span>Export Data</span>
                </a>
                <a 
                  href="#integrations" 
                  className="flex items-center px-3 py-2 text-sm font-medium rounded-lg text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  <PlugZap className="h-5 w-5 mr-3 text-gray-500 dark:text-gray-400" />
                  <span>Integrations</span>
                </a>
              </nav>
            </div>
          </div>
        </div>
        
        {/* Right side - settings content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Appearance */}
          <div id="appearance" className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
            <div className="p-6 border-b border-gray-200 dark:border-gray-800">
              <div className="flex items-center">
                <PaletteIcon className="h-5 w-5 text-primary-600 mr-2" />
                <h2 className="text-lg font-medium text-gray-900 dark:text-white">Appearance</h2>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Customize how the application looks.
              </p>
            </div>
            
            <div className="p-6 space-y-6">
              <div>
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Theme</h3>
                <div className="grid grid-cols-3 gap-3">
                  <button
                    onClick={() => handleThemeChange('light')}
                    className={`flex flex-col items-center p-3 rounded-lg border ${
                      mode === 'light' 
                        ? 'border-primary-600 bg-primary-50 dark:bg-primary-900/20' 
                        : 'border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800'
                    }`}
                    aria-label="Light theme"
                  >
                    <div className="h-10 w-10 rounded-full bg-white border border-gray-200 flex items-center justify-center mb-2">
                      <Sun className="h-5 w-5 text-yellow-500" />
                    </div>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">Light</span>
                  </button>
                  
                  <button
                    onClick={() => handleThemeChange('dark')}
                    className={`flex flex-col items-center p-3 rounded-lg border ${
                      mode === 'dark' 
                        ? 'border-primary-600 bg-primary-50 dark:bg-primary-900/20' 
                        : 'border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800'
                    }`}
                    aria-label="Dark theme"
                  >
                    <div className="h-10 w-10 rounded-full bg-gray-900 border border-gray-800 flex items-center justify-center mb-2">
                      <Moon className="h-5 w-5 text-gray-100" />
                    </div>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">Dark</span>
                  </button>
                  
                  <button
                    onClick={() => handleThemeChange('system')}
                    className={`flex flex-col items-center p-3 rounded-lg border ${
                      mode === 'system' 
                        ? 'border-primary-600 bg-primary-50 dark:bg-primary-900/20' 
                        : 'border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800'
                    }`}
                    aria-label="System theme"
                  >
                    <div className="h-10 w-10 rounded-full bg-gradient-to-r from-gray-100 to-gray-900 border border-gray-200 flex items-center justify-center mb-2">
                      <Monitor className="h-5 w-5 text-gray-700 dark:text-gray-300" />
                    </div>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">System</span>
                  </button>
                </div>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Color Scheme</h3>
                <div className="grid grid-cols-4 gap-4">
                  {colorSchemes.map(scheme => (
                    <button
                      key={scheme.id}
                      className="flex flex-col items-center"
                      onClick={() => handleColorSchemeChange(scheme.id)}
                      aria-label={`${scheme.name} color scheme`}
                    >
                      <div 
                        className={`color-indicator ${scheme.className} ${colorScheme === scheme.id ? 'selected' : ''}`}
                        aria-hidden="true"
                      />
                      <span className="text-xs mt-1 font-medium text-gray-600 dark:text-gray-400">
                        {scheme.name}
                      </span>
                    </button>
                  ))}
                </div>
                
                <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="flex items-start gap-2 mb-2">
                    <AlertCircle className="h-5 w-5 text-primary-600 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Your color scheme selection will apply across the entire application, affecting buttons, links, and accents.
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-3">
                    <div className="px-3 py-1.5 rounded-md bg-primary-600 text-white text-sm font-medium">
                      Primary Button
                    </div>
                    <div className="px-3 py-1.5 rounded-md bg-secondary-600 text-white text-sm font-medium">
                      Secondary Button
                    </div>
                    <div className="px-2 py-1 rounded-full bg-primary-100 text-primary-800 dark:bg-primary-900/30 dark:text-primary-300 text-xs font-medium">
                      Badge
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Notifications */}
          <div id="notifications" className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
            <div className="p-6 border-b border-gray-200 dark:border-gray-800">
              <div className="flex items-center">
                <BellRing className="h-5 w-5 text-primary-600 mr-2" />
                <h2 className="text-lg font-medium text-gray-900 dark:text-white">Notifications</h2>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Control when and how you receive notifications.
              </p>
            </div>
            
            <div className="p-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-medium text-gray-900 dark:text-white">Email Notifications</h3>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      Receive email notifications for important updates.
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="sr-only peer" 
                      checked={notifications.emailNotifications}
                      onChange={() => toggleNotification('emailNotifications')}
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:translate-x-[-100%] peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary-600"></div>
                  </label>
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-medium text-gray-900 dark:text-white">App Notifications</h3>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      Receive notifications within the app.
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="sr-only peer" 
                      checked={notifications.appNotifications}
                      onChange={() => toggleNotification('appNotifications')}
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:translate-x-[-100%] peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary-600"></div>
                  </label>
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-medium text-gray-900 dark:text-white">Marketing Emails</h3>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      Receive news, updates, and offers from us.
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="sr-only peer" 
                      checked={notifications.marketingEmails}
                      onChange={() => toggleNotification('marketingEmails')}
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:translate-x-[-100%] peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary-600"></div>
                  </label>
                </div>
              </div>
            </div>
          </div>
          
          {/* API Keys */}
          <div id="apikeys" className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
            <div className="p-6 border-b border-gray-200 dark:border-gray-800">
              <div className="flex items-center">
                <KeyRound className="h-5 w-5 text-primary-600 mr-2" />
                <h2 className="text-lg font-medium text-gray-900 dark:text-white">API Keys</h2>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Manage your API keys for third-party integrations.
              </p>
            </div>
            
            <div className="p-6">
              <div className="mb-6 flex justify-between items-center">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Your API keys give access to your account. Keep them secure.
                </p>
                <Button variant="outline" size="sm" onClick={() => setShowCreateApiKeyModal(true)}>
                  Create New Key
                </Button>
              </div>
              
              {isLoadingApiKeys ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                </div>
              ) : (
                <div className="space-y-4">
                  {apiKeys.length === 0 ? (
                    <div className="text-center py-8 border border-dashed border-gray-300 dark:border-gray-700 rounded-lg">
                      <KeyRound className="h-10 w-10 mx-auto text-gray-400 mb-2" />
                      <p className="text-gray-500 dark:text-gray-400">No API keys found</p>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="mt-4"
                        onClick={() => setShowCreateApiKeyModal(true)}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Create API Key
                      </Button>
                    </div>
                  ) : (
                    apiKeys.map((apiKey) => (
                      <div 
                        key={apiKey.id} 
                        className="border border-gray-200 dark:border-gray-800 rounded-lg p-4"
                      >
                        <div className="flex justify-between items-center mb-2">
                          <div className="flex items-center">
                            <Shield className="h-4 w-4 text-primary-600 mr-2" />
                            <h3 className="font-medium text-gray-900 dark:text-white">{apiKey.name}</h3>
                          </div>
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            Created on {new Date(apiKey.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="flex items-center bg-gray-50 dark:bg-gray-800 rounded-lg p-2 mb-3">
                          <span className="flex-1 font-mono text-sm text-gray-600 dark:text-gray-400">
                            {apiKey.key.slice(0, 10)}••••••••••••••••
                          </span>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleCopyApiKey(apiKey.key)}
                          >
                            <Copy className="h-4 w-4 mr-1" />
                            Copy
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="text-error-600 dark:text-error-400"
                            onClick={() => setShowDeleteApiKeyModal(apiKey.id)}
                          >
                            <Trash2 className="h-4 w-4 mr-1" />
                            Revoke
                          </Button>
                        </div>
                        {apiKey.last_used && (
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            Last used: {new Date(apiKey.last_used).toLocaleString()}
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>
          
          {/* Export Data */}
          <div id="exportdata" className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
            <div className="p-6 border-b border-gray-200 dark:border-gray-800">
              <div className="flex items-center">
                <Download className="h-5 w-5 text-primary-600 mr-2" />
                <h2 className="text-lg font-medium text-gray-900 dark:text-white">Export Data</h2>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Export your data in various formats.
              </p>
            </div>
            
            <div className="p-6">
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Export Options
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div 
                      className="border border-gray-200 dark:border-gray-800 rounded-lg p-4 text-center hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
                      onClick={handleExportData}
                    >
                      <Database className="h-8 w-8 text-primary-600 mx-auto mb-2" />
                      <h4 className="font-medium text-gray-900 dark:text-white mb-1">All Data</h4>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        Export all your data
                      </p>
                    </div>
                    <div className="border border-gray-200 dark:border-gray-800 rounded-lg p-4 text-center hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer">
                      <Image className="h-8 w-8 text-secondary-600 mx-auto mb-2" />
                      <h4 className="font-medium text-gray-900 dark:text-white mb-1">Generated Images</h4>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        Export only images
                      </p>
                    </div>
                    <div className="border border-gray-200 dark:border-gray-800 rounded-lg p-4 text-center hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer">
                      <MessageSquare className="h-8 w-8 text-accent-600 mx-auto mb-2" />
                      <h4 className="font-medium text-gray-900 dark:text-white mb-1">Chat History</h4>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        Export conversations
                      </p>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Export Format
                  </h3>
                  <div className="flex space-x-4">
                    <label className="flex items-center">
                      <input 
                        type="radio" 
                        name="format" 
                        className="h-4 w-4 text-primary-600" 
                        checked={exportFormat === 'json'}
                        onChange={() => setExportFormat('json')}
                      />
                      <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">JSON</span>
                    </label>
                    <label className="flex items-center">
                      <input 
                        type="radio" 
                        name="format" 
                        className="h-4 w-4 text-primary-600"
                        checked={exportFormat === 'csv'}
                        onChange={() => setExportFormat('csv')}
                      />
                      <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">CSV</span>
                    </label>
                  </div>
                </div>
                
                <Button
                  onClick={handleExportData}
                  isLoading={isExporting}
                  disabled={isExporting}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export Data
                </Button>
              </div>
            </div>
          </div>
          
          {/* Integrations */}
          <div id="integrations" className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
            <div className="p-6 border-b border-gray-200 dark:border-gray-800">
              <div className="flex items-center">
                <PlugZap className="h-5 w-5 text-primary-600 mr-2" />
                <h2 className="text-lg font-medium text-gray-900 dark:text-white">Integrations</h2>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Connect with your favorite tools and services.
              </p>
            </div>
            
            <div className="p-6">
              <div className="mb-4 flex justify-between items-center">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Integrations allow Jaydus to connect with other services.
                </p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setShowConnectIntegrationModal(true)}
                >
                  Add Integration
                </Button>
              </div>
              
              {isLoadingIntegrations ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                </div>
              ) : (
                <div className="space-y-4">
                  {integrations.map((integration) => (
                    <div 
                      key={integration.id}
                      className="flex justify-between items-center p-4 border border-gray-200 dark:border-gray-800 rounded-lg"
                    >
                      <div className="flex items-center">
                        <div className="h-10 w-10 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center mr-4">
                          <span className="text-xl">{integration.name === 'Slack' ? '🔄' : integration.name === 'Google Drive' ? '📄' : '💻'}</span>
                        </div>
                        <div>
                          <h3 className="font-medium text-gray-900 dark:text-white">{integration.name}</h3>
                          <div className="flex items-center">
                            <span className={`text-xs ${
                              integration.status === 'connected' 
                                ? 'text-success-600 dark:text-success-400' 
                                : 'text-gray-500 dark:text-gray-400'
                            }`}>
                              {integration.status === 'connected' ? (
                                <span className="flex items-center">
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                  Connected
                                  {integration.connected_at && (
                                    <span className="ml-1 text-gray-500 dark:text-gray-400">
                                      - {new Date(integration.connected_at).toLocaleDateString()}
                                    </span>
                                  )}
                                </span>
                              ) : (
                                <span className="flex items-center">
                                  <AlertCircle className="h-3 w-3 mr-1" />
                                  Not connected
                                </span>
                              )}
                            </span>
                          </div>
                        </div>
                      </div>
                      <Button
                        variant={integration.status === 'connected' ? 'outline' : 'default'}
                        size="sm"
                        onClick={() => {
                          if (integration.status === 'connected') {
                            handleDisconnectIntegration(integration.id);
                          } else {
                            setSelectedIntegration(integration.name);
                            setShowConnectIntegrationModal(true);
                          }
                        }}
                      >
                        {integration.status === 'connected' ? 'Disconnect' : 'Connect'}
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Create API Key Modal */}
      <AnimatePresence>
        {showCreateApiKeyModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="bg-white dark:bg-gray-900 rounded-xl w-full max-w-md overflow-hidden"
            >
              <div className="p-6 border-b border-gray-200 dark:border-gray-800">
                <h2 className="text-lg font-medium text-gray-900 dark:text-white">Create API Key</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Create a new API key for third-party integrations.
                </p>
              </div>
              
              <div className="p-6">
                <div className="mb-4">
                  <label htmlFor="apiKeyName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    API Key Name
                  </label>
                  <input
                    id="apiKeyName"
                    type="text"
                    className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="e.g., Development API Key"
                    value={newApiKeyName}
                    onChange={(e) => setNewApiKeyName(e.target.value)}
                  />
                </div>
                
                <div className="bg-warning-50 dark:bg-warning-900/20 text-warning-700 dark:text-warning-400 p-4 rounded-lg mb-4">
                  <div className="flex">
                    <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0" />
                    <p className="text-sm">
                      API keys give access to your account. Make sure to keep them secure and never share them publicly.
                    </p>
                  </div>
                </div>
                
                <div className="flex justify-end space-x-3">
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setShowCreateApiKeyModal(false);
                      setNewApiKeyName('');
                    }}
                  >
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleCreateApiKey}
                    isLoading={isCreatingApiKey}
                    disabled={!newApiKeyName.trim() || isCreatingApiKey}
                  >
                    Create Key
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      
      {/* Delete API Key Modal */}
      <AnimatePresence>
        {showDeleteApiKeyModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="bg-white dark:bg-gray-900 rounded-xl w-full max-w-md overflow-hidden"
            >
              <div className="p-6">
                <h2 className="text-lg font-medium text-error-600 dark:text-error-400">Revoke API Key</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 mb-4">
                  Are you sure you want to revoke this API key? This action cannot be undone, and any applications using this key will no longer have access.
                </p>
                
                <div className="flex justify-end space-x-3">
                  <Button 
                    variant="outline" 
                    onClick={() => setShowDeleteApiKeyModal(null)}
                  >
                    Cancel
                  </Button>
                  <Button 
                    variant="destructive"
                    onClick={() => handleDeleteApiKey(showDeleteApiKeyModal)}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Revoke Key
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      
      {/* Connect Integration Modal */}
      <AnimatePresence>
        {showConnectIntegrationModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="bg-white dark:bg-gray-900 rounded-xl w-full max-w-md overflow-hidden"
            >
              <div className="p-6 border-b border-gray-200 dark:border-gray-800">
                <h2 className="text-lg font-medium text-gray-900 dark:text-white">Connect Integration</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Connect Jaydus to another service.
                </p>
              </div>
              
              <div className="p-6">
                <div className="mb-4">
                  <label htmlFor="integration" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Select Integration
                  </label>
                  <select
                    id="integration"
                    className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    value={selectedIntegration}
                    onChange={(e) => setSelectedIntegration(e.target.value)}
                  >
                    <option value="">Select an integration</option>
                    <option value="Slack">Slack</option>
                    <option value="Google Drive">Google Drive</option>
                    <option value="GitHub">GitHub</option>
                  </select>
                </div>
                
                {selectedIntegration && (
                  <div className="mb-4">
                    <label htmlFor="configurationJson" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Configuration (JSON)
                    </label>
                    <textarea
                      id="configurationJson"
                      rows={4}
                      className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder='{"apiKey": "your_api_key", "workspace": "your_workspace"}'
                      value={integrationConfig}
                      onChange={(e) => setIntegrationConfig(e.target.value)}
                    ></textarea>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Optional: Enter configuration as a JSON object.
                    </p>
                  </div>
                )}
                
                <div className="flex justify-end space-x-3">
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setShowConnectIntegrationModal(false);
                      setSelectedIntegration('');
                      setIntegrationConfig('');
                    }}
                  >
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleConnectIntegration}
                    disabled={!selectedIntegration}
                  >
                    Connect
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

const Image = (props: React.SVGProps<SVGSVGElement>) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <rect width="18" height="18" x="3" y="3" rx="2" ry="2"></rect>
      <circle cx="9" cy="9" r="2"></circle>
      <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"></path>
    </svg>
  );
};

const MessageSquare = (props: React.SVGProps<SVGSVGElement>) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
    </svg>
  );
};

export default SettingsPage;