import React from 'react';
import { useTheme } from '../../context/ThemeContext';
import ThemeSwitcher from '../utils/ThemeSwitcher';
import ColorScheme from '../utils/ColorScheme';
import ThemePreview from './ThemePreview';

interface ThemeSettingsProps {
  showPreview?: boolean;
  className?: string;
}

export const ThemeSettings: React.FC<ThemeSettingsProps> = ({ 
  showPreview = true,
  className = ''
}) => {
  const { setColorScheme } = useTheme();
  
  const handleColorChange = (color: string) => {
    setColorScheme(color as any);
  };
  
  return (
    <div className={`space-y-6 ${className}`}>
      <div>
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Theme Mode</h3>
        <ThemeSwitcher variant="buttons" />
      </div>
      
      <div>
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Color Scheme</h3>
        <ColorScheme onColorSelect={handleColorChange} />
        
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
          Your color scheme selection will apply across the entire application.
        </p>
      </div>
      
      {showPreview && (
        <ThemePreview />
      )}
    </div>
  );
};

export default ThemeSettings;