import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Text, RefreshControl } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../contexts/AuthContext';
import { useLocation } from '../contexts/LocationContext';
import NewsStream from '../components/NewsStream';
import PremiumBanner from '../components/PremiumBanner';
import LocationBadge from '../components/LocationBadge';
import LoadingIndicator from '../components/LoadingIndicator';
import { fetchNews } from '../services/api';
import { StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function HomeScreen() {
  const { user } = useAuth();
  const { location, locationName } = useLocation();
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
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
      <View style={styles.header}>
        <Text style={styles.title}>News Stream</Text>
        {locationName && <LocationBadge location={locationName} />}
      </View>
      
      {!user && <PremiumBanner />}
      
      {error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : (
        <NewsStream 
          news={news} 
          onNewsPress={handleNewsPress}
          isAuthenticated={!!user}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1E293B',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#EF4444',
    textAlign: 'center',
  },
});
