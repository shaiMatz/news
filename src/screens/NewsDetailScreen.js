import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Share,
  Alert,
  TextInput,
  Keyboard,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  StatusBar
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import VideoPlayer from '../components/VideoPlayer';
import LocationBadge from '../components/LocationBadge';
import { formatRelativeTime } from '../utils/timeUtils';
import { likeNews, fetchNewsComments, addNewsComment } from '../services/api';
import LoadingIndicator from '../components/LoadingIndicator';

export default function NewsDetailScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const { newsItem } = route.params || {};
  const { user } = useAuth();
  const { theme, isDarkMode } = useTheme();
  const [liked, setLiked] = useState(newsItem?.liked || false);
  const [likeCount, setLikeCount] = useState(newsItem?.likes || 0);
  const [comments, setComments] = useState([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const scrollViewRef = useRef(null);

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
  
  const handleSubmitComment = async () => {
    if (!commentText.trim()) return;
    
    if (!user) {
      navigation.navigate('Auth');
      return;
    }

    try {
      setSubmittingComment(true);
      const newComment = await addNewsComment(newsItem.id, commentText.trim());
      
      // Add the new comment to the comments array
      setComments(prevComments => [
        ...prevComments, 
        newComment
      ]);
      
      // Clear the input field
      setCommentText('');
      
      // Dismiss keyboard
      Keyboard.dismiss();
      
      // Scroll to bottom to show the new comment
      if (scrollViewRef.current) {
        scrollViewRef.current.scrollToEnd({ animated: true });
      }
    } catch (error) {
      console.error('Failed to submit comment:', error);
      Alert.alert('Error', 'Failed to post your comment. Please try again.');
    } finally {
      setSubmittingComment(false);
    }
  };

  if (!newsItem) {
    return <LoadingIndicator />;
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1, backgroundColor: theme.background }}
    >
      <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} />
      <ScrollView 
        ref={scrollViewRef}
        style={[styles.container, { backgroundColor: theme.background }]} 
        contentContainerStyle={styles.contentContainer}
      >
        <VideoPlayer videoUrl={newsItem.videoUrl} thumbnail={newsItem.thumbnail} />
        
        <View style={[styles.content, { backgroundColor: theme.background }]}>
          <View style={styles.headerRow}>
            <LocationBadge location={newsItem.location} />
            <Text style={[styles.timestamp, { color: theme.textSecondary }]}>
              {formatRelativeTime(newsItem.publishedAt)}
            </Text>
          </View>
          
          <Text style={[styles.title, { color: theme.text }]}>{newsItem.title}</Text>
          <Text style={[styles.authorName, { color: theme.textSecondary }]}>
            By {newsItem.author}
          </Text>
          
          <View style={styles.actionRow}>
            <TouchableOpacity 
              style={[styles.actionButton, liked && styles.likedButton]}
              onPress={handleLike}
            >
              <Feather 
                name={liked ? "heart" : "heart"} 
                size={20} 
                color={liked ? theme.danger : theme.textSecondary} 
              />
              <Text style={[
                styles.actionText, 
                { color: theme.textSecondary },
                liked && [styles.likedText, { color: theme.danger }]
              ]}>
                {likeCount} {likeCount === 1 ? 'Like' : 'Likes'}
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.actionButton} onPress={handleShare}>
              <Feather name="share-2" size={20} color={theme.textSecondary} />
              <Text style={[styles.actionText, { color: theme.textSecondary }]}>Share</Text>
            </TouchableOpacity>
          </View>
          
          <View style={[styles.divider, { backgroundColor: theme.border }]} />
          
          <Text style={[styles.description, { color: theme.text }]}>
            {newsItem.description}
          </Text>
          
          <View style={styles.commentsSection}>
            <Text style={[styles.commentsTitle, { color: theme.text }]}>Comments</Text>
            
            {!user ? (
              <TouchableOpacity 
                style={[
                  styles.loginPrompt,
                  { backgroundColor: theme.backgroundSecondary }
                ]}
                onPress={() => navigation.navigate('Auth')}
              >
                <Text style={[styles.loginPromptText, { color: theme.primary }]}>
                  Please login to view and post comments
                </Text>
                <Feather name="log-in" size={16} color={theme.primary} />
              </TouchableOpacity>
            ) : loadingComments ? (
              <LoadingIndicator size="small" />
            ) : (
              <>
                {comments.length > 0 ? (
                  comments.map(comment => (
                    <View 
                      key={comment.id} 
                      style={[
                        styles.commentItem,
                        { backgroundColor: theme.backgroundSecondary }
                      ]}
                    >
                      <View style={styles.commentHeader}>
                        <Text style={[styles.commentAuthor, { color: theme.text }]}>
                          {comment.author}
                        </Text>
                        <Text style={[styles.commentTime, { color: theme.textSecondary }]}>
                          {formatRelativeTime(comment.createdAt)}
                        </Text>
                      </View>
                      <Text style={[styles.commentText, { color: theme.text }]}>
                        {comment.text}
                      </Text>
                    </View>
                  ))
                ) : (
                  <Text style={[styles.noCommentsText, { color: theme.textSecondary }]}>
                    No comments yet. Be the first to comment!
                  </Text>
                )}
                
                {/* Comment form */}
                <View style={[
                  styles.commentFormContainer,
                  { 
                    backgroundColor: theme.backgroundSecondary,
                    borderColor: theme.border
                  }
                ]}>
                  <TextInput
                    style={[styles.commentInput, { color: theme.text }]}
                    placeholder="Add a comment..."
                    placeholderTextColor={theme.textSecondary}
                    value={commentText}
                    onChangeText={setCommentText}
                    multiline
                    maxLength={500}
                  />
                  <TouchableOpacity
                    style={[
                      styles.commentSubmitButton,
                      { backgroundColor: theme.primary },
                      (!commentText.trim() || submittingComment) && [
                        styles.commentSubmitButtonDisabled,
                        { backgroundColor: theme.textMuted }
                      ]
                    ]}
                    onPress={handleSubmitComment}
                    disabled={!commentText.trim() || submittingComment}
                  >
                    {submittingComment ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <Feather name="send" size={20} color="#FFFFFF" />
                    )}
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
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
  commentFormContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    padding: 4,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  commentInput: {
    flex: 1,
    minHeight: 40,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    color: '#1E293B',
  },
  commentSubmitButton: {
    backgroundColor: '#2563EB',
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  commentSubmitButtonDisabled: {
    backgroundColor: '#94A3B8',
    opacity: 0.6,
  },
});
