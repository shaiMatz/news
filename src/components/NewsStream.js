import React, { useMemo } from 'react';
import { FlatList, View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import NewsCard from './NewsCard';
import { Feather } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useNavigation } from '@react-navigation/native';

/**
 * NewsStream component displaying a list of news items
 * 
 * @param {Object} props
 * @param {Array} props.news - List of news items to display
 * @param {Function} props.onNewsPress - Function to handle news item press
 * @param {boolean} props.isAuthenticated - Whether the user is authenticated
 * @param {Object} props.refreshControl - RefreshControl component
 * @param {Object} props.freemiumMeta - Metadata about freemium restrictions
 * @param {number} props.freemiumMeta.freeLimit - Number of free items for non-authenticated users
 */
export default function NewsStream({ 
  news = [], 
  onNewsPress, 
  isAuthenticated = false,
  refreshControl,
  freemiumMeta = null
}) {
  const navigation = useNavigation();
  const { theme } = useTheme();
  
  // Default to 10 if not provided by the API
  const maxFreeContent = useMemo(() => 
    (freemiumMeta?.freeLimit) || 10, 
  [freemiumMeta]);
  
  const hasMoreContent = useMemo(() => 
    !isAuthenticated && (news.length > maxFreeContent || (freemiumMeta?.hasMoreContent)),
  [isAuthenticated, news.length, maxFreeContent, freemiumMeta]);
  
  // Process news items to include freemium information
  const processedNews = useMemo(() => {
    // If user is authenticated, show all news
    if (isAuthenticated) return news;
    
    // For non-authenticated users, apply freemium restrictions
    return news.map((item, index) => {
      // Mark items beyond the free limit as restricted
      if (index >= maxFreeContent) {
        return {
          ...item,
          freemiumRestricted: true
        };
      }
      return item;
    }).slice(0, news.length); // Keep all items for UI purposes
  }, [news, isAuthenticated, maxFreeContent]);
  
  const displayedNews = useMemo(() => {
    // For UI display, we'll show all items but with restricted flags
    return processedNews;
  }, [processedNews]);
  
  const handleNewsPress = (newsItem) => {
    if (onNewsPress) {
      onNewsPress(newsItem);
    }
  };

  const renderNewsItem = ({ item, index }) => {
    const freemiumRestricted = !isAuthenticated && index >= maxFreeContent;
    
    return (
      <NewsCard 
        news={item} 
        onPress={() => handleNewsPress(item)}
        freemiumRestricted={freemiumRestricted}
      />
    );
  };

  const renderFooter = () => {
    if (hasMoreContent) {
      return (
        <View style={[
          styles.loginPromptContainer, 
          { 
            backgroundColor: theme.cardBackground,
            borderColor: theme.border
          }
        ]}>
          <Text style={[
            styles.loginPromptTitle,
            { color: theme.text }
          ]}>
            Want to see more news?
          </Text>
          <Text style={[
            styles.loginPromptText,
            { color: theme.textSecondary }
          ]}>
            Sign in for free to access all content, upload your own news, and interact with the community.
          </Text>
          <View style={styles.benefitsContainer}>
            <View style={styles.benefitRow}>
              <Feather name="check-circle" size={16} color={theme.success} />
              <Text style={[styles.benefitText, { color: theme.text }]}>
                Unlimited news access
              </Text>
            </View>
            <View style={styles.benefitRow}>
              <Feather name="check-circle" size={16} color={theme.success} />
              <Text style={[styles.benefitText, { color: theme.text }]}>
                Share your own news
              </Text>
            </View>
            <View style={styles.benefitRow}>
              <Feather name="check-circle" size={16} color={theme.success} />
              <Text style={[styles.benefitText, { color: theme.text }]}>
                Like and comment
              </Text>
            </View>
            <View style={styles.benefitRow}>
              <Feather name="check-circle" size={16} color={theme.success} />
              <Text style={[styles.benefitText, { color: theme.text }]}>
                Get location-based alerts
              </Text>
            </View>
          </View>
          <TouchableOpacity 
            style={[
              styles.loginButton,
              { backgroundColor: theme.primary }
            ]}
            onPress={() => navigation.navigate('Auth')}
          >
            <Text style={styles.loginButtonText}>Sign In</Text>
            <Feather name="arrow-right" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      );
    }
    return null;
  };

  const renderEmptyComponent = () => (
    <View style={styles.emptyContainer}>
      <Feather 
        name="inbox" 
        size={64} 
        color={theme.isDark ? theme.border : "#E2E8F0"} 
      />
      <Text style={[
        styles.emptyText,
        { color: theme.text }
      ]}>
        No news available
      </Text>
      <Text style={[
        styles.emptySubtext,
        { color: theme.textSecondary }
      ]}>
        Check back later for news updates in your area
      </Text>
      
      {isAuthenticated && (
        <TouchableOpacity 
          style={[styles.uploadButton, { backgroundColor: theme.primary }]}
          onPress={() => navigation.navigate('UploadNews')}
        >
          <Feather name="upload" size={16} color="#FFFFFF" style={styles.uploadIcon} />
          <Text style={styles.uploadButtonText}>Share News</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <FlatList
      data={displayedNews}
      renderItem={renderNewsItem}
      keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
      contentContainerStyle={[
        styles.container,
        displayedNews.length === 0 && styles.emptyList
      ]}
      ListFooterComponent={renderFooter}
      ListEmptyComponent={renderEmptyComponent}
      refreshControl={refreshControl}
      showsVerticalScrollIndicator={false}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    paddingBottom: 32,
  },
  emptyList: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  loginPromptContainer: {
    borderRadius: 12,
    padding: 20,
    marginTop: 24,
    marginBottom: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  loginPromptTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  loginPromptText: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 20,
  },
  benefitsContainer: {
    alignSelf: 'stretch',
    marginBottom: 20,
  },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  benefitText: {
    marginLeft: 8,
    fontSize: 14,
  },
  loginButton: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 200,
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    marginRight: 8,
    fontSize: 16,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    flex: 1,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
    maxWidth: 250,
    marginBottom: 24,
    lineHeight: 20,
  },
  uploadButton: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadIcon: {
    marginRight: 8,
  },
  uploadButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
