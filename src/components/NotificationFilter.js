import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';

/**
 * NotificationFilter component for filtering notifications by type
 * 
 * @param {Object} props
 * @param {Array} props.selectedFilters - Array of selected filter types
 * @param {Function} props.onFilterChange - Callback when filters change
 */
export default function NotificationFilter({ selectedFilters = [], onFilterChange }) {
  const { theme } = useTheme();
  
  // Available notification types with their icons and colors
  const filterTypes = [
    { id: 'all', label: 'All', icon: 'inbox', color: theme.primary },
    { id: 'news', label: 'News', icon: 'file-text', color: theme.primary },
    { id: 'like', label: 'Likes', icon: 'heart', color: theme.danger },
    { id: 'comment', label: 'Comments', icon: 'message-circle', color: theme.success },
    { id: 'mention', label: 'Mentions', icon: 'at-sign', color: '#7C3AED' },
    { id: 'stream', label: 'Streams', icon: 'video', color: '#F59E0B' },
    { id: 'system', label: 'System', icon: 'settings', color: theme.textSecondary },
  ];
  
  // If no filters are selected, default to 'all'
  const effectiveFilters = selectedFilters.length === 0 ? ['all'] : selectedFilters;
  
  const handleFilterPress = (filterId) => {
    let newFilters;
    
    // Handle the 'all' filter specially
    if (filterId === 'all') {
      // If 'all' is being selected, clear other filters
      newFilters = ['all'];
    } else {
      // If another filter is being selected
      if (effectiveFilters.includes(filterId)) {
        // Remove the filter if it's already selected
        newFilters = effectiveFilters.filter(id => id !== filterId);
      } else {
        // Add the filter and remove 'all' if it was selected
        newFilters = [...effectiveFilters.filter(id => id !== 'all'), filterId];
      }
      
      // If no filters remain, default back to 'all'
      if (newFilters.length === 0) {
        newFilters = ['all'];
      }
    }
    
    onFilterChange(newFilters);
  };
  
  return (
    <View style={[styles.container, { borderBottomColor: theme.border }]}>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {filterTypes.map((filter) => {
          const isSelected = effectiveFilters.includes(filter.id);
          
          return (
            <TouchableOpacity
              key={filter.id}
              style={[
                styles.filterButton,
                { borderColor: filter.color },
                isSelected && { backgroundColor: filter.color }
              ]}
              onPress={() => handleFilterPress(filter.id)}
            >
              <Feather 
                name={filter.icon} 
                size={16} 
                color={isSelected ? '#FFFFFF' : filter.color} 
              />
              <Text 
                style={[
                  styles.filterLabel,
                  { color: isSelected ? '#FFFFFF' : theme.text }
                ]}
              >
                {filter.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    padding: 12,
    paddingBottom: 16,
  },
  scrollContent: {
    paddingRight: 20,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 8,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 6,
  },
});