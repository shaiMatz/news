import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { 
  View, 
  StyleSheet, 
  Text, 
  RefreshControl, 
  TouchableOpacity, 
  Alert, 
  ScrollView, 
  FlatList,
  Image,
  ImageBackground, 
  Dimensions
} from 'react-native';
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
import { formatRelativeTime } from '../utils/timeUtils';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

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
  const [activeTab, setActiveTab] = useState('all'); // 'all', 'live', 'video', 'following'

  // Extract news items from state
  const news = useMemo(() => newsData.news || [], [newsData]);
  
  // Check if there are more items available for premium users
  const hasMoreContent = useMemo(() => 
    newsData.meta?.hasMoreContent || false, 
  [newsData]);

  // Filter news by active tab
  const filteredNews = useMemo(() => {
    switch(activeTab) {
      case 'live':
        return news.filter(item => item.isLive);
      case 'video':
        return news.filter(item => item.hasVideo || item.mediaType === 'video');
      case 'following':
        return news.filter(item => item.isFromFollowing);
      default:
        return news;
    }
  }, [news, activeTab]);

  // Featured live content for the hero section
  const featuredLiveContent = useMemo(() => {
    return news.find(item => item.isLive && item.featured) || 
           news.find(item => item.isLive) || 
           null;
  }, [news]);

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

  const renderFeaturedContent = () => {
    if (!featuredLiveContent) return null;
    
    return (
      <TouchableOpacity 
        style={styles.featuredContainer}
        onPress={() => handleNewsPress(featuredLiveContent)}
        activeOpacity={0.9}
      >
        <ImageBackground
          source={{ uri: featuredLiveContent.thumbnail || 'https://via.placeholder.com/500x300?text=Live' }}
          style={styles.featuredImage}
          imageStyle={styles.featuredImageStyle}
        >
          <View style={styles.featuredGradient}>
            <View style={styles.featuredBadgeRow}>
              <View style={styles.liveBadge}>
                <View style={styles.liveIndicator} />
                <Text style={styles.liveBadgeText}>LIVE</Text>
              </View>
              {locationName && (
                <View style={styles.locationBadge}>
                  <Feather name="map-pin" size={12} color="#fff" />
                  <Text style={styles.locationText}>{featuredLiveContent.location || locationName}</Text>
                </View>
              )}
            </View>
            
            <View style={styles.featuredTextContainer}>
              <Text style={styles.featuredTitle} numberOfLines={2}>
                {featuredLiveContent.title}
              </Text>
              
              <View style={styles.featuredMeta}>
                <View style={styles.authorContainer}>
                  {featuredLiveContent.authorImage ? (
                    <Image 
                      source={{ uri: featuredLiveContent.authorImage }} 
                      style={styles.authorImage} 
                    />
                  ) : (
                    <View style={[styles.authorImage, styles.authorInitial]}>
                      <Text style={styles.initialText}>
                        {featuredLiveContent.author ? featuredLiveContent.author.charAt(0).toUpperCase() : 'U'}
                      </Text>
                    </View>
                  )}
                  <Text style={styles.authorName}>{featuredLiveContent.author || 'Unknown'}</Text>
                </View>
                
                <Text style={styles.featuredTime}>
                  {formatRelativeTime(featuredLiveContent.publishedAt || new Date())}
                </Text>
              </View>
            </View>
            
            <TouchableOpacity 
              style={styles.playButton}
              onPress={() => handleNewsPress(featuredLiveContent)}
            >
              <Feather name="play" size={24} color="#fff" />
            </TouchableOpacity>
          </View>
        </ImageBackground>
      </TouchableOpacity>
    );
  };

  const renderTabBar = () => (
    <View style={[styles.tabBar, { backgroundColor: theme.background }]}>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tabBarScroll}
      >
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'all' && styles.activeTab]}
          onPress={() => setActiveTab('all')}
        >
          <Feather 
            name="grid" 
            size={16} 
            color={activeTab === 'all' ? theme.primary : theme.textSecondary} 
          />
          <Text 
            style={[
              styles.tabText, 
              { color: activeTab === 'all' ? theme.primary : theme.textSecondary }
            ]}
          >
            All
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'live' && styles.activeTab]}
          onPress={() => setActiveTab('live')}
        >
          <Feather 
            name="radio" 
            size={16} 
            color={activeTab === 'live' ? '#f97316' : theme.textSecondary} 
          />
          <Text 
            style={[
              styles.tabText, 
              { color: activeTab === 'live' ? '#f97316' : theme.textSecondary }
            ]}
          >
            Live Now
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'video' && styles.activeTab]}
          onPress={() => setActiveTab('video')}
        >
          <Feather 
            name="film" 
            size={16} 
            color={activeTab === 'video' ? theme.primary : theme.textSecondary} 
          />
          <Text 
            style={[
              styles.tabText, 
              { color: activeTab === 'video' ? theme.primary : theme.textSecondary }
            ]}
          >
            Videos
          </Text>
        </TouchableOpacity>
        
        {user && (
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'following' && styles.activeTab]}
            onPress={() => setActiveTab('following')}
          >
            <Feather 
              name="users" 
              size={16} 
              color={activeTab === 'following' ? theme.primary : theme.textSecondary} 
            />
            <Text 
              style={[
                styles.tabText, 
                { color: activeTab === 'following' ? theme.primary : theme.textSecondary }
              ]}
            >
              Following
            </Text>
          </TouchableOpacity>
        )}
        
        <TouchableOpacity 
          style={[styles.tab, { marginRight: 16 }]}
          onPress={() => navigation.navigate('Search')}
        >
          <Feather 
            name="trending-up" 
            size={16} 
            color={theme.textSecondary} 
          />
          <Text 
            style={[
              styles.tabText, 
              { color: theme.textSecondary }
            ]}
          >
            Trending
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );

  const renderLiveStories = () => {
    const liveStories = news.filter(item => item.isLive).slice(0, 10);
    
    if (liveStories.length === 0) return null;
    
    return (
      <View style={styles.liveStoriesContainer}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>
            Live Stories
          </Text>
          <TouchableOpacity onPress={() => setActiveTab('live')}>
            <Text style={[styles.seeAllText, { color: theme.primary }]}>
              See All
            </Text>
          </TouchableOpacity>
        </View>
        
        <FlatList
          horizontal
          data={liveStories}
          keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
          renderItem={({ item }) => (
            <TouchableOpacity 
              style={styles.storyItem}
              onPress={() => handleNewsPress(item)}
            >
              <View style={styles.storyImageContainer}>
                <Image 
                  source={{ uri: item.thumbnail || 'https://via.placeholder.com/150' }}
                  style={styles.storyImage}
                />
                <View style={styles.storyLiveBadge}>
                  <View style={styles.storyLiveIndicator} />
                </View>
              </View>
              <Text style={[styles.storyAuthor, { color: theme.text }]} numberOfLines={1}>
                {item.author || 'Unknown'}
              </Text>
            </TouchableOpacity>
          )}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.storyListContent}
        />
      </View>
    );
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
          <Text style={[styles.title, { color: theme.text }]}>NewsGeo</Text>
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
          
          {!user && (
            <TouchableOpacity 
              style={[styles.signInButton, { backgroundColor: theme.primary }]}
              onPress={handleSignInPress}
            >
              <Text style={styles.signInButtonText}>Sign In</Text>
            </TouchableOpacity>
          )}
          
          <ThemeToggle style={styles.themeToggle} />
        </View>
      </View>
      
      {renderTabBar()}
      
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
          {/* Featured live content */}
          {renderFeaturedContent()}
          
          {/* Live stories */}
          {renderLiveStories()}
          
          {/* Location-based sections */}
          {location && (
            <View style={{ paddingHorizontal: 16, marginTop: 24 }}>
              <ActiveRegionsPanel 
                refreshInterval={60000}
                limit={5}
                activeWithinMinutes={60}
                onRegionSelect={(region) => {
                  console.log('Selected region:', region.name);
                }}
              />
            </View>
          )}
          
          {/* Main news feed section */}
          <View style={styles.newsFeedContainer}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>
                {activeTab === 'live' ? 'Live News' : 
                 activeTab === 'video' ? 'Video Content' :
                 activeTab === 'following' ? 'From People You Follow' : 'Latest News'}
              </Text>
              {locationName && activeTab === 'all' && (
                <Text style={[styles.sectionSubtitle, { color: theme.textSecondary }]}>
                  News from your area
                </Text>
              )}
            </View>
            
            <NewsStream 
              news={filteredNews} 
              onNewsPress={handleNewsPress}
              isAuthenticated={!!user}
              freemiumMeta={newsData.meta}
            />
          </View>
          
          {/* Trending section */}
          {activeTab === 'all' && (
            <View style={[styles.trendingContainer, { backgroundColor: theme.isDark ? theme.backgroundSecondary : '#f8f9fa' }]}>
              <View style={styles.sectionHeader}>
                <Text style={[styles.sectionTitle, { color: theme.text }]}>
                  Trending Now
                </Text>
              </View>
              
              <TrendingNewsStream 
                timeframe="lastHour"
                refreshInterval={30000}
                maxItems={5}
                onNewsPress={handleNewsPress}
              />
            </View>
          )}
        </ScrollView>
      )}
      
      {!user && filteredNews.length > 10 && (
        <View style={[styles.freemiumBanner, { 
          backgroundColor: theme.isDark ? 'rgba(15, 23, 42, 0.9)' : 'rgba(255, 255, 255, 0.95)',
          borderTopColor: theme.border
        }]}>
          <Text style={[styles.freemiumTitle, { color: theme.text }]}>
            Sign in to see more content
          </Text>
          <TouchableOpacity 
            style={[styles.freemiumButton, { backgroundColor: theme.primary }]}
            onPress={handleSignInPress}
          >
            <Text style={styles.freemiumButtonText}>Sign In</Text>
          </TouchableOpacity>
        </View>
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
  signInButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
  },
  signInButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  themeToggle: {
    marginLeft: 8,
  },
  tabBar: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
    paddingVertical: 8,
  },
  tabBarScroll: {
    paddingHorizontal: 16,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    marginRight: 12,
  },
  activeTab: {
    backgroundColor: 'rgba(37, 99, 235, 0.1)',
  },
  tabText: {
    marginLeft: 6,
    fontWeight: '500',
    fontSize: 14,
  },
  featuredContainer: {
    marginTop: 16,
    marginHorizontal: 16,
    borderRadius: 16,
    overflow: 'hidden',
    height: 240,
    marginBottom: 24,
  },
  featuredImage: {
    width: '100%',
    height: '100%',
  },
  featuredImageStyle: {
    borderRadius: 16,
  },
  featuredGradient: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: 'rgba(0,0,0,0.3)',
    backgroundGradient: {
      colors: ['rgba(0,0,0,0)', 'rgba(0,0,0,0.8)'],
      start: { x: 0, y: 0 },
      end: { x: 0, y: 1 },
    },
  },
  featuredBadgeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f97316',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  liveIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FFFFFF',
    marginRight: 4,
  },
  liveBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  locationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  locationText: {
    color: '#FFFFFF',
    fontSize: 12,
    marginLeft: 4,
  },
  featuredTextContainer: {
    marginBottom: 8,
  },
  featuredTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  featuredMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  authorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  authorImage: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginRight: 8,
  },
  authorInitial: {
    backgroundColor: '#2563eb',
    justifyContent: 'center',
    alignItems: 'center',
  },
  initialText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 12,
  },
  authorName: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  featuredTime: {
    color: '#FFFFFF',
    fontSize: 12,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  playButton: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginLeft: -24,
    marginTop: -24,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  liveStoriesContainer: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  seeAllText: {
    fontSize: 14,
    fontWeight: '500',
  },
  storyListContent: {
    paddingHorizontal: 16,
  },
  storyItem: {
    marginRight: 16,
    width: 80,
    alignItems: 'center',
  },
  storyImageContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 4,
    position: 'relative',
    borderWidth: 2,
    borderColor: '#f97316',
  },
  storyImage: {
    width: 76,
    height: 76,
    borderRadius: 38,
  },
  storyLiveBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#f97316',
    width: 16,
    height: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  storyLiveIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FFFFFF',
  },
  storyAuthor: {
    fontSize: 12,
    textAlign: 'center',
    fontWeight: '500',
  },
  newsFeedContainer: {
    marginTop: 16,
  },
  sectionSubtitle: {
    fontSize: 14,
    marginTop: 2,
  },
  trendingContainer: {
    marginTop: 24,
    paddingTop: 20,
    paddingBottom: 24,
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
  freemiumBanner: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
  },
  freemiumTitle: {
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
  freemiumButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  freemiumButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
});
