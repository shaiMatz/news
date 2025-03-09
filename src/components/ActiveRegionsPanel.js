import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { API_URL } from '../services/api';

/**
 * ActiveRegionsPanel component displays regions with recent news activity
 * 
 * @param {Object} props
 * @param {Function} props.onRegionSelect - Callback when a region is selected
 * @param {number} props.refreshInterval - Refresh interval in ms (default: 60000)
 * @param {number} props.limit - Maximum number of regions to display (default: 5)
 * @param {number} props.activeWithinMinutes - Only show regions with activity within this time (default: 60)
 * @param {boolean} props.autoRefresh - Whether to auto-refresh (default: true)
 */
export default function ActiveRegionsPanel({
  onRegionSelect,
  refreshInterval = 60000,
  limit = 5,
  activeWithinMinutes = 60,
  autoRefresh = true
}) {
  const { theme } = useTheme();
  const [regions, setRegions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  // Fetch active regions
  const fetchActiveRegions = useCallback(async () => {
    try {
      setError(null);
      
      // Build query parameters
      const queryParams = new URLSearchParams();
      queryParams.append('limit', limit.toString());
      queryParams.append('activeWithinMinutes', activeWithinMinutes.toString());
      
      // Fetch from API
      const response = await fetch(`${API_URL}/api/news/active-regions?${queryParams.toString()}`);
      
      if (!response.ok) {
        throw new Error(`Error fetching active regions: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Update state
      setRegions(data.regions || []);
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Error fetching active regions:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [limit, activeWithinMinutes]);

  // Initial fetch
  useEffect(() => {
    fetchActiveRegions();
  }, [fetchActiveRegions]);

  // Auto-refresh
  useEffect(() => {
    if (!autoRefresh) return;
    
    const intervalId = setInterval(() => {
      fetchActiveRegions();
    }, refreshInterval);
    
    return () => clearInterval(intervalId);
  }, [autoRefresh, fetchActiveRegions, refreshInterval]);

  const handleRefresh = () => {
    setLoading(true);
    fetchActiveRegions();
  };

  const handleRegionSelect = (region) => {
    if (onRegionSelect) {
      onRegionSelect(region);
    }
  };

  // Format relative time for last activity
  const formatRelativeTime = (timestamp) => {
    const now = Date.now();
    const diff = now - timestamp;
    
    if (diff < 60000) {
      return 'Just now';
    } else if (diff < 3600000) {
      const minutes = Math.floor(diff / 60000);
      return `${minutes}m ago`;
    } else if (diff < 86400000) {
      const hours = Math.floor(diff / 3600000);
      return `${hours}h ago`;
    } else {
      const days = Math.floor(diff / 86400000);
      return `${days}d ago`;
    }
  };

  const renderRegionItem = ({ item }) => (
    <TouchableOpacity 
      style={[
        styles.regionItem, 
        { backgroundColor: theme.cardBackground, borderColor: theme.border }
      ]}
      onPress={() => handleRegionSelect(item)}
    >
      <View style={styles.regionInfo}>
        <Text style={[styles.regionName, { color: theme.text }]}>{item.name}</Text>
        <Text style={[styles.regionDetails, { color: theme.textSecondary }]}>
          {item.newsItemsCount} stories • {formatRelativeTime(item.lastActivity)}
        </Text>
      </View>
      
      <View style={styles.activityIndicator}>
        <Text style={[styles.activityCount, { color: theme.primary }]}>
          {item.activityCount}
        </Text>
        <Feather name="activity" size={12} color={theme.primary} />
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundSecondary }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <View style={styles.headerTitleContainer}>
          <Feather name="map-pin" size={18} color={theme.primary} style={styles.headerIcon} />
          <Text style={[styles.headerTitle, { color: theme.text }]}>
            Active Regions
          </Text>
        </View>
        
        <TouchableOpacity onPress={handleRefresh} style={styles.refreshButton}>
          <Feather name="refresh-cw" size={16} color={theme.primary} />
        </TouchableOpacity>
      </View>
      
      {/* Content */}
      <View style={styles.content}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator color={theme.primary} size="small" />
            <Text style={[styles.loadingText, { color: theme.textSecondary }]}>
              Finding active regions...
            </Text>
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <Feather name="alert-circle" size={24} color={theme.danger} style={styles.errorIcon} />
            <Text style={[styles.errorText, { color: theme.danger }]}>
              {error}
            </Text>
            <TouchableOpacity 
              style={[styles.retryButton, { backgroundColor: theme.primary }]}
              onPress={handleRefresh}
            >
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : regions.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Feather name="map" size={24} color={theme.textSecondary} style={styles.emptyIcon} />
            <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
              No active regions at the moment
            </Text>
          </View>
        ) : (
          <FlatList
            data={regions}
            renderItem={renderRegionItem}
            keyExtractor={(item) => item.name}
            contentContainerStyle={styles.listContainer}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>
      
      {/* Footer with last updated time */}
      {lastUpdated && (
        <View style={[styles.footer, { borderTopColor: theme.border }]}>
          <Text style={[styles.lastUpdatedText, { color: theme.textSecondary }]}>
            Showing regions with activity in the last {activeWithinMinutes} minutes
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerIcon: {
    marginRight: 8,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  refreshButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    minHeight: 150,
  },
  loadingContainer: {
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 8,
    fontSize: 14,
  },
  errorContainer: {
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorIcon: {
    marginBottom: 8,
  },
  errorText: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
  emptyContainer: {
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyIcon: {
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
  },
  listContainer: {
    padding: 12,
  },
  regionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
  },
  regionInfo: {
    flex: 1,
  },
  regionName: {
    fontSize: 15,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  regionDetails: {
    fontSize: 12,
  },
  activityIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(37, 99, 235, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  activityCount: {
    fontSize: 14,
    fontWeight: 'bold',
    marginRight: 4,
  },
  footer: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    alignItems: 'center',
  },
  lastUpdatedText: {
    fontSize: 10,
  },
});