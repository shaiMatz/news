import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import NewsCard from './NewsCard';
import LocationBadge from './LocationBadge';
import { API_URL } from '../services/api';

/**
 * TrendingNewsStream component for displaying real-time trending news items
 * 
 * @param {Object} props
 * @param {string} props.timeframe - Time window for trending calculation ('last15m', 'lastHour', 'last24h', 'total')
 * @param {string} props.region - Optional region to filter by
 * @param {number} props.refreshInterval - Interval in ms for auto-refresh (default: 30000)
 * @param {number} props.maxItems - Maximum number of items to display (default: 5)
 * @param {boolean} props.autoRefresh - Whether to auto-refresh (default: true)
 * @param {Function} props.onNewsPress - Function to handle news item press
 */
export default function TrendingNewsStream({
  timeframe = 'lastHour',
  region = null,
  refreshInterval = 30000,
  maxItems = 5,
  autoRefresh = true,
  onNewsPress
}) {
  const { theme } = useTheme();
  const { user } = useAuth();
  const navigation = useNavigation();
  const [trendingNews, setTrendingNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [timeframeLabel, setTimeframeLabel] = useState('Last Hour');

  // Map timeframe to human-readable label
  useEffect(() => {
    switch (timeframe) {
      case 'last15m':
        setTimeframeLabel('Last 15 Minutes');
        break;
      case 'lastHour':
        setTimeframeLabel('Last Hour');
        break;
      case 'last24h':
        setTimeframeLabel('Last 24 Hours');
        break;
      case 'total':
        setTimeframeLabel('All Time');
        break;
      default:
        setTimeframeLabel('Last Hour');
    }
  }, [timeframe]);

  // Fetch trending news
  const fetchTrendingNews = useCallback(async () => {
    try {
      setError(null);
      
      // Build query parameters
      const queryParams = new URLSearchParams();
      queryParams.append('timeframe', timeframe);
      queryParams.append('limit', maxItems.toString());
      if (region) {
        queryParams.append('region', region);
      }
      
      // Fetch from API
      const response = await fetch(`${API_URL}/api/realtime-trending?${queryParams.toString()}`, {
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error(`Error fetching trending news: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Update state
      setTrendingNews(data.news || []);
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Error fetching trending news:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [timeframe, region, maxItems]);

  // Initial fetch
  useEffect(() => {
    fetchTrendingNews();
  }, [fetchTrendingNews]);

  // Auto-refresh
  useEffect(() => {
    if (!autoRefresh) return;
    
    const intervalId = setInterval(() => {
      fetchTrendingNews();
    }, refreshInterval);
    
    return () => clearInterval(intervalId);
  }, [autoRefresh, fetchTrendingNews, refreshInterval]);

  const handleRefresh = () => {
    setLoading(true);
    fetchTrendingNews();
  };

  const handleNewsPress = (newsItem) => {
    if (onNewsPress) {
      onNewsPress(newsItem);
    } else {
      navigation.navigate('NewsDetail', { newsId: newsItem.id, newsItem });
    }
  };

  const renderNewsItem = ({ item, index }) => {
    const freemiumRestricted = !user && index >= 2; // For demo, restrict after 2 items for non-authenticated users
    
    return (
      <View style={styles.newsItemContainer}>
        <NewsCard 
          news={item} 
          compact={true}
          onPress={() => handleNewsPress(item)}
          freemiumRestricted={freemiumRestricted}
        />
        
        {/* Trending indicators */}
        <View style={[styles.trendingIndicator, { backgroundColor: theme.cardBackground }]}>
          <View style={styles.scoreContainer}>
            <Feather name="trending-up" size={14} color={theme.primary} />
            <Text style={[styles.scoreText, { color: theme.primary }]}>
              {item.trendScore}
            </Text>
          </View>
          
          <View style={styles.activityContainer}>
            {item.trendingActivities?.view > 0 && (
              <View style={styles.activityItem}>
                <Feather name="eye" size={12} color={theme.textSecondary} />
                <Text style={[styles.activityText, { color: theme.textSecondary }]}>
                  {item.trendingActivities.view}
                </Text>
              </View>
            )}
            
            {item.trendingActivities?.like > 0 && (
              <View style={styles.activityItem}>
                <Feather name="heart" size={12} color={theme.primary} />
                <Text style={[styles.activityText, { color: theme.primary }]}>
                  {item.trendingActivities.like}
                </Text>
              </View>
            )}
            
            {item.trendingActivities?.comment > 0 && (
              <View style={styles.activityItem}>
                <Feather name="message-circle" size={12} color={theme.textSecondary} />
                <Text style={[styles.activityText, { color: theme.textSecondary }]}>
                  {item.trendingActivities.comment}
                </Text>
              </View>
            )}
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundSecondary }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <View style={styles.headerTitleContainer}>
          <Feather name="trending-up" size={18} color={theme.primary} style={styles.headerIcon} />
          <Text style={[styles.headerTitle, { color: theme.text }]}>
            Trending News
          </Text>
          {region && (
            <LocationBadge location={region} small={true} />
          )}
        </View>
        
        <View style={styles.headerRightContainer}>
          <Text style={[styles.timeframeText, { color: theme.textSecondary }]}>
            {timeframeLabel}
          </Text>
          
          <TouchableOpacity onPress={handleRefresh} style={styles.refreshButton}>
            <Feather name="refresh-cw" size={16} color={theme.primary} />
          </TouchableOpacity>
        </View>
      </View>
      
      {/* Content */}
      <View style={styles.content}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator color={theme.primary} size="small" />
            <Text style={[styles.loadingText, { color: theme.textSecondary }]}>
              Loading trending news...
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
        ) : trendingNews.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Feather name="activity" size={24} color={theme.textSecondary} style={styles.emptyIcon} />
            <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
              No trending news available for this time period
            </Text>
          </View>
        ) : (
          <FlatList
            data={trendingNews}
            renderItem={renderNewsItem}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={styles.listContainer}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>
      
      {/* Footer with last updated time */}
      {lastUpdated && (
        <View style={[styles.footer, { borderTopColor: theme.border }]}>
          <Text style={[styles.lastUpdatedText, { color: theme.textSecondary }]}>
            Last updated: {lastUpdated.toLocaleTimeString()}
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
    marginRight: 8,
  },
  headerRightContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeframeText: {
    fontSize: 12,
    marginRight: 8,
  },
  refreshButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    minHeight: 200,
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
    padding: 16,
  },
  newsItemContainer: {
    marginBottom: 12,
    position: 'relative',
  },
  trendingIndicator: {
    position: 'absolute',
    top: 8,
    right: 8,
    borderRadius: 16,
    paddingHorizontal: 8,
    paddingVertical: 4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  scoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 8,
  },
  scoreText: {
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 2,
  },
  activityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 6,
  },
  activityText: {
    fontSize: 10,
    marginLeft: 2,
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