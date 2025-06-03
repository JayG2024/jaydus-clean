import React from 'react';
import { FileIcon, FileText, FileImage, FileSpreadsheet, FileCode } from 'lucide-react';

interface FileTypeIconProps {
  fileName: string;
  fileType: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const FileTypeIcon: React.FC<FileTypeIconProps> = ({
  fileName,
  fileType,
  size = 'md',
  className = ''
}) => {
  // Determine file type
  const isPdf = fileType === 'application/pdf' || fileName.endsWith('.pdf');
  const isCsv = fileType === 'text/csv' || fileName.endsWith('.csv');
  const isImage = fileType.startsWith('image/');
  const isCode = fileType.includes('javascript') || 
                fileType.includes('typescript') ||
                fileName.endsWith('.js') || 
                fileName.endsWith('.ts') ||
                fileName.endsWith('.html') || 
                fileName.endsWith('.css') ||
                fileName.endsWith('.php');
  
  // Determine icon size
  const iconSizes = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6'
  };
  
  const iconSize = iconSizes[size];
  
  // Determine file extension for display
  const fileExtension = fileName.split('.').pop()?.toUpperCase() || 'FILE';
  
  // Render the appropriate icon
  if (isPdf) {
    return (
      <div className={`flex items-center ${className}`}>
        <FileText className={`${iconSize} text-red-500`} />
        <span className="ml-1 text-xs font-medium">PDF</span>
      </div>
    );
  } else if (isCsv) {
    return (
      <div className={`flex items-center ${className}`}>
        <FileSpreadsheet className={`${iconSize} text-green-500`} />
        <span className="ml-1 text-xs font-medium">CSV</span>
      </div>
    );
  } else if (isImage) {
    return (
      <div className={`flex items-center ${className}`}>
        <FileImage className={`${iconSize} text-blue-500`} />
        <span className="ml-1 text-xs font-medium">
          {fileType.split('/')[1]?.toUpperCase() || 'IMG'}
        </span>
      </div>
    );
  } else if (isCode) {
    return (
      <div className={`flex items-center ${className}`}>
        <FileCode className={`${iconSize} text-yellow-500`} />
        <span className="ml-1 text-xs font-medium">{fileExtension}</span>
      </div>
    );
  } else {
    return (
      <div className={`flex items-center ${className}`}>
        <FileIcon className={`${iconSize} text-gray-500`} />
        <span className="ml-1 text-xs font-medium">{fileExtension}</span>
      </div>
    );
  }
};

export default FileTypeIcon;