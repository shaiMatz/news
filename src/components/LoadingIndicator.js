import React from 'react';
import { View, ActivityIndicator, Text, StyleSheet } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';

/**
 * Loading indicator component
 * 
 * @param {Object} props
 * @param {string} props.size - The size of the loading indicator ('small', 'large')
 * @param {string} props.color - The color of the loading indicator (optional, uses theme by default)
 * @param {string} props.message - Optional message to display below the indicator
 */
export default function LoadingIndicator({ 
  size = 'large', 
  color, 
  message = 'Loading...'
}) {
  const { theme } = useTheme();
  const indicatorColor = color || theme.primary;
  
  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <ActivityIndicator size={size} color={indicatorColor} />
      {message && <Text style={[styles.message, { color: theme.textSecondary }]}>{message}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  message: {
    marginTop: 12,
    fontSize: 14,
    textAlign: 'center',
  },
});
