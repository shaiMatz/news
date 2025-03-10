import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Platform } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useNetworkStatus, getNetworkStatusMessage } from '../utils/connectivityUtils';
import { useTheme } from '../contexts/ThemeContext';

/**
 * Banner component to display network connectivity status
 * Automatically shows/hides based on network state
 * 
 * @param {Object} props
 * @param {Function} props.onRetry - Function to call when retry button is pressed
 * @param {boolean} props.showOfflineOnly - Only show for offline status (not server issues)
 */
export default function NetworkStatusBanner({ 
  onRetry,
  showOfflineOnly = false,
}) {
  const { theme } = useTheme();
  const networkStatus = useNetworkStatus();
  const [message, setMessage] = useState(null);
  const [bannerHeight] = useState(new Animated.Value(0));
  const [isVisible, setIsVisible] = useState(false);
  
  useEffect(() => {
    // Get appropriate message based on network status
    const statusMessage = getNetworkStatusMessage(networkStatus);
    
    // If there's a message and we should show it
    if (statusMessage && 
        (!showOfflineOnly || (showOfflineOnly && !networkStatus.isOnline))
    ) {
      setMessage(statusMessage);
      setIsVisible(true);
      
      // Animate banner in
      Animated.timing(bannerHeight, {
        toValue: 46,
        duration: 300,
        useNativeDriver: false,
      }).start();
    } 
    // If there's no message or we shouldn't show it
    else if (isVisible) {
      // Animate banner out
      Animated.timing(bannerHeight, {
        toValue: 0,
        duration: 300,
        useNativeDriver: false,
      }).start(() => {
        setIsVisible(false);
        setMessage(null);
      });
    }
  }, [networkStatus, showOfflineOnly]);
  
  // If not visible, don't render anything
  if (!isVisible) return null;
  
  // Based on status, determine icon and color
  const isOffline = !networkStatus.isOnline;
  const icon = isOffline ? 'wifi-off' : 'server';
  
  return (
    <Animated.View 
      style={[
        styles.container,
        { 
          height: bannerHeight,
          backgroundColor: isOffline ? theme.warning : theme.error,
        },
        Platform.OS === 'web' && styles.webContainer
      ]}
    >
      <View style={styles.content}>
        <Feather name={icon} size={16} color="#FFFFFF" style={styles.icon} />
        <Text style={styles.message}>{message}</Text>
        
        {onRetry && (
          <TouchableOpacity 
            style={styles.retryButton} 
            onPress={onRetry}
            accessibilityLabel="Retry connection"
          >
            <Feather name="refresh-cw" size={14} color="#FFFFFF" />
          </TouchableOpacity>
        )}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    overflow: 'hidden',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 999,
  },
  webContainer: {
    position: 'fixed',
    top: 0,
  },
  content: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  icon: {
    marginRight: 8,
  },
  message: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  retryButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
});