import React from 'react';
import { useTheme } from '../../context/ThemeContext';

interface ColorSchemeProps {
  onColorSelect?: (color: string) => void;
  className?: string;
}

interface ColorOption {
  id: string;
  name: string;
  color: string;
  bgClass: string;
}

export const ColorScheme: React.FC<ColorSchemeProps> = ({ 
  onColorSelect,
  className = ''
}) => {
  const { colorScheme, setColorScheme } = useTheme();
  
  const colorOptions: ColorOption[] = [
    { id: 'blue', name: 'Blue', color: '#2563eb', bgClass: 'bg-blue-600' },
    { id: 'purple', name: 'Purple', color: '#7c3aed', bgClass: 'bg-purple-600' },
    { id: 'green', name: 'Green', color: '#16a34a', bgClass: 'bg-green-600' },
    { id: 'orange', name: 'Orange', color: '#ea580c', bgClass: 'bg-orange-600' },
    { id: 'red', name: 'Red', color: '#dc2626', bgClass: 'bg-red-600' },
    { id: 'teal', name: 'Teal', color: '#0d9488', bgClass: 'bg-teal-600' },
    { id: 'pink', name: 'Pink', color: '#db2777', bgClass: 'bg-pink-600' }
  ];
  
  const handleColorChange = (colorId: string) => {
    setColorScheme(colorId as any);
    if (onColorSelect) {
      onColorSelect(colorId);
    }
  };
  
  return (
    <div className={`flex flex-wrap gap-3 ${className}`}>
      {colorOptions.map((option) => (
        <button
          key={option.id}
          onClick={() => handleColorChange(option.id)}
          className="flex flex-col items-center gap-1"
          title={`${option.name} Theme`}
          aria-label={`${option.name} Theme`}
        >
          <div 
            className={`color-indicator ${option.bgClass} ${colorScheme === option.id ? 'selected' : ''}`}
            aria-hidden="true"
          />
          <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
            {option.name}
          </span>
        </button>
      ))}
    </div>
  );
};

export default ColorScheme;