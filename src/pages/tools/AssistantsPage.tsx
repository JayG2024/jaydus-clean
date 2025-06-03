import React, { useState, useEffect } from 'react';
import { PlusCircle, Bot, Settings, ChevronRight, Trash2, Edit, Menu, Sparkles, X, Upload, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { Button } from '../../components/ui/Button';
import { toast } from 'sonner';
import { useAuth } from "../../context/ClerkAuthContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { EmptyState } from '../../components/ui/EmptyState';
import { useNavigate } from 'react-router-dom';

interface Assistant {
  id: string;
  name: string;
  description: string;
  model: string;
  createdAt: Date;
  status: 'training' | 'ready' | 'failed';
  instructions?: string;
}

interface FilesState {
  files: File[];
  uploading: boolean;
  uploaded: File[];
}

const AssistantsPage: React.FC = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const [assistants, setAssistants] = useState<Assistant[]>([
    {
      id: 'ast-123',
      name: 'Customer Support',
      description: 'Handles customer inquiries and troubleshooting',
      model: 'GPT-4',
      createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
      status: 'ready',
      instructions: 'You are a helpful customer support representative. Answer user questions accurately and politely.'
    },
    {
      id: 'ast-456',
      name: 'Marketing Assistant',
      description: 'Helps create and analyze marketing campaigns',
      model: 'GPT-4',
      createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
      status: 'ready',
      instructions: 'You are a marketing expert. Help users create compelling marketing content and analyze campaign effectiveness.'
    },
    {
      id: 'ast-789',
      name: 'Data Analyzer',
      description: 'Analyzes and visualizes business metrics',
      model: 'GPT-3.5 Turbo',
      createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
      status: 'ready',
      instructions: 'You are a data analysis expert. Help users understand their business metrics and provide insights.'
    },
  ]);
  
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [isCreatingAssistant, setIsCreatingAssistant] = useState(false);
  const [showViewModal, setShowViewModal] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'created' | 'name'>('created');
  const [fileState, setFileState] = useState<FilesState>({
    files: [],
    uploading: false,
    uploaded: []
  });
  
  const [newAssistant, setNewAssistant] = useState({
    name: '',
    description: '',
    model: 'gpt-4',
    instructions: '',
  });
  
  // Store assistants in localStorage when they change
  useEffect(() => {
    localStorage.setItem('assistants', JSON.stringify(assistants));
  }, [assistants]);
  
  // Load assistants from localStorage on component mount
  useEffect(() => {
    const savedAssistants = localStorage.getItem('assistants');
    if (savedAssistants) {
      try {
        const parsedAssistants = JSON.parse(savedAssistants);
        // Convert string timestamps back to Date objects
        const assistantsWithDates = parsedAssistants.map((assistant: any) => ({
          ...assistant,
          createdAt: new Date(assistant.createdAt)
        }));
        setAssistants(assistantsWithDates);
      } catch (e) {
        console.error('Failed to parse saved assistants:', e);
      }
    }
  }, []);
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setNewAssistant(prev => ({ ...prev, [name]: value }));
  };
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files);
      setFileState(prev => ({
        ...prev,
        files: [...prev.files, ...newFiles]
      }));
    }
  };
  
  const removeFile = (fileName: string) => {
    setFileState(prev => ({
      ...prev,
      files: prev.files.filter(file => file.name !== fileName)
    }));
  };
  
  const simulateFileUpload = async () => {
    if (fileState.files.length === 0) return;
    
    setFileState(prev => ({ ...prev, uploading: true }));
    
    // Simulate a delay for the upload
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    setFileState(prev => ({
      uploading: false,
      uploaded: [...prev.uploaded, ...prev.files],
      files: []
    }));
    
    toast.success('Files uploaded successfully');
  };
  
  const sortedAssistants = [...assistants].sort((a, b) => {
    if (sortBy === 'name') {
      return a.name.localeCompare(b.name);
    } else { // 'created'
      return b.createdAt.getTime() - a.createdAt.getTime();
    }
  });
  
  const createAssistant = async () => {
    if (!newAssistant.name || !newAssistant.description) {
      toast.error('Please provide a name and description');
      return;
    }
    
    setIsCreatingAssistant(true);
    
    try {
      // Create a new assistant object
      const createdAssistant: Assistant = {
        id: `ast-${Date.now()}`,
        name: newAssistant.name,
        description: newAssistant.description,
        model: newAssistant.model,
        createdAt: new Date(),
        status: 'training',
        instructions: newAssistant.instructions
      };
      
      // Add to list
      setAssistants(prev => [createdAssistant, ...prev]);
      
      // Reset file state
      setFileState({
        files: [],
        uploading: false,
        uploaded: []
      });
      
      // Simulate training completion after 5 seconds
      setTimeout(() => {
        setAssistants(prev => 
          prev.map(a => 
            a.id === createdAssistant.id ? { ...a, status: 'ready' } : a
          )
        );
        toast.success(`${createdAssistant.name} is now ready to use`);
      }, 5000);
      
      // Reset form and close modal
      setNewAssistant({
        name: '',
        description: '',
        model: 'gpt-4',
        instructions: '',
      });
      
      setShowCreateModal(false);
      toast.success('Assistant created and now training');
      
    } catch (error) {
      console.error('Error creating assistant:', error);
      toast.error('Failed to create assistant');
    } finally {
      setIsCreatingAssistant(false);
    }
  };
  
  const deleteAssistant = (id: string) => {
    setAssistants(assistants.filter(assistant => assistant.id !== id));
    setShowDeleteConfirm(null);
    toast.success('Assistant deleted successfully');
  };
  
  const viewAssistant = (id: string) => {
    setShowViewModal(id);
  };
  
  const startChatWithAssistant = (assistantId: string) => {
    navigate(`/chat?assistant=${assistantId}`);
  };
  
  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">Custom AI Assistants</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Create specialized AI assistants trained on your data for specific tasks.
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center">
            <span className="text-sm text-gray-600 dark:text-gray-400 mr-2">Sort by:</span>
            <select
              className="rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-2 py-1 text-sm text-gray-900 dark:text-gray-100"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'created' | 'name')}
            >
              <option value="created">Newest</option>
              <option value="name">Name</option>
            </select>
          </div>
          <Button onClick={() => setShowCreateModal(true)}>
            <PlusCircle className="h-4 w-4 mr-2" />
            Create Assistant
          </Button>
        </div>
      </div>
      
      {assistants.length === 0 ? (
        <EmptyState
          icon={<Bot className="h-10 w-10 text-gray-400" />}
          title="No assistants yet"
          description="Create your first AI assistant to help with specific tasks"
          actions={{
            primary: {
              label: "Create Your First Assistant",
              onClick: () => setShowCreateModal(true)
            }
          }}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sortedAssistants.map((assistant) => (
            <Card 
              key={assistant.id}
              variant="interactive" 
              className="relative group"
            >
              {assistant.status === 'training' && (
                <div className="absolute top-0 left-0 right-0 h-1 bg-warning-500 overflow-hidden">
                  <div className="h-full bg-warning-300 animate-pulse"></div>
                </div>
              )}
              
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center">
                    <div className={`h-10 w-10 rounded-full flex items-center justify-center mr-3 ${
                      assistant.status === 'ready' 
                        ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-600' 
                        : assistant.status === 'training'
                          ? 'bg-warning-100 dark:bg-warning-900/30 text-warning-600'
                          : 'bg-error-100 dark:bg-error-900/30 text-error-600'
                    }`}>
                      <Bot className="h-5 w-5" />
                    </div>
                    <div>
                      <h2 className="text-lg font-medium text-gray-900 dark:text-white">{assistant.name}</h2>
                      <div className="flex items-center">
                        <span className="text-xs text-gray-500 dark:text-gray-400 mr-2">
                          {assistant.model}
                        </span>
                        <Badge 
                          variant={
                            assistant.status === 'ready' ? 'success' : 
                            assistant.status === 'training' ? 'warning' : 'error'
                          } 
                          size="sm"
                        >
                          {assistant.status}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <div className="relative">
                    <Button 
                      variant="ghost"
                      size="icon-sm"
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => viewAssistant(assistant.id)}
                    >
                      <Settings className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                
                <p className="text-gray-600 dark:text-gray-400 text-sm mb-6 line-clamp-3">
                  {assistant.description}
                </p>
                
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    Created {assistant.createdAt.toLocaleDateString()}
                  </span>
                  
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button 
                      variant="ghost" 
                      size="icon-sm"
                      onClick={() => setShowDeleteConfirm(assistant.id)}
                      className="text-error-500"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
              
              <CardFooter className="bg-gray-50 dark:bg-gray-800 p-4 flex justify-between items-center">
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {assistant.status === 'ready' ? 'Ready to use' : assistant.status === 'training' ? 'Training in progress...' : 'Training failed'}
                </span>
                {assistant.status === 'ready' && (
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => startChatWithAssistant(assistant.id)}
                  >
                    Use Assistant <ChevronRight className="ml-1 h-4 w-4" />
                  </Button>
                )}
                {assistant.status === 'training' && (
                  <div className="flex items-center text-warning-600">
                    <Sparkles className="animate-pulse h-4 w-4 mr-1" />
                    <span className="text-xs">Training...</span>
                  </div>
                )}
              </CardFooter>
            </Card>
          ))}
          
          {/* Create new assistant card */}
          <button
            onClick={() => setShowCreateModal(true)}
            className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl bg-transparent p-6 flex flex-col items-center justify-center text-center h-full hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors cursor-pointer"
          >
            <div className="h-12 w-12 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center mb-4">
              <PlusCircle className="h-6 w-6 text-primary-600" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Create New Assistant
            </h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              Train an AI assistant on your data for specialized tasks
            </p>
          </button>
        </div>
      )}
      
      {/* Create assistant modal */}
      <AnimatePresence>
        {showCreateModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="bg-white dark:bg-gray-900 rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
            >
              <div className="p-6 border-b border-gray-200 dark:border-gray-800">
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">Create New Assistant</h2>
                    <p className="text-gray-600 dark:text-gray-400">
                      Train a custom AI assistant on your specific data
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="rounded-full"
                    onClick={() => setShowCreateModal(false)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              <div className="p-6 space-y-6">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Assistant Name
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={newAssistant.name}
                    onChange={handleInputChange}
                    className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="e.g., Customer Support Assistant"
                  />
                </div>
                
                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Description
                  </label>
                  <textarea
                    id="description"
                    name="description"
                    value={newAssistant.description}
                    onChange={handleInputChange}
                    rows={3}
                    className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="What tasks will this assistant help with?"
                  ></textarea>
                </div>
                
                <div>
                  <label htmlFor="model" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Base Model
                  </label>
                  <select
                    id="model"
                    name="model"
                    value={newAssistant.model}
                    onChange={handleInputChange}
                    className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="gpt-4">GPT-4 (Most capable)</option>
                    <option value="gpt-4-turbo">GPT-4 Turbo</option>
                    <option value="gpt-3.5-turbo">GPT-3.5 Turbo (Fast and efficient)</option>
                  </select>
                </div>
                
                <div>
                  <label htmlFor="instructions" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Instructions
                  </label>
                  <textarea
                    id="instructions"
                    name="instructions"
                    value={newAssistant.instructions}
                    onChange={handleInputChange}
                    rows={4}
                    className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="Provide detailed instructions for how the assistant should behave, what it should focus on, etc."
                  ></textarea>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Training Data
                  </label>
                  <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-4">
                    <div className="flex flex-col items-center justify-center">
                      <input
                        type="file"
                        multiple
                        id="files"
                        className="hidden"
                        onChange={handleFileChange}
                      />
                      
                      {fileState.files.length === 0 && fileState.uploaded.length === 0 ? (
                        <div className="text-center py-4">
                          <Upload className="h-10 w-10 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                            Drag & drop files or click to browse<br />
                            <span className="text-xs">Supported formats: PDF, DOCX, TXT, MD, CSV</span>
                          </p>
                          <Button variant="outline" size="sm" onClick={() => document.getElementById('files')?.click()}>
                            Browse Files
                          </Button>
                        </div>
                      ) : (
                        <div className="w-full">
                          {fileState.files.length > 0 && (
                            <>
                              <div className="mb-3">
                                <div className="flex items-center justify-between mb-2">
                                  <h4 className="text-sm font-medium text-gray-900 dark:text-white">Selected Files</h4>
                                  <Button 
                                    variant="outline" 
                                    size="sm"
                                    onClick={simulateFileUpload}
                                    disabled={fileState.uploading}
                                    isLoading={fileState.uploading}
                                  >
                                    Upload Files
                                  </Button>
                                </div>
                                <div className="space-y-2 max-h-32 overflow-y-auto">
                                  {fileState.files.map(file => (
                                    <div 
                                      key={file.name}
                                      className="flex items-center justify-between bg-gray-50 dark:bg-gray-800 p-2 rounded-lg"
                                    >
                                      <div className="flex items-center">
                                        <span className="text-xs font-medium text-gray-900 dark:text-white truncate max-w-[200px]">
                                          {file.name}
                                        </span>
                                        <span className="ml-2 text-xs text-gray-500">
                                          ({Math.round(file.size / 1024)} KB)
                                        </span>
                                      </div>
                                      <button 
                                        className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                                        onClick={() => removeFile(file.name)}
                                        disabled={fileState.uploading}
                                      >
                                        <X className="h-4 w-4" />
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              </div>
                              <div className="border-t border-gray-200 dark:border-gray-800 pt-3 text-center">
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={() => document.getElementById('files')?.click()}
                                >
                                  Add More Files
                                </Button>
                              </div>
                            </>
                          )}
                          
                          {fileState.uploaded.length > 0 && (
                            <div className="mt-4">
                              <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">Uploaded Files</h4>
                              <div className="space-y-2 max-h-32 overflow-y-auto">
                                {fileState.uploaded.map(file => (
                                  <div 
                                    key={file.name}
                                    className="flex items-center justify-between bg-primary-50 dark:bg-primary-900/20 p-2 rounded-lg"
                                  >
                                    <div className="flex items-center">
                                      <CheckCircle className="h-4 w-4 text-success-600 mr-2" />
                                      <span className="text-xs font-medium text-gray-900 dark:text-white truncate max-w-[200px]">
                                        {file.name}
                                      </span>
                                      <span className="ml-2 text-xs text-gray-500">
                                        ({Math.round(file.size / 1024)} KB)
                                      </span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Advanced Settings
                  </label>
                  <div className="border border-gray-300 dark:border-gray-700 rounded-lg divide-y divide-gray-200 dark:divide-gray-800">
                    <div className="p-3 flex items-center justify-between">
                      <div>
                        <h3 className="text-sm font-medium text-gray-900 dark:text-white">Web Search</h3>
                        <p className="text-xs text-gray-600 dark:text-gray-400">Allow assistant to search the web</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" value="" className="sr-only peer" />
                        <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-gray-600 peer-checked:bg-primary-600"></div>
                      </label>
                    </div>
                    <div className="p-3 flex items-center justify-between">
                      <div>
                        <h3 className="text-sm font-medium text-gray-900 dark:text-white">File Access</h3>
                        <p className="text-xs text-gray-600 dark:text-gray-400">Allow assistant to access uploaded files</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" value="" className="sr-only peer" checked readOnly />
                        <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-gray-600 peer-checked:bg-primary-600"></div>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="p-6 border-t border-gray-200 dark:border-gray-800 flex justify-end space-x-4">
                <Button variant="outline" onClick={() => setShowCreateModal(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={createAssistant}
                  isLoading={isCreatingAssistant}
                  disabled={!newAssistant.name || !newAssistant.description || isCreatingAssistant}
                >
                  Create Assistant
                </Button>
              </div>
            </motion.div>
          </div>
        )}
        
        {/* View assistant modal */}
        <AnimatePresence>
          {showViewModal && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className="bg-white dark:bg-gray-900 rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
              >
                {(() => {
                  const assistant = assistants.find(a => a.id === showViewModal);
                  if (!assistant) return null;
                  
                  return (
                    <>
                      <div className="p-6 border-b border-gray-200 dark:border-gray-800">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center">
                            <div className={`h-10 w-10 rounded-full flex items-center justify-center mr-3 ${
                              assistant.status === 'ready' 
                                ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-600' 
                                : assistant.status === 'training'
                                  ? 'bg-warning-100 dark:bg-warning-900/30 text-warning-600'
                                  : 'bg-error-100 dark:bg-error-900/30 text-error-600'
                            }`}>
                              <Bot className="h-5 w-5" />
                            </div>
                            <div>
                              <h2 className="text-xl font-bold text-gray-900 dark:text-white">{assistant.name}</h2>
                              <div className="flex items-center">
                                <span className="text-sm text-gray-500 dark:text-gray-400 mr-2">
                                  {assistant.model}
                                </span>
                                <Badge 
                                  variant={
                                    assistant.status === 'ready' ? 'success' : 
                                    assistant.status === 'training' ? 'warning' : 'error'
                                  }
                                  size="sm"
                                >
                                  {assistant.status}
                                </Badge>
                              </div>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="rounded-full"
                            onClick={() => setShowViewModal(null)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      
                      <div className="p-6">
                        <div className="space-y-6">
                          <div>
                            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Description</h3>
                            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 text-gray-900 dark:text-gray-100">
                              {assistant.description}
                            </div>
                          </div>
                          
                          {assistant.instructions && (
                            <div>
                              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Instructions</h3>
                              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                                <pre className="text-sm text-gray-900 dark:text-gray-100 whitespace-pre-wrap font-sans">
                                  {assistant.instructions}
                                </pre>
                              </div>
                            </div>
                          )}
                          
                          <div>
                            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Training Files</h3>
                            <div className="border border-gray-200 dark:border-gray-800 rounded-lg p-3">
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                No training files uploaded yet.
                              </p>
                            </div>
                          </div>
                          
                          <div>
                            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Settings</h3>
                            <div className="border border-gray-200 dark:border-gray-800 rounded-lg divide-y divide-gray-200 dark:divide-gray-800">
                              <div className="p-3 flex items-center justify-between">
                                <div>
                                  <h4 className="text-sm font-medium text-gray-900 dark:text-white">Model</h4>
                                  <p className="text-xs text-gray-600 dark:text-gray-400">{assistant.model}</p>
                                </div>
                                <Button variant="ghost" size="sm">
                                  <Edit className="h-4 w-4 mr-1" />
                                  Change
                                </Button>
                              </div>
                              <div className="p-3 flex items-center justify-between">
                                <div>
                                  <h4 className="text-sm font-medium text-gray-900 dark:text-white">Web Search</h4>
                                  <p className="text-xs text-gray-600 dark:text-gray-400">Disabled</p>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                  <input type="checkbox" value="" className="sr-only peer" />
                                  <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-gray-600 peer-checked:bg-primary-600"></div>
                                </label>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="p-6 border-t border-gray-200 dark:border-gray-800 flex justify-end space-x-4">
                        <Button 
                          variant="destructive" 
                          onClick={() => {
                            setShowViewModal(null);
                            setShowDeleteConfirm(assistant.id);
                          }}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete Assistant
                        </Button>
                        
                        <Button 
                          onClick={() => {
                            setShowViewModal(null);
                            startChatWithAssistant(assistant.id);
                          }}
                          disabled={assistant.status !== 'ready'}
                        >
                          <Bot className="h-4 w-4 mr-2" />
                          Chat with Assistant
                        </Button>
                      </div>
                    </>
                  );
                })()}
              </motion.div>
            </div>
          )}
        </AnimatePresence>
        
        {/* Delete confirmation dialog */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="bg-white dark:bg-gray-900 rounded-xl w-full max-w-md overflow-hidden"
            >
              <div className="p-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Delete Assistant</h2>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  Are you sure you want to delete this assistant? This action cannot be undone.
                </p>
                <div className="flex justify-end space-x-4">
                  <Button variant="outline" onClick={() => setShowDeleteConfirm(null)}>
                    Cancel
                  </Button>
                  <Button variant="destructive" onClick={() => deleteAssistant(showDeleteConfirm)}>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
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

export default AssistantsPage;