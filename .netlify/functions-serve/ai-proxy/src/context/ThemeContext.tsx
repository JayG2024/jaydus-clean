import React, { createContext, useContext, useState, useEffect } from 'react';

type ThemeMode = 'light' | 'dark' | 'system';
type ColorScheme = 'blue' | 'purple' | 'green' | 'orange' | 'red' | 'teal' | 'pink';

interface ThemeContextType {
  mode: ThemeMode;
  colorScheme: ColorScheme;
  setMode: (mode: ThemeMode) => void;
  setColorScheme: (scheme: ColorScheme) => void;
  isDark: boolean;
}

const defaultContext: ThemeContextType = {
  mode: 'system',
  colorScheme: 'blue',
  setMode: () => {},
  setColorScheme: () => {},
  isDark: false,
};

const ThemeContext = createContext<ThemeContextType>(defaultContext);

export const useTheme = () => useContext(ThemeContext);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [mode, setMode] = useState<ThemeMode>('system');
  const [colorScheme, setColorScheme] = useState<ColorScheme>('blue');
  const [isDark, setIsDark] = useState(false);

  // Initialize theme on mount
  useEffect(() => {
    // Load saved theme preference
    const savedMode = localStorage.getItem('theme-mode') as ThemeMode | null;
    const savedColorScheme = localStorage.getItem('theme-color') as ColorScheme | null;
    
    if (savedMode) {
      setMode(savedMode);
    }
    
    if (savedColorScheme) {
      setColorScheme(savedColorScheme);
    }
  }, []);

  // Apply the theme mode
  useEffect(() => {
    const root = document.documentElement;
    
    // Check if mode is system, and if so, use system preference
    if (mode === 'system') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setIsDark(prefersDark);
      
      if (prefersDark) {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
      
      // Listen for system preference changes
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = (e: MediaQueryListEvent) => {
        setIsDark(e.matches);
        if (e.matches) {
          root.classList.add('dark');
        } else {
          root.classList.remove('dark');
        }
      };
      
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    } else {
      // Explicit light/dark mode
      const shouldBeDark = mode === 'dark';
      setIsDark(shouldBeDark);
      
      if (shouldBeDark) {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    }
    
    // Save to localStorage
    localStorage.setItem('theme-mode', mode);
  }, [mode]);

  // Apply the color scheme
  useEffect(() => {
    const root = document.documentElement;
    
    // Clear previous scheme
    root.classList.remove(
      'theme-blue',
      'theme-purple',
      'theme-green',
      'theme-orange',
      'theme-red',
      'theme-teal',
      'theme-pink'
    );
    
    // Apply new scheme
    root.classList.add(`theme-${colorScheme}`);
    
    // Save to localStorage
    localStorage.setItem('theme-color', colorScheme);
  }, [colorScheme]);

  const handleSetMode = (newMode: ThemeMode) => {
    try {
      setMode(newMode);
    } catch (error) {
      console.error('Failed to set theme mode:', error);
    }
  };

  const handleSetColorScheme = (newScheme: ColorScheme) => {
    try {
      setColorScheme(newScheme);
    } catch (error) {
      console.error('Failed to set color scheme:', error);
    }
  };

  return (
    <ThemeContext.Provider 
      value={{ 
        mode, 
        colorScheme, 
        setMode: handleSetMode, 
        setColorScheme: handleSetColorScheme,
        isDark
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};