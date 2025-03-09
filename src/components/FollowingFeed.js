import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  ActivityIndicator,
  TouchableOpacity,
  RefreshControl 
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import NewsCard from './NewsCard';
import LoadingIndicator from './LoadingIndicator';

/**
 * FollowingFeed component displays news from users that the current user follows
 * 
 * @param {Object} props
 * @param {number} props.limit - Maximum number of items to display
 * @param {boolean} props.compact - Whether to use compact NewsCard
 * @param {Function} props.onEmpty - Function to call when no following content is available
 */
export default function FollowingFeed({ 
  limit = 10, 
  compact = false,
  onEmpty = null
}) {
  const navigation = useNavigation();
  const { user } = useAuth();
  const { theme } = useTheme();
  const [feed, setFeed] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  
  const loadFeed = async (isRefreshing = false) => {
    if (!user) {
      setFeed([]);
      setLoading(false);
      return;
    }
    
    try {
      if (!isRefreshing) {
        setLoading(true);
      }
      setError(null);
      
      const response = await fetch(`/api/user/feed?limit=${limit}`);
      
      if (!response.ok) {
        throw new Error('Failed to load following feed');
      }
      
      const feedData = await response.json();
      setFeed(feedData);
      
      // Call onEmpty callback if there's no content and the callback is provided
      if (feedData.length === 0 && onEmpty) {
        onEmpty();
      }
    } catch (err) {
      console.error('Error loading following feed:', err);
      setError('Failed to load feed');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };
  
  useEffect(() => {
    loadFeed();
  }, [user, limit]);
  
  const handleRefresh = () => {
    setRefreshing(true);
    loadFeed(true);
  };
  
  const handleNewsPress = (newsItem) => {
    navigation.navigate('NewsDetail', { newsId: newsItem.id, newsItem });
  };
  
  if (!user) {
    return (
      <View style={[styles.emptyContainer, { backgroundColor: theme.backgroundSecondary }]}>
        <Feather name="users" size={48} color={theme.textMuted} />
        <Text style={[styles.emptyTitle, { color: theme.text }]}>
          Sign in to see followed content
        </Text>
        <Text style={[styles.emptySubtitle, { color: theme.textSecondary }]}>
          Follow users to see their news in your feed
        </Text>
        <TouchableOpacity
          style={[styles.signInButton, { backgroundColor: theme.primary }]}
          onPress={() => navigation.navigate('Auth')}
        >
          <Text style={styles.signInButtonText}>Sign In</Text>
        </TouchableOpacity>
      </View>
    );
  }
  
  if (loading) {
    return <LoadingIndicator />;
  }
  
  if (error) {
    return (
      <View style={[styles.errorContainer, { backgroundColor: theme.backgroundSecondary }]}>
        <Feather name="alert-circle" size={48} color={theme.danger} />
        <Text style={[styles.errorText, { color: theme.danger }]}>{error}</Text>
        <TouchableOpacity
          style={[styles.retryButton, { backgroundColor: theme.primary }]}
          onPress={() => loadFeed()}
        >
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }
  
  if (feed.length === 0) {
    return (
      <View style={[styles.emptyContainer, { backgroundColor: theme.backgroundSecondary }]}>
        <Feather name="users" size={48} color={theme.textMuted} />
        <Text style={[styles.emptyTitle, { color: theme.text }]}>
          No content from followed users
        </Text>
        <Text style={[styles.emptySubtitle, { color: theme.textSecondary }]}>
          Follow more users to see their news in your feed
        </Text>
        <TouchableOpacity
          style={[styles.findButton, { backgroundColor: theme.primary }]}
          onPress={() => navigation.navigate('Explore')}
        >
          <Text style={styles.findButtonText}>Find Users</Text>
        </TouchableOpacity>
      </View>
    );
  }
  
  return (
    <FlatList
      data={feed}
      renderItem={({ item }) => (
        <NewsCard 
          news={item} 
          compact={compact} 
          onPress={handleNewsPress}
        />
      )}
      keyExtractor={item => item.id.toString()}
      contentContainerStyle={styles.listContent}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={handleRefresh}
          colors={[theme.primary]}
          tintColor={theme.primary}
        />
      }
    />
  );
}

const styles = StyleSheet.create({
  listContent: {
    padding: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1E293B',
    marginTop: 16,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#64748B',
    marginTop: 8,
    textAlign: 'center',
    marginBottom: 24,
  },
  signInButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  signInButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  findButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  findButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
  },
  errorText: {
    fontSize: 16,
    color: '#EF4444',
    marginTop: 16,
    marginBottom: 24,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});