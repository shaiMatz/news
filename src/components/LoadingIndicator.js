import React from 'react';
import { View, ActivityIndicator, Text, StyleSheet } from 'react-native';

/**
 * Loading indicator component
 * 
 * @param {Object} props
 * @param {string} props.size - The size of the loading indicator ('small', 'large')
 * @param {string} props.color - The color of the loading indicator
 * @param {string} props.message - Optional message to display below the indicator
 */
export default function LoadingIndicator({ 
  size = 'large', 
  color = '#2563EB', 
  message = 'Loading...'
}) {
  return (
    <View style={styles.container}>
      <ActivityIndicator size={size} color={color} />
      {message && <Text style={styles.message}>{message}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#FFFFFF',
  },
  message: {
    marginTop: 12,
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
  },
});
