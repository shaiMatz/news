import React from 'react';
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
 */
export default function NewsStream({ 
  news = [], 
  onNewsPress, 
  isAuthenticated = false,
  refreshControl
}) {
  const navigation = useNavigation();
  const { theme } = useTheme();
  const maxFreeContent = 10;
  
  const handleNewsPress = (newsItem) => {
    if (onNewsPress) {
      onNewsPress(newsItem);
    }
  };

  const renderNewsItem = ({ item, index }) => {
    // Add premium flag for content beyond the free limit
    const isPremium = !isAuthenticated && index >= maxFreeContent;
    const newsWithPremiumFlag = isPremium ? { ...item, premium: true } : item;
    
    return (
      <NewsCard 
        news={newsWithPremiumFlag} 
        onPress={() => handleNewsPress(item)}
      />
    );
  };

  const renderFooter = () => {
    if (!isAuthenticated && news.length > maxFreeContent) {
      return (
        <View style={[
          styles.loginPromptContainer, 
          { backgroundColor: theme.cardBackground }
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
            Sign up for free to access all content, upload your own news, and more.
          </Text>
          <TouchableOpacity 
            style={[
              styles.loginButton,
              { backgroundColor: theme.primary }
            ]}
            onPress={() => navigation.navigate('Auth')}
          >
            <Text style={styles.loginButtonText}>Sign up / Login</Text>
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
    </View>
  );

  return (
    <FlatList
      data={isAuthenticated ? news : news.slice(0, maxFreeContent)}
      renderItem={renderNewsItem}
      keyExtractor={(item) => item.id.toString()}
      contentContainerStyle={styles.container}
      ListFooterComponent={renderFooter}
      ListEmptyComponent={renderEmptyComponent}
      refreshControl={refreshControl}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    paddingBottom: 32,
  },
  loginPromptContainer: {
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    padding: 20,
    marginTop: 8,
    alignItems: 'center',
  },
  loginPromptTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 8,
    textAlign: 'center',
  },
  loginPromptText: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 16,
  },
  loginButton: {
    flexDirection: 'row',
    backgroundColor: '#2563EB',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    marginRight: 8,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1E293B',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 8,
    maxWidth: 250,
  },
});
