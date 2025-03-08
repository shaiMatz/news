import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';

/**
 * Badge component to display location information
 * 
 * @param {Object} props
 * @param {string} props.location - The location name to display
 * @param {boolean} props.small - Whether to use small size variant
 */
export default function LocationBadge({ location, small = false }) {
  if (!location) return null;
  
  return (
    <View style={[styles.container, small && styles.smallContainer]}>
      <Feather 
        name="map-pin" 
        size={small ? 10 : 12} 
        color="#FFFFFF" 
        style={styles.icon} 
      />
      <Text style={[styles.text, small && styles.smallText]}>
        {location}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  smallContainer: {
    paddingHorizontal: 6,
    paddingVertical: 3,
  },
  icon: {
    marginRight: 4,
  },
  text: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '500',
  },
  smallText: {
    fontSize: 10,
  },
});
