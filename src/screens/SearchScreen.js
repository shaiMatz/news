import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity, 
  FlatList, 
  ActivityIndicator, 
  SafeAreaView 
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { useLocation } from '../contexts/LocationContext';
import NewsCard from '../components/NewsCard';
import { fetchNews } from '../services/api';
import LoadingIndicator from '../components/LoadingIndicator';

export default function SearchScreen() {
  const navigation = useNavigation();
  const { theme, isDarkMode } = useTheme();
  const { location } = useLocation();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [recentSearches, setRecentSearches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchMode, setSearchMode] = useState(false); // true when actively searching
  
  // Load recent searches from storage on component mount
  useEffect(() => {
    // In a real app, you'd load these from AsyncStorage or similar
    setRecentSearches([
      'Breaking news', 
      'Local events', 
      'Traffic updates'
    ]);
  }, []);
  
  // Search function
  const handleSearch = useCallback(async (query = searchQuery) => {
    if (!query.trim()) {
      setSearchResults([]);
      setSearchMode(false);
      return;
    }
    
    setLoading(true);
    setSearchMode(true);
    
    try {
      const locationParams = location ? {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude
      } : {};
      
      // In a real implementation, you'd pass the search query to the API
      const response = await fetchNews(locationParams);
      
      // Filter results based on search query (client-side filtering for demo)
      // In production, the server would handle the search
      const filtered = response.news ? 
        response.news.filter(item => 
          item.title?.toLowerCase().includes(query.toLowerCase()) || 
          item.body?.toLowerCase().includes(query.toLowerCase()) ||
          item.location?.toLowerCase().includes(query.toLowerCase()) ||
          item.author?.toLowerCase().includes(query.toLowerCase())
        ) : [];
      
      setSearchResults(filtered);
      
      // Save to recent searches if not already there
      if (query.trim() && !recentSearches.includes(query.trim())) {
        setRecentSearches(prev => [query.trim(), ...prev.slice(0, 4)]);
      }
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, location, recentSearches]);
  
  // Handle pressing a news item
  const handleNewsPress = (newsItem) => {
    navigation.navigate('NewsDetail', { newsId: newsItem.id, newsItem });
  };
  
  // Handle pressing a recent search
  const handleRecentSearchPress = (query) => {
    setSearchQuery(query);
    handleSearch(query);
  };
  
  // Clear search
  const handleClearSearch = () => {
    setSearchQuery('');
    setSearchResults([]);
    setSearchMode(false);
  };
  
  // Render header with search input
  const renderHeader = () => (
    <View style={[styles.header, { backgroundColor: theme.background }]}>
      <View style={[styles.searchContainer, { backgroundColor: theme.cardBackground }]}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => navigation.goBack()}
        >
          <Feather name="arrow-left" size={20} color={theme.textSecondary} />
        </TouchableOpacity>
        
        <TextInput 
          style={[styles.searchInput, { color: theme.text }]}
          placeholder="Search news, locations, users..." 
          placeholderTextColor={theme.textSecondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
          onSubmitEditing={() => handleSearch()}
          autoFocus
          returnKeyType="search"
        />
        
        {searchQuery.length > 0 && (
          <TouchableOpacity 
            style={styles.clearButton} 
            onPress={handleClearSearch}
          >
            <Feather name="x" size={18} color={theme.textSecondary} />
          </TouchableOpacity>
        )}
        
        <TouchableOpacity 
          style={styles.searchButton} 
          onPress={() => handleSearch()}
        >
          <Feather name="search" size={20} color={theme.primary} />
        </TouchableOpacity>
      </View>
    </View>
  );
  
  // Render recent searches
  const renderRecentSearches = () => (
    <View style={styles.recentSearchesContainer}>
      <View style={styles.recentHeader}>
        <Text style={[styles.recentTitle, { color: theme.text }]}>Recent Searches</Text>
        {recentSearches.length > 0 && (
          <TouchableOpacity onPress={() => setRecentSearches([])}>
            <Text style={[styles.clearAllText, { color: theme.primary }]}>Clear All</Text>
          </TouchableOpacity>
        )}
      </View>
      
      {recentSearches.length > 0 ? (
        <FlatList 
          data={recentSearches}
          keyExtractor={(item, index) => `recent-${index}`}
          renderItem={({ item }) => (
            <TouchableOpacity 
              style={styles.recentItem}
              onPress={() => handleRecentSearchPress(item)}
            >
              <Feather name="clock" size={16} color={theme.textSecondary} style={styles.recentIcon} />
              <Text style={[styles.recentText, { color: theme.text }]}>{item}</Text>
            </TouchableOpacity>
          )}
        />
      ) : (
        <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
          No recent searches
        </Text>
      )}
    </View>
  );
  
  // Render search results
  const renderResults = () => {
    if (loading) {
      return <LoadingIndicator />;
    }
    
    if (searchResults.length === 0 && searchMode) {
      return (
        <View style={styles.emptyContainer}>
          <Feather name="search" size={48} color={theme.textSecondary} style={styles.emptyIcon} />
          <Text style={[styles.emptyTitle, { color: theme.text }]}>No results found</Text>
          <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
            Try different keywords or check your spelling
          </Text>
        </View>
      );
    }
    
    return (
      <FlatList
        data={searchResults}
        keyExtractor={(item) => `search-${item.id}`}
        renderItem={({ item }) => (
          <NewsCard 
            news={item} 
            onPress={() => handleNewsPress(item)}
            compact={false}
          />
        )}
        contentContainerStyle={styles.resultsContainer}
      />
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.backgroundSecondary }]}>
      {renderHeader()}
      
      <View style={styles.content}>
        {searchMode ? renderResults() : renderRecentSearches()}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    paddingHorizontal: 8,
    height: 44,
  },
  backButton: {
    padding: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    paddingHorizontal: 8,
  },
  clearButton: {
    padding: 8,
  },
  searchButton: {
    padding: 8,
  },
  content: {
    flex: 1,
  },
  recentSearchesContainer: {
    padding: 16,
  },
  recentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  recentTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  clearAllText: {
    fontSize: 14,
    fontWeight: '500',
  },
  recentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  recentIcon: {
    marginRight: 12,
  },
  recentText: {
    fontSize: 16,
  },
  resultsContainer: {
    padding: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyIcon: {
    marginBottom: 16,
    opacity: 0.5,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 16,
  },
});