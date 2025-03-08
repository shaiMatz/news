import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Share,
  Alert
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useAuth } from '../contexts/AuthContext';
import VideoPlayer from '../components/VideoPlayer';
import LocationBadge from '../components/LocationBadge';
import { formatRelativeTime } from '../utils/timeUtils';
import { likeNews, fetchNewsComments } from '../services/api';
import LoadingIndicator from '../components/LoadingIndicator';

export default function NewsDetailScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const { newsItem } = route.params || {};
  const { user } = useAuth();
  const [liked, setLiked] = useState(newsItem?.liked || false);
  const [likeCount, setLikeCount] = useState(newsItem?.likes || 0);
  const [comments, setComments] = useState([]);
  const [loadingComments, setLoadingComments] = useState(false);

  useEffect(() => {
    if (newsItem?.id) {
      loadComments();
    }
  }, [newsItem]);

  const loadComments = async () => {
    if (!user) return;
    
    try {
      setLoadingComments(true);
      const fetchedComments = await fetchNewsComments(newsItem.id);
      setComments(fetchedComments);
    } catch (error) {
      console.error('Failed to load comments:', error);
    } finally {
      setLoadingComments(false);
    }
  };

  const handleLike = async () => {
    if (!user) {
      navigation.navigate('Auth');
      return;
    }

    try {
      await likeNews(newsItem.id);
      setLiked(!liked);
      setLikeCount(liked ? likeCount - 1 : likeCount + 1);
    } catch (error) {
      console.error('Failed to like news:', error);
      Alert.alert('Error', 'Failed to like this news.');
    }
  };

  const handleShare = async () => {
    if (!user) {
      navigation.navigate('Auth');
      return;
    }

    try {
      await Share.share({
        message: `Check out this news: ${newsItem.title} - ${newsItem.shortDescription}`,
        url: `https://newsgeo.app/news/${newsItem.id}`, // This would be your actual deep link
      });
    } catch (error) {
      console.error('Failed to share news:', error);
    }
  };

  if (!newsItem) {
    return <LoadingIndicator />;
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <VideoPlayer videoUrl={newsItem.videoUrl} thumbnail={newsItem.thumbnail} />
      
      <View style={styles.content}>
        <View style={styles.headerRow}>
          <LocationBadge location={newsItem.location} />
          <Text style={styles.timestamp}>{formatRelativeTime(newsItem.publishedAt)}</Text>
        </View>
        
        <Text style={styles.title}>{newsItem.title}</Text>
        <Text style={styles.authorName}>By {newsItem.author}</Text>
        
        <View style={styles.actionRow}>
          <TouchableOpacity 
            style={[styles.actionButton, liked && styles.likedButton]}
            onPress={handleLike}
          >
            <Feather 
              name={liked ? "heart" : "heart"} 
              size={20} 
              color={liked ? "#EF4444" : "#64748B"} 
            />
            <Text style={[styles.actionText, liked && styles.likedText]}>
              {likeCount} {likeCount === 1 ? 'Like' : 'Likes'}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.actionButton} onPress={handleShare}>
            <Feather name="share-2" size={20} color="#64748B" />
            <Text style={styles.actionText}>Share</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.divider} />
        
        <Text style={styles.description}>{newsItem.description}</Text>
        
        <View style={styles.commentsSection}>
          <Text style={styles.commentsTitle}>Comments</Text>
          
          {!user ? (
            <TouchableOpacity 
              style={styles.loginPrompt}
              onPress={() => navigation.navigate('Auth')}
            >
              <Text style={styles.loginPromptText}>
                Please login to view and post comments
              </Text>
              <Feather name="log-in" size={16} color="#2563EB" />
            </TouchableOpacity>
          ) : loadingComments ? (
            <LoadingIndicator size="small" />
          ) : comments.length > 0 ? (
            comments.map(comment => (
              <View key={comment.id} style={styles.commentItem}>
                <View style={styles.commentHeader}>
                  <Text style={styles.commentAuthor}>{comment.author}</Text>
                  <Text style={styles.commentTime}>{formatRelativeTime(comment.createdAt)}</Text>
                </View>
                <Text style={styles.commentText}>{comment.text}</Text>
              </View>
            ))
          ) : (
            <Text style={styles.noCommentsText}>No comments yet. Be the first to comment!</Text>
          )}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  contentContainer: {
    paddingBottom: 40,
  },
  content: {
    padding: 16,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  timestamp: {
    fontSize: 14,
    color: '#94A3B8',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 8,
  },
  authorName: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 16,
  },
  actionRow: {
    flexDirection: 'row',
    marginVertical: 16,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 24,
    paddingVertical: 8,
  },
  likedButton: {
    opacity: 1,
  },
  actionText: {
    marginLeft: 6,
    fontSize: 14,
    color: '#64748B',
  },
  likedText: {
    color: '#EF4444',
  },
  divider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 16,
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    color: '#334155',
  },
  commentsSection: {
    marginTop: 24,
  },
  commentsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 16,
  },
  loginPrompt: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    backgroundColor: '#F1F5F9',
    borderRadius: 8,
  },
  loginPromptText: {
    color: '#2563EB',
    marginRight: 8,
  },
  commentItem: {
    backgroundColor: '#F8FAFC',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  commentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  commentAuthor: {
    fontWeight: '600',
    color: '#334155',
  },
  commentTime: {
    fontSize: 12,
    color: '#94A3B8',
  },
  commentText: {
    color: '#334155',
    lineHeight: 20,
  },
  noCommentsText: {
    textAlign: 'center',
    color: '#64748B',
    padding: 16,
  },
});
