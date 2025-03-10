import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';

/**
 * Reusable error message component with standardized styling and retry functionality
 * 
 * @param {Object} props
 * @param {string} props.message - The error message to display
 * @param {Function} props.onRetry - Function to call when retry button is pressed
 * @param {string} props.icon - Icon name from Feather icon set (default: 'alert-circle')
 * @param {string} props.retryButtonText - Text for the retry button (default: 'Try Again')
 * @param {boolean} props.compact - Use smaller, more compact styling
 * @param {boolean} props.showRetry - Whether to show the retry button (default: true)
 * @param {Object} props.style - Additional styles for the container
 */
export default function ErrorMessage({
  message,
  onRetry,
  icon = 'alert-circle',
  retryButtonText = 'Try Again',
  compact = false,
  showRetry = true,
  style,
}) {
  const { theme } = useTheme();
  
  if (!message) return null;
  
  return (
    <View 
      style={[
        styles.container, 
        compact ? styles.compactContainer : null,
        { backgroundColor: theme.errorBackground },
        style
      ]}
    >
      <View style={styles.messageContainer}>
        <Feather 
          name={icon} 
          size={compact ? 16 : 20} 
          color={theme.error} 
          style={styles.icon} 
        />
        <Text 
          style={[
            styles.messageText, 
            compact ? styles.compactText : null,
            { color: theme.error }
          ]}
        >
          {message}
        </Text>
      </View>
      
      {showRetry && onRetry && (
        <TouchableOpacity 
          style={[
            styles.retryButton, 
            compact ? styles.compactButton : null,
            { backgroundColor: theme.errorButton }
          ]} 
          onPress={onRetry}
        >
          <Text 
            style={[
              styles.retryText, 
              compact ? styles.compactButtonText : null,
              { color: theme.errorButtonText }
            ]}
          >
            {retryButtonText}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 8,
    padding: 12,
    marginVertical: 8,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.15,
        shadowRadius: 2,
      },
      android: {
        elevation: 2,
      },
      web: {
        boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.1)',
      },
    }),
  },
  compactContainer: {
    padding: 8,
    marginVertical: 4,
    borderRadius: 6,
  },
  messageContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  icon: {
    marginRight: 8,
    marginTop: 2,
  },
  messageText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500',
  },
  compactText: {
    fontSize: 12,
    lineHeight: 16,
  },
  retryButton: {
    alignSelf: 'flex-start',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 4,
    marginTop: 4,
  },
  compactButton: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 3,
  },
  retryText: {
    fontSize: 14,
    fontWeight: '600',
  },
  compactButtonText: {
    fontSize: 12,
  },
});