import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ImageBackground 
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../contexts/AuthContext';
import LocationBadge from './LocationBadge';
import { formatRelativeTime } from '../utils/timeUtils';

/**
 * NewsCard component displaying a thumbnail, title, and metadata for a news item
 * 
 * @param {Object} props
 * @param {Object} props.news - The news item data
 * @param {boolean} props.compact - Whether to display in compact mode
 * @param {Function} props.onPress - Custom press handler (optional)
 */
export default function NewsCard({ news, compact = false, onPress }) {
  const navigation = useNavigation();
  const { user } = useAuth();
  const isPremium = news.premium && !user;

  const handlePress = () => {
    if (onPress) {
      onPress(news);
    } else {
      navigation.navigate('NewsDetail', { newsItem: news });
    }
  };

  return (
    <TouchableOpacity 
      style={[styles.container, compact && styles.compactContainer]}
      onPress={handlePress}
      disabled={isPremium}
    >
      <ImageBackground
        source={{ uri: news.thumbnail }}
        style={styles.thumbnail}
        imageStyle={styles.thumbnailImage}
      >
        <View style={styles.thumbnailOverlay}>
          <View style={styles.badgeContainer}>
            <LocationBadge location={news.location} small={compact} />
            
            {news.isLive && (
              <View style={styles.liveBadge}>
                <View style={styles.liveIndicator} />
                <Text style={styles.liveText}>LIVE</Text>
              </View>
            )}
          </View>
          
          {isPremium && (
            <View style={styles.premiumOverlay}>
              <Feather name="lock" size={24} color="#FFFFFF" />
              <Text style={styles.premiumText}>Premium</Text>
            </View>
          )}

          <View style={styles.playIcon}>
            <Feather name="play" size={compact ? 20 : 24} color="#FFFFFF" />
          </View>
        </View>
      </ImageBackground>
      
      <View style={styles.content}>
        <Text 
          style={[styles.title, compact && styles.compactTitle]}
          numberOfLines={compact ? 2 : 3}
        >
          {news.title}
        </Text>
        
        <View style={styles.metaContainer}>
          <Text style={styles.timestamp}>{formatRelativeTime(news.publishedAt)}</Text>
          
          <View style={styles.statsContainer}>
            {!compact && (
              <View style={styles.statItem}>
                <Feather name="eye" size={12} color="#94A3B8" />
                <Text style={styles.statText}>{news.views || 0}</Text>
              </View>
            )}
            
            <View style={styles.statItem}>
              <Feather name="heart" size={12} color="#94A3B8" />
              <Text style={styles.statText}>{news.likes || 0}</Text>
            </View>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  compactContainer: {
    marginBottom: 8,
  },
  thumbnail: {
    height: 180,
  },
  thumbnailImage: {
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  thumbnailOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    justifyContent: 'space-between',
    padding: 12,
  },
  badgeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EF4444',
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
  liveText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  premiumOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(45, 55, 72, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  premiumText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 8,
  },
  playIcon: {
    alignSelf: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    padding: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 8,
  },
  compactTitle: {
    fontSize: 14,
  },
  metaContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timestamp: {
    fontSize: 12,
    color: '#94A3B8',
  },
  statsContainer: {
    flexDirection: 'row',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 12,
  },
  statText: {
    fontSize: 12,
    color: '#94A3B8',
    marginLeft: 4,
  },
});
