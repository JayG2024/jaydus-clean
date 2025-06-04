import React from 'react';
import { cn } from '../../utils/cn';
import { User } from 'lucide-react';

interface AvatarProps {
  src?: string | null;
  alt?: string;
  fallback?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  status?: 'online' | 'offline' | 'away' | 'busy';
  className?: string;
  onClick?: () => void;
}

const sizeClasses = {
  xs: 'h-6 w-6 text-xs',
  sm: 'h-8 w-8 text-sm',
  md: 'h-10 w-10 text-base',
  lg: 'h-12 w-12 text-lg',
  xl: 'h-16 w-16 text-xl',
};

const statusClasses = {
  online: 'bg-success-500',
  offline: 'bg-gray-400',
  away: 'bg-warning-500',
  busy: 'bg-error-500',
};

export const Avatar: React.FC<AvatarProps> = ({
  src,
  alt = 'Avatar',
  fallback,
  size = 'md',
  status,
  className,
  onClick,
}) => {
  const getFallbackText = () => {
    if (fallback) return fallback.charAt(0).toUpperCase();
    if (alt) return alt.charAt(0).toUpperCase();
    return 'U';
  };

  return (
    <div 
      className={cn(
        'relative flex-shrink-0 rounded-full overflow-hidden',
        onClick && 'cursor-pointer',
        sizeClasses[size],
        className
      )}
      onClick={onClick}
    >
      {src ? (
        <img
          src={src}
          alt={alt}
          className="h-full w-full object-cover"
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = 'none';
          }}
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400">
          {fallback ? (
            <span>{getFallbackText()}</span>
          ) : (
            <User className="h-1/2 w-1/2" />
          )}
        </div>
      )}
      
      {status && (
        <span 
          className={cn(
            'absolute block rounded-full ring-2 ring-white dark:ring-gray-900',
            statusClasses[status],
            size === 'xs' ? 'h-1.5 w-1.5 bottom-0 right-0' : 'h-2.5 w-2.5 bottom-0 right-0'
          )} 
        />
      )}
    </div>
  );
};