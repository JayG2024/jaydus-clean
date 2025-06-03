import React from 'react';
import { Button } from './Button';
import { Badge } from './Badge';
import { useTheme } from '../../context/ThemeContext';

interface ThemePreviewProps {
  className?: string;
}

export const ThemePreview: React.FC<ThemePreviewProps> = ({ className = '' }) => {
  const { isDark } = useTheme();
  
  return (
    <div className={`p-4 bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 ${className}`}>
      <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Theme Preview</h3>
      
      <div className="space-y-4">
        <div className="space-y-2">
          <p className="text-xs text-gray-500 dark:text-gray-400">Buttons</p>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="default">Primary</Button>
            <Button size="sm" variant="secondary">Secondary</Button>
            <Button size="sm" variant="outline">Outline</Button>
            <Button size="sm" variant="ghost">Ghost</Button>
          </div>
        </div>
        
        <div className="space-y-2">
          <p className="text-xs text-gray-500 dark:text-gray-400">Badges</p>
          <div className="flex flex-wrap gap-2">
            <Badge variant="default">Default</Badge>
            <Badge variant="primary">Primary</Badge>
            <Badge variant="secondary">Secondary</Badge>
            <Badge variant="success">Success</Badge>
            <Badge variant="warning">Warning</Badge>
            <Badge variant="error">Error</Badge>
          </div>
        </div>
        
        <div className="space-y-2">
          <p className="text-xs text-gray-500 dark:text-gray-400">Text</p>
          <div className="space-y-1">
            <h4 className="text-base font-medium text-gray-900 dark:text-white">Heading Text</h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">Body text with a <a href="#" className="text-primary-600 dark:text-primary-400 hover:underline">link</a> inside it.</p>
            <div className="text-xs text-gray-500 dark:text-gray-500">Caption text</div>
          </div>
        </div>
        
        <div className="space-y-2">
          <p className="text-xs text-gray-500 dark:text-gray-400">Inputs</p>
          <div className="space-y-2">
            <input 
              type="text" 
              className="px-3 py-2 rounded-lg w-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
              placeholder="Input field"
            />
            <div className="flex items-center">
              <label className="relative inline-flex items-center cursor-pointer mr-3">
                <input type="checkbox" className="sr-only peer" checked />
                <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:translate-x-[-100%] peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-gray-600 peer-checked:bg-primary-600"></div>
                <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">Toggle</span>
              </label>
              <label className="flex items-center">
                <input type="radio" className="h-4 w-4 text-primary-600" checked={isDark} readOnly />
                <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">Radio</span>
              </label>
            </div>
          </div>
        </div>
        
        <div className="space-y-2">
          <p className="text-xs text-gray-500 dark:text-gray-400">Alerts</p>
          <div className="p-3 bg-primary-50 dark:bg-primary-900/20 text-primary-800 dark:text-primary-300 text-sm rounded-lg">
            This is a primary alert message.
          </div>
          <div className="p-3 bg-success-50 dark:bg-success-900/20 text-success-800 dark:text-success-300 text-sm rounded-lg">
            This is a success alert message.
          </div>
        </div>
      </div>
    </div>
  );
};

export default ThemePreview;