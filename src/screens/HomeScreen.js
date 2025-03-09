import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { View, StyleSheet, Text, RefreshControl, TouchableOpacity, Alert, Button, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../contexts/AuthContext';
import { useLocation } from '../contexts/LocationContext';
import { useTheme } from '../contexts/ThemeContext';
import NewsStream from '../components/NewsStream';
import PremiumBanner from '../components/PremiumBanner';
import LocationBadge from '../components/LocationBadge';
import LoadingIndicator from '../components/LoadingIndicator';
import ThemeToggle from '../components/ThemeToggle';
import TrendingNewsStream from '../components/TrendingNewsStream';
import ActiveRegionsPanel from '../components/ActiveRegionsPanel';
import { fetchNews } from '../services/api';
import { StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';

export default function HomeScreen() {
  const { user } = useAuth();
  const { location, locationName } = useLocation();
  const { theme, isDarkMode } = useTheme();
  const navigation = useNavigation();
  
  // State for news data and metadata
  const [newsData, setNewsData] = useState({
    news: [],
    meta: {
      total: 0,
      freemium: false,
      freeLimit: null,
      hasMoreContent: false
    }
  });
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // Extract news items from state
  const news = useMemo(() => newsData.news || [], [newsData]);
  
  // Check if there are more items available for premium users
  const hasMoreContent = useMemo(() => 
    newsData.meta?.hasMoreContent || false, 
  [newsData]);

  const loadNews = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const locationParams = location ? {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude
      } : {};
      
      const response = await fetchNews(locationParams);
      
      // Handle the updated response format with meta information
      if (response && response.news) {
        setNewsData(response);
      } else {
        // Handle legacy API format for backward compatibility
        setNewsData({
          news: response || [],
          meta: {
            total: (response || []).length,
            freemium: !user,
            freeLimit: !user ? 10 : null,
            hasMoreContent: false
          }
        });
      }
    } catch (err) {
      setError('Failed to load news. Please try again.');
      console.error('Error loading news:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [location, user]);

  useEffect(() => {
    loadNews();
  }, [loadNews, location, user]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadNews();
  };

  const handleNewsPress = (newsItem) => {
    // For non-authenticated users, check if they're trying to access premium content
    if (!user && newsData.meta?.freemium && newsItem.premiumContent) {
      Alert.alert(
        'Premium Content',
        'Please sign in to access this news item.',
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Sign In', 
            onPress: () => navigation.navigate('Auth')
          }
        ]
      );
      return;
    }
    
    navigation.navigate('NewsDetail', { newsId: newsItem.id, newsItem });
  };

  const handleSignInPress = () => {
    navigation.navigate('Auth');
  };

  if (loading && !refreshing) {
    return <LoadingIndicator />;
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.backgroundSecondary }]} edges={['top']}>
      <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} backgroundColor={theme.background} />
      
      <View style={[styles.header, { 
        backgroundColor: theme.background,
        borderBottomColor: theme.border
      }]}>
        <View style={styles.titleContainer}>
          <Text style={[styles.title, { color: theme.text }]}>News Stream</Text>
          {locationName && <LocationBadge location={locationName} />}
        </View>
        
        <View style={styles.headerActions}>
          {user && (
            <TouchableOpacity 
              style={styles.iconButton}
              onPress={() => navigation.navigate('Notifications')}
            >
              <Feather name="bell" size={22} color={theme.textSecondary} />
            </TouchableOpacity>
          )}
          
          <TouchableOpacity 
            style={styles.iconButton}
            onPress={() => navigation.navigate('Search')}
          >
            <Feather name="search" size={22} color={theme.textSecondary} />
          </TouchableOpacity>
          
          <ThemeToggle style={styles.themeToggle} />
        </View>
      </View>
      
      {!user && (
        <PremiumBanner 
          variant="prominent" 
          freeLimit={newsData.meta?.freeLimit || 10} 
          onClose={() => {}} 
        />
      )}
      
      {error ? (
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: theme.danger }]}>{error}</Text>
          <TouchableOpacity 
            style={[styles.retryButton, { backgroundColor: theme.primary }]}
            onPress={loadNews}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          refreshControl={
            <RefreshControl 
              refreshing={refreshing} 
              onRefresh={handleRefresh} 
              tintColor={theme.textSecondary}
              colors={[theme.primary]}
              progressBackgroundColor={theme.backgroundSecondary}
            />
          }
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingBottom: 20 }}
        >
          {/* Real-time trending news section */}
          <View style={{ padding: 16 }}>
            <TrendingNewsStream 
              timeframe="lastHour"
              refreshInterval={30000}
              maxItems={5}
              onNewsPress={handleNewsPress}
            />
          </View>
          
          {/* Active regions panel */}
          {location && (
            <View style={{ paddingHorizontal: 16 }}>
              <ActiveRegionsPanel 
                refreshInterval={60000}
                limit={5}
                activeWithinMinutes={60}
                onRegionSelect={(region) => {
                  // In a real app, this would filter news by the selected region
                  console.log('Selected region:', region.name);
                }}
              />
            </View>
          )}
          
          {/* Main news feed section */}
          <View style={{ padding: 16 }}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Latest News</Text>
            {locationName && (
              <Text style={[styles.sectionSubtitle, { color: theme.textSecondary }]}>
                News from your area
              </Text>
            )}
          </View>
          
          <NewsStream 
            news={news} 
            onNewsPress={handleNewsPress}
            isAuthenticated={!!user}
            freemiumMeta={newsData.meta}
          />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  themeToggle: {
    marginLeft: 8,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    marginTop: 10,
  },
  retryButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  freemiumFooter: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
    alignItems: 'center',
  },
  freemiumText: {
    fontSize: 14,
    marginBottom: 10,
    textAlign: 'center',
  },
  signInButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  signInButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    marginBottom: 16,
  },
});
