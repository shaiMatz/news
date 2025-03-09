import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Text, RefreshControl, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../contexts/AuthContext';
import { useLocation } from '../contexts/LocationContext';
import { useTheme } from '../contexts/ThemeContext';
import NewsStream from '../components/NewsStream';
import PremiumBanner from '../components/PremiumBanner';
import LocationBadge from '../components/LocationBadge';
import LoadingIndicator from '../components/LoadingIndicator';
import ThemeToggle from '../components/ThemeToggle';
import { fetchNews } from '../services/api';
import { StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';

export default function HomeScreen() {
  const { user } = useAuth();
  const { location, locationName } = useLocation();
  const { theme, isDarkMode } = useTheme();
  const navigation = useNavigation();
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const loadNews = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const locationParams = location ? {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude
      } : {};
      
      const response = await fetchNews(locationParams);
      setNews(response);
    } catch (err) {
      setError('Failed to load news. Please try again.');
      console.error('Error loading news:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadNews();
  }, [location]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadNews();
  };

  const handleNewsPress = (newsItem) => {
    navigation.navigate('NewsDetail', { newsItem });
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
      
      {!user && <PremiumBanner />}
      
      {error ? (
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: theme.danger }]}>{error}</Text>
        </View>
      ) : (
        <NewsStream 
          news={news} 
          onNewsPress={handleNewsPress}
          isAuthenticated={!!user}
          refreshControl={
            <RefreshControl 
              refreshing={refreshing} 
              onRefresh={handleRefresh} 
              tintColor={theme.textSecondary}
              colors={[theme.primary]}
              progressBackgroundColor={theme.backgroundSecondary}
            />
          }
        />
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
  },
});
