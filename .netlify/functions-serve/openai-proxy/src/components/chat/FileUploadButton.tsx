import React, { useState, useRef } from 'react';
import { Paperclip, X, File, FileText, FileImage, FileCode, Film, Upload } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { toast } from 'sonner';
import { Button } from '../ui/Button';

interface FileUploadButtonProps {
  onFileSelect: (files: File[]) => void;
  acceptedFileTypes?: string; // e.g. ".pdf,.doc,.docx,image/*"
  maxFileSize?: number; // in MB
  className?: string;
}

const FileUploadButton: React.FC<FileUploadButtonProps> = ({ 
  onFileSelect, 
  acceptedFileTypes = "*", 
  maxFileSize = 10,
  className = ''
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [showPreview, setShowPreview] = useState<boolean>(false);
  const [dragActive, setDragActive] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files);
      
      // Validate file sizes
      const validFiles: File[] = [];
      const errorMessages: string[] = [];
      
      files.forEach(file => {
        const sizeInMB = file.size / (1024 * 1024);
        if (sizeInMB > maxFileSize) {
          errorMessages.push(`File ${file.name} exceeds maximum size of ${maxFileSize}MB`);
        } else {
          validFiles.push(file);
        }
      });
      
      if (validFiles.length > 0) {
        setSelectedFiles(prev => [...prev, ...validFiles]);
        
        // Reset the input so the same file can be selected again if needed
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
      
      if (errorMessages.length > 0) {
        setErrors(errorMessages);
      } else {
        setShowPreview(true);
      }
    }
  };
  
  // Handle drag and drop
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  };
  
  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  };
  
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };
  
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const files = Array.from(e.dataTransfer.files);
      
      // Validate file sizes
      const validFiles: File[] = [];
      const errorMessages: string[] = [];
      
      files.forEach(file => {
        const sizeInMB = file.size / (1024 * 1024);
        if (sizeInMB > maxFileSize) {
          errorMessages.push(`File ${file.name} exceeds maximum size of ${maxFileSize}MB`);
        } else {
          validFiles.push(file);
        }
      });
      
      if (validFiles.length > 0) {
        setSelectedFiles(prev => [...prev, ...validFiles]);
        setShowPreview(true);
      }
      
      if (errorMessages.length > 0) {
        setErrors(errorMessages);
      }
    }
  };
  
  const removeFile = (index: number) => {
    setSelectedFiles(prev => {
      const newFiles = [...prev];
      newFiles.splice(index, 1);
      return newFiles;
    });
  };
  
  const handleUpload = () => {
    if (selectedFiles.length === 0) {
      toast.error('Please select at least one file');
      return;
    }
    
    onFileSelect(selectedFiles);
    setSelectedFiles([]);
    setShowPreview(false);
  };
  
  const clearErrors = () => {
    setErrors([]);
  };
  
  // Determine appropriate icon for file type
  const getFileIcon = (file: File) => {
    const fileType = file.type;
    if (fileType.startsWith('image/')) {
      return <FileImage className="h-4 w-4 text-blue-500" />;
    } else if (fileType.startsWith('video/')) {
      return <Film className="h-4 w-4 text-purple-500" />;
    } else if (fileType.includes('pdf')) {
      return <FileText className="h-4 w-4 text-red-500" />;
    } else if (fileType.includes('word') || fileType.includes('document')) {
      return <FileText className="h-4 w-4 text-blue-500" />;
    } else if (fileType.includes('spreadsheet') || fileType.includes('excel') || fileType.includes('csv')) {
      return <FileText className="h-4 w-4 text-green-500" />;
    } else if (fileType.includes('javascript') || fileType.includes('typescript') || 
               fileType.includes('json') || fileType.includes('html') || 
               fileType.includes('css') || fileType.includes('php')) {
      return <FileCode className="h-4 w-4 text-yellow-500" />;
    }
    return <File className="h-4 w-4 text-gray-500" />;
  };
  
  return (
    <div className={`relative ${className}`}>
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept={acceptedFileTypes}
        className="hidden"
        onChange={handleFileChange}
      />
      
      <Button
        variant="ghost"
        size="icon"
        onClick={() => fileInputRef.current?.click()}
        className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
        aria-label="Attach files"
      >
        <Paperclip className="h-5 w-5" />
      </Button>
      
      <AnimatePresence>
        {showPreview && (
          <>
            {/* Backdrop for mobile */}
            <div
              className="fixed inset-0 z-40 bg-black/40 md:hidden"
              onClick={() => setShowPreview(false)}
            />
            
            {/* Preview panel */}
            <motion.div
              initial={{ opacity: 0, y: '100%' }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: '100%' }}
              transition={{ duration: 0.3, type: 'spring', stiffness: 500, damping: 30 }}
              className="fixed left-0 right-0 bottom-0 z-50 bg-white dark:bg-gray-900 rounded-t-xl border-t border-gray-200 dark:border-gray-800 shadow-xl md:absolute md:bottom-auto md:top-0 md:translate-y-[-100%] md:w-80 md:rounded-b-xl md:rounded-t-none md:border-t-0 md:border-b md:shadow-lg"
              onDragEnter={handleDragEnter}
              onDragLeave={handleDragLeave}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
            >
              <div className={`p-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between ${
                dragActive ? 'bg-primary-50 dark:bg-primary-900/20' : ''
              }`}>
                <h3 className="font-medium text-gray-900 dark:text-white">Selected Files</h3>
                <button
                  onClick={() => setShowPreview(false)}
                  className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              
              <div className="max-h-80 overflow-y-auto p-3">
                {selectedFiles.length === 0 ? (
                  <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-6 text-center">
                    <Upload className="h-8 w-8 mx-auto text-gray-400 dark:text-gray-600 mb-2" />
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Drag and drop files here, or{' '}
                      <button 
                        className="text-primary-600 dark:text-primary-400 hover:underline"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        browse
                      </button>
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Max {maxFileSize}MB per file
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {selectedFiles.map((file, index) => (
                      <div 
                        key={`${file.name}-${index}`}
                        className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded-lg"
                      >
                        <div className="flex items-center overflow-hidden mr-2">
                          {getFileIcon(file)}
                          <div className="ml-2 min-w-0">
                            <p className="text-sm text-gray-700 dark:text-gray-300 font-medium truncate">
                              {file.name}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {(file.size / (1024 * 1024)).toFixed(2)} MB
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => removeFile(index)}
                          className="flex-shrink-0 text-gray-500 hover:text-error-600 dark:hover:text-error-400"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                
                {/* Error messages */}
                {errors.length > 0 && (
                  <div className="mt-4 bg-error-50 border border-error-200 rounded-md p-3 dark:bg-error-900/20 dark:border-error-800">
                    <div className="flex items-start">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-error-400 mt-0.5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      <div>
                        <h3 className="text-sm font-medium text-error-800 dark:text-error-300">Upload error</h3>
                        <div className="mt-1 text-xs text-error-700 dark:text-error-400">
                          <ul className="list-disc pl-4 space-y-1">
                            {errors.map((error, index) => (
                              <li key={index}>{error}</li>
                            ))}
                          </ul>
                        </div>
                        <div className="mt-2">
                          <button
                            type="button"
                            onClick={clearErrors}
                            className="text-xs font-medium text-error-800 dark:text-error-300 hover:text-error-900 dark:hover:text-error-200"
                          >
                            Dismiss
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="p-3 border-t border-gray-200 dark:border-gray-800">
                <Button 
                  variant="default"
                  className="w-full"
                  onClick={handleUpload}
                  disabled={selectedFiles.length === 0}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Upload {selectedFiles.length > 0 && `(${selectedFiles.length})`}
                </Button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default FileUploadButton;