import React from 'react';
import { useTheme } from '../../context/ThemeContext';
import { Sun, Moon, Monitor } from 'lucide-react';
import { Button } from '../ui/Button';

interface ThemeSwitcherProps {
  variant?: 'buttons' | 'dropdown' | 'icon';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const ThemeSwitcher: React.FC<ThemeSwitcherProps> = ({ 
  variant = 'buttons', 
  size = 'md',
  className = '' 
}) => {
  const { mode, setMode, isDark } = useTheme();
  
  // Sizes for icons
  const iconSizes = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6'
  };
  
  // Simple toggle for icon variant
  if (variant === 'icon') {
    return (
      <Button
        variant="ghost"
        size="icon-sm"
        onClick={() => setMode(isDark ? 'light' : 'dark')}
        className={className}
        aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
      >
        {isDark ? (
          <Sun className={iconSizes[size]} />
        ) : (
          <Moon className={iconSizes[size]} />
        )}
      </Button>
    );
  }
  
  // Buttons variant
  if (variant === 'buttons') {
    return (
      <div className={`grid grid-cols-3 gap-3 ${className}`}>
        <button
          onClick={() => setMode('light')}
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
          onClick={() => setMode('dark')}
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
          onClick={() => setMode('system')}
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
    );
  }
  
  // Dropdown variant
  return (
    <select 
      value={mode}
      onChange={(e) => setMode(e.target.value as any)}
      className={`rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500 ${className}`}
    >
      <option value="light">Light</option>
      <option value="dark">Dark</option>
      <option value="system">System</option>
    </select>
  );
};

export default ThemeSwitcher;