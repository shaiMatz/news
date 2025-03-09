import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { getUnreadNotificationCount } from '../services/notifications';

/**
 * NotificationBadge component for displaying unread notification count
 * 
 * @param {Object} props
 * @param {number} props.count - The number of unread notifications (optional)
 * @param {boolean} props.autoUpdate - Whether to automatically update the count (default: true)
 * @param {number} props.updateInterval - Interval in ms to update count (default: 60000)
 */
export default function NotificationBadge({ count: initialCount, autoUpdate = true, updateInterval = 60000 }) {
  const { theme } = useTheme();
  const [count, setCount] = useState(initialCount || 0);
  const [scale] = useState(new Animated.Value(1));
  
  // Effect to fetch and update notification count
  useEffect(() => {
    // Only auto update if not provided a specific count
    if (autoUpdate && initialCount === undefined) {
      // Immediately fetch unread count
      fetchUnreadCount();
      
      // Set up interval to refresh count
      const intervalId = setInterval(fetchUnreadCount, updateInterval);
      
      return () => clearInterval(intervalId);
    } else if (initialCount !== undefined) {
      setCount(initialCount);
    }
  }, [initialCount, autoUpdate, updateInterval]);
  
  // Effect to animate when count changes
  useEffect(() => {
    if (count > 0) {
      Animated.sequence([
        Animated.timing(scale, {
          toValue: 1.3,
          duration: 150,
          useNativeDriver: true
        }),
        Animated.timing(scale, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true
        })
      ]).start();
    }
  }, [count, scale]);
  
  // Function to fetch unread notification count
  const fetchUnreadCount = async () => {
    try {
      const newCount = await getUnreadNotificationCount();
      setCount(newCount);
    } catch (error) {
      console.error('Failed to fetch notification count:', error);
    }
  };
  
  // Don't render if no notifications
  if (count <= 0) return null;
  
  return (
    <Animated.View 
      style={[
        styles.badge, 
        { 
          backgroundColor: theme.colors.notification,
          transform: [{ scale: scale }] 
        }
      ]}
    >
      <Text style={[styles.text, { color: theme.colors.textLight }]}>
        {count > 99 ? '99+' : count}
      </Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  badge: {
    position: 'absolute',
    top: -5,
    right: -8,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 2,
    zIndex: 10
  },
  text: {
    fontSize: 10,
    fontWeight: 'bold',
  }
});