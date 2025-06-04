import React, { useState, useRef, useEffect } from 'react';
import { Send, X, Paperclip, Smile, ImagePlus, FileText, FileSpreadsheet } from 'lucide-react';
import { Button } from '../ui/Button';
import ReactTextareaAutosize from 'react-textarea-autosize';
import FileUploadButton from './FileUploadButton';
import VoiceRecordButton from './VoiceRecordButton';
import PromptEnhancerTool from './PromptEnhancerTool';
import { toast } from 'sonner';
import { v4 as uuidv4 } from 'uuid';
import { motion, AnimatePresence } from 'framer-motion';

interface ChatInputBoxProps {
  inputMessage: string;
  setInputMessage: (message: string) => void;
  onSendMessage: () => void;
  isSubmitting: boolean;
  className?: string;
}

export interface UploadedFile {
  id: string;
  file: File;
  preview?: string;
  type: 'image' | 'pdf' | 'csv' | 'code' | 'text' | 'other';
  uploadProgress?: number;
  isUploaded?: boolean;
}

const ChatInputBox: React.FC<ChatInputBoxProps> = ({
  inputMessage,
  setInputMessage,
  onSendMessage,
  isSubmitting,
  className = '',
}) => {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [uploading, setUploading] = useState<boolean>(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState<boolean>(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  
  // Handle keyboard shortcut for sending message
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (inputMessage.trim() || uploadedFiles.length > 0) {
        onSendMessage();
        setUploadedFiles([]);
      }
    }
  };

  // Clean up object URLs on unmount
  useEffect(() => {
    return () => {
      uploadedFiles.forEach(file => {
        if (file.preview) {
          URL.revokeObjectURL(file.preview);
        }
      });
    };
  }, []);
  
  // Handle file uploads
  const handleFileUpload = (files: File[]) => {
    const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
    const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
    
    // Create new file objects with upload progress
    const newFiles = files.map(file => {
      // Check file size
      if (file.size > MAX_FILE_SIZE) {
        toast.error(`File ${file.name} exceeds the 10MB limit`);
        return null;
      }
      
      const fileId = `file-${uuidv4()}`;
      let fileType: UploadedFile['type'] = 'other';
      let preview: string | undefined = undefined;
      
      // Determine file type and create preview if necessary
      if (ALLOWED_IMAGE_TYPES.includes(file.type)) {
        fileType = 'image';
        preview = URL.createObjectURL(file);
      } else if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
        fileType = 'pdf';
      } else if (file.type === 'text/csv' || file.name.endsWith('.csv')) {
        fileType = 'csv';
      } else if (
        file.type.includes('javascript') || 
        file.type.includes('typescript') || 
        file.name.endsWith('.js') || 
        file.name.endsWith('.ts') ||
        file.name.endsWith('.jsx') || 
        file.name.endsWith('.tsx') ||
        file.name.endsWith('.html') ||
        file.name.endsWith('.css') ||
        file.name.endsWith('.php')
      ) {
        fileType = 'code';
      } else if (
        file.type === 'text/plain' || 
        file.name.endsWith('.txt') || 
        file.name.endsWith('.md')
      ) {
        fileType = 'text';
      }
      
      return {
        id: fileId,
        file,
        type: fileType,
        preview,
        uploadProgress: 0,
        isUploaded: false
      };
    }).filter(Boolean) as UploadedFile[];
    
    if (newFiles.length === 0) return;
    
    // Add new files to state
    setUploadedFiles(prev => [...prev, ...newFiles]);
    
    // Simulate file upload process
    setUploading(true);
    
    // Update progress for each file
    newFiles.forEach((file, index) => {
      const intervals = 5; // Number of progress updates
      let currentInterval = 0;
      
      const uploadInterval = setInterval(() => {
        currentInterval++;
        
        setUploadedFiles(prevFiles => 
          prevFiles.map(prevFile => 
            prevFile.id === file.id 
              ? { 
                  ...prevFile, 
                  uploadProgress: (currentInterval / intervals) * 100,
                  isUploaded: currentInterval === intervals
                }
              : prevFile
          )
        );
        
        if (currentInterval >= intervals) {
          clearInterval(uploadInterval);
          
          // Check if all files are uploaded
          if (index === newFiles.length - 1) {
            setTimeout(() => {
              setUploading(false);
              toast.success(`${newFiles.length} file${newFiles.length > 1 ? 's' : ''} uploaded successfully`);
            }, 500);
          }
        }
      }, 500 + (Math.random() * 200)); // Randomize duration slightly
    });
    
    // Focus the input
    setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
  };
  
  // Remove a file from the uploaded files
  const removeFile = (id: string) => {
    setUploadedFiles(prev => {
      const updatedFiles = prev.filter(file => {
        if (file.id === id) {
          // Revoke object URL to prevent memory leaks
          if (file.preview) {
            URL.revokeObjectURL(file.preview);
          }
          return false;
        }
        return true;
      });
      return updatedFiles;
    });
  };
  
  // Handle voice recording
  const handleVoiceRecording = (audioBlob: Blob) => {
    // In a real app, this would send the audio to a server for transcription
    // For now, we'll just create a message saying a voice recording was sent
    setInputMessage(prev => 
      prev ? `${prev}\n\n[Voice Recording]` : `[Voice Recording]`
    );
    
    // Focus the input
    setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
  };
  
  return (
    <div className={`relative ${className}`}>
      {/* Show uploaded files preview */}
      {uploadedFiles.length > 0 && (
        <div className="flex flex-wrap gap-2 p-3 border-b border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800">
          {uploadedFiles.map((file) => (
            <div 
              key={file.id} 
              className="relative group file-thumbnail"
            >
              {file.type === 'image' && file.preview ? (
                <div className="file-thumbnail-image">
                  <img 
                    src={file.preview} 
                    alt={file.file.name}
                    className="w-full h-full object-cover" 
                  />
                  
                  {!file.isUploaded && file.uploadProgress !== undefined && (
                    <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                      <div className="h-1 w-4/5 bg-gray-500 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-white transition-all duration-300 ease-out"
                          style={{ width: `${file.uploadProgress}%` }}
                        ></div>
                      </div>
                    </div>
                  )}
                  
                  <button
                    onClick={() => removeFile(file.id)}
                    className="absolute top-1 right-1 bg-black bg-opacity-60 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                    aria-label="Remove file"
                    disabled={uploading}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ) : (
                <div className="file-thumbnail-icon">
                  {file.type === 'pdf' ? (
                    <div className="file-type-icon pdf">PDF</div>
                  ) : file.type === 'csv' ? (
                    <div className="file-type-icon csv">CSV</div>
                  ) : file.type === 'code' ? (
                    <div className="file-type-icon code">CODE</div>
                  ) : file.type === 'text' ? (
                    <div className="file-type-icon default">TXT</div>
                  ) : (
                    <div className="file-type-icon default">FILE</div>
                  )}
                  
                  <div className="file-thumbnail-name">
                    {file.file.name.length > 15 ? file.file.name.substring(0, 12) + '...' : file.file.name}
                  </div>
                  
                  {!file.isUploaded && file.uploadProgress !== undefined && (
                    <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                      <div className="h-1 w-4/5 bg-gray-500 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-white transition-all duration-300 ease-out"
                          style={{ width: `${file.uploadProgress}%` }}
                        ></div>
                      </div>
                    </div>
                  )}
                  
                  <button
                    onClick={() => removeFile(file.id)}
                    className="absolute top-1 right-1 bg-black bg-opacity-60 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                    aria-label="Remove file"
                    disabled={uploading}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    
      <div className="rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 focus-within:ring-2 focus-within:ring-primary-500 focus-within:border-primary-500">
        <ReactTextareaAutosize
          ref={inputRef}
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={uploadedFiles.length > 0 ? "Ask about your uploaded files..." : "Type a message..."}
          className="w-full px-4 py-3 max-h-32 bg-transparent border-none focus:ring-0 resize-none text-gray-900 dark:text-gray-100"
          minRows={1}
          maxRows={5}
          disabled={isSubmitting}
        />
        
        <div className="flex items-center justify-between px-3 py-2 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-1">
            <FileUploadButton
              onFileSelect={handleFileUpload}
              acceptedFileTypes=".txt,.pdf,.doc,.docx,.csv,.json,.md,.js,.ts,.tsx,.jsx,.html,.css,.php,image/*"
              maxFileSize={10}
            />
            
            <VoiceRecordButton
              onRecordingComplete={handleVoiceRecording}
            />
            
            <PromptEnhancerTool
              onEnhancedPrompt={setInputMessage}
            />
            
            <button 
              className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 rounded-md"
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            >
              <Smile className="h-5 w-5" />
            </button>
          </div>
          
          <Button 
            className="rounded-full h-10 w-10 p-0 bg-primary-600 hover:bg-primary-700"
            onClick={() => {
              if (inputMessage.trim() || uploadedFiles.length > 0) {
                onSendMessage();
                setUploadedFiles([]);
              }
            }}
            disabled={(!inputMessage.trim() && uploadedFiles.length === 0) || isSubmitting || uploading}
            aria-label="Send message"
          >
            <Send className="h-5 w-5" />
          </Button>
        </div>
      </div>
      
      {/* File upload prompt when empty */}
      {!inputMessage && uploadedFiles.length === 0 && !isSubmitting && (
        <div className="absolute bottom-16 left-0 right-0 mx-auto w-max p-2 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 text-xs rounded-lg border border-gray-200 dark:border-gray-700 shadow-lg opacity-70 pointer-events-none">
          <div className="flex items-center">
            <Paperclip className="h-3 w-3 mr-1.5" />
            <span>Upload files (PDF, CSV, images, code) up to 10MB</span>
          </div>
        </div>
      )}
      
      {/* Emoji picker */}
      <AnimatePresence>
        {showEmojiPicker && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.15 }}
            className="absolute bottom-full mb-2 left-0 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-2 z-10"
          >
            <div className="p-2">
              <div className="grid grid-cols-8 gap-1">
                {["😊", "👍", "❤️", "😂", "🎉", "🤔", "👏", "😢", 
                  "😍", "🔥", "✅", "⭐", "👋", "🙏", "🌟", "👀"].map(emoji => (
                  <button
                    key={emoji}
                    className="w-8 h-8 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-lg"
                    onClick={() => {
                      setInputMessage(prev => prev + emoji);
                      setShowEmojiPicker(false);
                      inputRef.current?.focus();
                    }}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ChatInputBox;