import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ImageBackground,
  Alert
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useLocalizationContext } from '../contexts/LocalizationContext';
import useLocalization from '../hooks/useLocalization';
import LocationBadge from './LocationBadge';
import ShareButton from './ShareButton';
import ShareSheet from './ShareSheet';
import { formatRelativeTime } from '../utils/timeUtils';

/**
 * NewsCard component displaying a thumbnail, title, and metadata for a news item
 * 
 * @param {Object} props
 * @param {Object} props.news - The news item data
 * @param {boolean} props.compact - Whether to display in compact mode
 * @param {Function} props.onPress - Custom press handler (optional)
 * @param {boolean} props.freemiumRestricted - Whether this news item is restricted by freemium
 */
export default function NewsCard({ 
  news, 
  compact = false, 
  onPress,
  freemiumRestricted = false  
}) {
  const navigation = useNavigation();
  const { user } = useAuth();
  const { theme } = useTheme();
  const { t } = useLocalization();
  const { isRTL, getDirectionStyle, getTextAlignStyle } = useLocalizationContext();
  const [shareSheetVisible, setShareSheetVisible] = useState(false);
  
  // Check if this content requires premium access
  const isPremium = (news.premium || freemiumRestricted) && !user;

  const handlePress = () => {
    if (isPremium) {
      Alert.alert(
        'Premium Content',
        'Please sign in to access premium content and unlock all features.',
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
    
    if (onPress) {
      onPress(news);
    } else {
      navigation.navigate('NewsDetail', { newsId: news.id, newsItem: news });
    }
  };

  return (
    <TouchableOpacity 
      style={[
        styles.container, 
        compact && styles.compactContainer,
        { 
          backgroundColor: theme.cardBackground,
          shadowColor: theme.isDark ? '#000000' : theme.shadow
        },
        isPremium && styles.premiumContainer
      ]}
      onPress={handlePress}
      activeOpacity={0.7}
    >
      <ImageBackground
        source={{ uri: news.thumbnail || 'https://via.placeholder.com/300x200?text=News' }}
        style={styles.thumbnail}
        imageStyle={[
          styles.thumbnailImage,
          isPremium && styles.premiumThumbnail
        ]}
      >
        <View style={styles.thumbnailOverlay}>
          <View style={[styles.badgeContainer, getDirectionStyle()]}>
            <LocationBadge location={news.location} small={compact} />
            
            {news.isLive && (
              <View style={[styles.liveBadge, getDirectionStyle()]}>
                <View style={styles.liveIndicator} />
                <Text style={styles.liveText}>{t('news.live')}</Text>
              </View>
            )}
          </View>
          
          {isPremium && (
            <View style={styles.premiumOverlay}>
              <Feather name="lock" size={24} color="#FFFFFF" />
              <Text style={styles.premiumText}>
                {freemiumRestricted ? 'Sign In to View' : 'Premium'}
              </Text>
            </View>
          )}

          <View style={styles.playIcon}>
            <Feather 
              name={news.isLive ? "video" : "play"} 
              size={compact ? 20 : 24} 
              color="#FFFFFF" 
            />
          </View>
        </View>
      </ImageBackground>
      
      <View style={[styles.content, { backgroundColor: theme.cardBackground }]}>
        <Text 
          style={[
            styles.title, 
            compact && styles.compactTitle,
            { color: theme.text },
            isPremium && styles.premiumText
          ]}
          numberOfLines={compact ? 2 : 3}
        >
          {news.title}
        </Text>
        
        <View style={[styles.metaContainer, getDirectionStyle()]}>
          <Text style={[styles.timestamp, { color: theme.textSecondary }, getTextAlignStyle()]}>
            {formatRelativeTime(news.publishedAt || news.createdAt || new Date())}
          </Text>
          
          <View style={[styles.statsContainer, getDirectionStyle()]}>
            {!compact && (
              <View style={[styles.statItem, getDirectionStyle()]}>
                <Feather name="eye" size={12} color={theme.textSecondary} />
                <Text style={[styles.statText, { color: theme.textSecondary }, getTextAlignStyle()]}>
                  {news.views || 0}
                </Text>
              </View>
            )}
            
            <View style={[styles.statItem, getDirectionStyle()]}>
              <Feather 
                name={news.liked ? "heart" : "heart"} 
                size={12} 
                color={news.liked ? theme.primary : theme.textSecondary} 
              />
              <Text 
                style={[
                  styles.statText, 
                  { color: news.liked ? theme.primary : theme.textSecondary },
                  getTextAlignStyle()
                ]}
              >
                {news.likes || 0}
              </Text>
            </View>
            
            {!compact && news.commentsCount > 0 && (
              <View style={[styles.statItem, getDirectionStyle()]}>
                <Feather name="message-circle" size={12} color={theme.textSecondary} />
                <Text style={[styles.statText, { color: theme.textSecondary }, getTextAlignStyle()]}>
                  {news.commentsCount}
                </Text>
              </View>
            )}
            
            {/* Share button */}
            {!isPremium && (
              <TouchableOpacity 
                style={[styles.statItem, getDirectionStyle()]} 
                onPress={() => setShareSheetVisible(true)}
                accessibilityLabel={t('news.shareNews')}
              >
                <Feather name="share-2" size={12} color={theme.textSecondary} />
                {!compact && (
                  <Text style={[styles.statText, { color: theme.textSecondary }, getTextAlignStyle()]}>
                    {t('common.share')}
                  </Text>
                )}
              </TouchableOpacity>
            )}
          </View>
        </View>
        
        {isPremium && (
          <TouchableOpacity
            style={[styles.unlockButton, { backgroundColor: theme.primary }]}
            onPress={() => navigation.navigate('Auth')}
          >
            <Feather name="unlock" size={12} color="#FFFFFF" />
            <Text style={styles.unlockButtonText}>Sign In to Unlock</Text>
          </TouchableOpacity>
        )}
      </View>
      
      {/* ShareSheet Component */}
      <ShareSheet
        visible={shareSheetVisible}
        onClose={() => setShareSheetVisible(false)}
        newsItem={news}
        onShare={(platform) => {
          console.log(`News shared on ${platform}`);
          // You could trigger analytics here
        }}
        additionalHashtags={news.category ? [news.category] : []}
      />
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
  premiumContainer: {
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
  },
  thumbnail: {
    height: 180,
  },
  thumbnailImage: {
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  premiumThumbnail: {
    opacity: 0.7,
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
    backgroundColor: 'rgba(45, 55, 72, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  premiumText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 8,
    textAlign: 'center',
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
    marginHorizontal: 6,
  },
  statText: {
    fontSize: 12,
    color: '#94A3B8',
    marginHorizontal: 4,
  },
  unlockButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3B82F6',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginTop: 12,
  },
  unlockButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
    marginHorizontal: 6,
  },
});
