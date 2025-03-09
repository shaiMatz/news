import React, { createContext, useState, useContext, useEffect } from 'react';
import { useColorScheme } from 'react-native';

// Define our theme colors
export const themes = {
  light: {
    name: 'light',
    background: '#FFFFFF',
    backgroundSecondary: '#F8FAFC',
    text: '#1E293B',
    textSecondary: '#64748B',
    textMuted: '#94A3B8',
    border: '#E2E8F0',
    borderSecondary: '#CBD5E1',
    primary: '#2563EB',
    primaryLight: '#3B82F6',
    success: '#10B981',
    danger: '#EF4444',
    warning: '#F59E0B',
    highlight: '#F8FAFC',
    card: '#FFFFFF',
    cardBackground: '#FFFFFF',
    shadow: 'rgba(0, 0, 0, 0.1)',
    isDark: false,
  },
  dark: {
    name: 'dark',
    background: '#0F172A',
    backgroundSecondary: '#1E293B',
    text: '#F8FAFC',
    textSecondary: '#CBD5E1',
    textMuted: '#94A3B8',
    border: '#334155',
    borderSecondary: '#475569',
    primary: '#3B82F6',
    primaryLight: '#60A5FA',
    success: '#10B981',
    danger: '#EF4444',
    warning: '#F59E0B',
    highlight: '#1E293B',
    card: '#1E293B',
    cardBackground: '#1E293B',
    shadow: 'rgba(0, 0, 0, 0.3)',
    isDark: true,
  }
};

// Create context
const ThemeContext = createContext({
  theme: themes.light,
  isDarkMode: false,
  toggleTheme: () => {},
});

// Provider component
export function ThemeProvider({ children }) {
  // Get device color scheme preference
  const colorScheme = useColorScheme();
  
  // State for theme mode
  const [isDarkMode, setIsDarkMode] = useState(colorScheme === 'dark');
  
  // Update theme when device settings change
  useEffect(() => {
    setIsDarkMode(colorScheme === 'dark');
  }, [colorScheme]);
  
  // Get current theme based on mode
  const theme = isDarkMode ? themes.dark : themes.light;
  
  // Toggle between light and dark mode
  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
  };
  
  return (
    <ThemeContext.Provider value={{ theme, isDarkMode, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

// Custom hook to use the theme context
export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}