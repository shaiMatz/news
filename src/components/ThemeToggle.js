import React from 'react';
import { TouchableOpacity, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';

/**
 * Theme toggle component for switching between light and dark mode
 * 
 * @param {Object} props
 * @param {Object} props.style - Additional style to apply to the component
 */
export default function ThemeToggle({ style }) {
  const { isDarkMode, toggleTheme, theme } = useTheme();
  
  return (
    <TouchableOpacity 
      style={[styles.container, { backgroundColor: theme.backgroundSecondary }, style]}
      onPress={toggleTheme}
      activeOpacity={0.7}
    >
      <Feather 
        name={isDarkMode ? 'sun' : 'moon'} 
        size={20} 
        color={isDarkMode ? theme.warning : theme.primary} 
      />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  }
});