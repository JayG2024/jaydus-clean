import React, { useState } from 'react';
import { ExternalLink, FileText, File as FileIcon, FileSpreadsheet, Image as ImageIcon, FileCode, Download } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { Button } from '../ui/Button';

export interface Attachment {
  id: string;
  name: string;
  type: string;
  size: number;
  url?: string;
}

interface MessageAttachmentsProps {
  attachments: Attachment[];
  isUserMessage?: boolean;
}

const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const MessageAttachments: React.FC<MessageAttachmentsProps> = ({ 
  attachments, 
  isUserMessage = false 
}) => {
  const [expandedImageId, setExpandedImageId] = useState<string | null>(null);
  
  if (!attachments || attachments.length === 0) return null;
  
  return (
    <div className="mt-2 space-y-2">
      {attachments.map((attachment) => {
        const isImage = attachment.type.startsWith('image/');
        const isPdf = attachment.type === 'application/pdf' || attachment.name.endsWith('.pdf');
        const isCsv = attachment.type === 'text/csv' || attachment.name.endsWith('.csv');
        const isCode = attachment.type.includes('javascript') || 
                      attachment.type.includes('typescript') ||
                      attachment.name.endsWith('.js') || 
                      attachment.name.endsWith('.ts') ||
                      attachment.name.endsWith('.html') || 
                      attachment.name.endsWith('.css') ||
                      attachment.name.endsWith('.php');
        
        return (
          <div 
            key={attachment.id}
            className={`rounded-lg border ${
              isUserMessage 
                ? 'border-primary-300 bg-primary-50/30' 
                : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/30'
            } overflow-hidden file-attachment`}
          >
            {isImage && attachment.url ? (
              <div className="group relative">
                <img 
                  src={attachment.url} 
                  alt={attachment.name} 
                  className="max-h-80 w-auto object-contain mx-auto cursor-pointer" 
                  onClick={() => setExpandedImageId(attachment.id)}
                />
                <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-white/20 text-white hover:bg-white/10"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (attachment.url) {
                        window.open(attachment.url, '_blank');
                      }
                    }}
                  >
                    <ExternalLink className="h-4 w-4 mr-1" />
                    View Full Size
                  </Button>
                </div>
                
                <div className="p-2 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center">
                      <ImageIcon className="h-4 w-4 text-blue-500 mr-2" />
                      <span className="text-sm font-medium text-gray-900 dark:text-white truncate max-w-[200px]">
                        {attachment.name}
                      </span>
                    </div>
                    <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">
                      {formatFileSize(attachment.size)}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-3 flex items-start">
                <div className="mr-3 mt-1 flex-shrink-0">
                  {isPdf ? (
                    <div className="file-type-icon pdf flex h-10 w-10 items-center justify-center rounded">
                      <FileText className="h-5 w-5" />
                      <span className="text-xs font-bold mt-0.5">PDF</span>
                    </div>
                  ) : isCsv ? (
                    <div className="file-type-icon csv flex h-10 w-10 items-center justify-center rounded">
                      <FileSpreadsheet className="h-5 w-5" />
                      <span className="text-xs font-bold mt-0.5">CSV</span>
                    </div>
                  ) : isCode ? (
                    <div className="file-type-icon default flex h-10 w-10 items-center justify-center rounded">
                      <FileCode className="h-5 w-5" />
                      <span className="text-xs font-bold mt-0.5">CODE</span>
                    </div>
                  ) : (
                    <div className="file-type-icon default flex h-10 w-10 items-center justify-center rounded">
                      <FileIcon className="h-5 w-5" />
                      <span className="text-xs font-bold mt-0.5">
                        {attachment.name.split('.').pop()?.toUpperCase() || 'FILE'}
                      </span>
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`font-medium text-sm truncate max-w-[200px] ${
                    isUserMessage 
                      ? 'text-primary-800 dark:text-primary-100' 
                      : 'text-gray-900 dark:text-white'
                  }`}>
                    {attachment.name}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                    {formatFileSize(attachment.size)}
                  </p>
                  
                  <div className="flex flex-wrap gap-2">
                    {attachment.url && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="py-0.5 h-7 text-xs"
                        onClick={() => {
                          if (attachment.url) {
                            window.open(attachment.url, '_blank');
                          }
                        }}
                      >
                        <ExternalLink className="h-3 w-3 mr-1" />
                        View
                      </Button>
                    )}
                    
                    <Button
                      variant="outline"
                      size="sm"
                      className="py-0.5 h-7 text-xs"
                      onClick={() => {
                        // In a real app, this would download the file
                        if (attachment.url) {
                          const link = document.createElement('a');
                          link.href = attachment.url;
                          link.download = attachment.name;
                          document.body.appendChild(link);
                          link.click();
                          document.body.removeChild(link);
                        }
                      }}
                      disabled={!attachment.url}
                    >
                      <Download className="h-3 w-3 mr-1" />
                      Download
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      })}
      
      {/* Expanded image viewer */}
      <AnimatePresence>
        {expandedImageId && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black bg-opacity-90 flex items-center justify-center p-4"
            onClick={() => setExpandedImageId(null)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="max-w-[90vw] max-h-[90vh]"
              onClick={(e) => e.stopPropagation()}
            >
              {attachments
                .filter(att => att.id === expandedImageId && att.type.startsWith('image/') && att.url)
                .map(image => (
                  <img
                    key={image.id}
                    src={image.url}
                    alt={image.name}
                    className="max-w-full max-h-[80vh] object-contain mx-auto"
                  />
                ))}
              
              <div className="absolute bottom-4 left-0 right-0 flex justify-center">
                <Button
                  variant="outline"
                  size="sm"
                  className="border-white/30 text-white hover:bg-white/10"
                  onClick={() => setExpandedImageId(null)}
                >
                  Close
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MessageAttachments;