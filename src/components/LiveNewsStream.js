import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Platform } from 'react-native';
import { Feather } from '@expo/vector-icons';
import io from 'socket.io-client';
import { useAuth } from '../contexts/AuthContext';
import { API_URL } from '../services/api';
import VideoPlayer from './VideoPlayer';
import LoadingIndicator from './LoadingIndicator';
import LocationBadge from './LocationBadge';

/**
 * LiveNewsStream component for displaying and interacting with live news streams
 * 
 * @param {Object} props
 * @param {Object} props.newsItem - The news item being streamed
 * @param {Function} props.onClose - Function to handle closing the stream
 */
export default function LiveNewsStream({ newsItem, onClose }) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [connected, setConnected] = useState(false);
  const [viewerCount, setViewerCount] = useState(0);
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState('');
  const [streamMetadata, setStreamMetadata] = useState({});
  const socketRef = useRef(null);
  const wsRef = useRef(null);
  const commentsRef = useRef(null);
  
  // Auto-scroll to bottom of comments
  useEffect(() => {
    if (commentsRef.current) {
      commentsRef.current.scrollToEnd({ animated: true });
    }
  }, [comments]);

  // Connect to Socket.IO server
  useEffect(() => {
    // Determine the appropriate Socket.IO URL
    const socketUrl = API_URL || 'http://localhost:5000';
    
    // Connect to Socket.IO
    socketRef.current = io(socketUrl, {
      transports: ['websocket'],
      withCredentials: true,
    });
    
    const socket = socketRef.current;
    
    // Connection established
    socket.on('connect', () => {
      console.log('Socket.IO connected:', socket.id);
      setConnected(true);
      setLoading(false);
      
      // Join the stream room for this news item
      socket.emit('join-stream', newsItem.id);
    });
    
    // Handle connection errors
    socket.on('connect_error', (error) => {
      console.error('Socket.IO connection error:', error);
      setConnected(false);
      setLoading(false);
    });
    
    // Handle disconnection
    socket.on('disconnect', (reason) => {
      console.log('Socket.IO disconnected:', reason);
      setConnected(false);
    });
    
    // Handle viewer count updates
    socket.on('viewer-count', (data) => {
      if (data.newsId === newsItem.id) {
        setViewerCount(data.count);
      }
    });
    
    // Handle new comments
    socket.on('new-comment', (comment) => {
      setComments(prevComments => [...prevComments, comment]);
    });
    
    // Handle stream metadata updates
    socket.on('stream-meta-update', (data) => {
      if (data.newsId === newsItem.id) {
        setStreamMetadata(data.metadata);
      }
    });
    
    // Clean up on unmount
    return () => {
      if (socket) {
        // Leave the stream before disconnecting
        socket.emit('leave-stream', newsItem.id);
        socket.disconnect();
      }
    };
  }, [newsItem.id]);
  
  // Connect to WebSocket for video streaming (if needed)
  useEffect(() => {
    // Skip for non-video content
    if (!newsItem.isVideoContent) return;
    
    // Determine WebSocket URL
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsHost = API_URL ? API_URL.replace(/^https?:\/\//, '') : 'localhost:5000';
    const wsUrl = `${protocol}//${wsHost}/ws?newsId=${newsItem.id}`;
    
    // Connect to WebSocket
    wsRef.current = new WebSocket(wsUrl);
    const ws = wsRef.current;
    
    ws.onopen = () => {
      console.log('WebSocket connected');
    };
    
    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
    
    ws.onclose = () => {
      console.log('WebSocket disconnected');
    };
    
    // WebSocket message handling would be implemented here
    // This is typically handled by the VideoPlayer component
    
    // Clean up on unmount
    return () => {
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    };
  }, [newsItem.id, newsItem.isVideoContent]);
  
  const handleSendComment = () => {
    if (!commentText.trim() || !connected || !socketRef.current) return;
    
    // Send the comment via Socket.IO
    socketRef.current.emit('comment', {
      newsId: newsItem.id,
      text: commentText.trim(),
      username: user ? user.username : 'Anonymous'
    });
    
    // Clear the input field
    setCommentText('');
  };
  
  const handleSendReaction = (type) => {
    if (!connected || !socketRef.current) return;
    
    // Send the reaction via Socket.IO
    socketRef.current.emit('reaction', {
      newsId: newsItem.id,
      type,
      username: user ? user.username : 'Anonymous'
    });
  };
  
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <LoadingIndicator size="large" message="Connecting to live stream..." />
      </View>
    );
  }
  
  return (
    <View style={styles.container}>
      {/* Stream header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.title} numberOfLines={1}>
            {newsItem.title}
          </Text>
          {newsItem.location && (
            <LocationBadge location={newsItem.location} small />
          )}
        </View>
        <View style={styles.headerRight}>
          <View style={styles.viewerCount}>
            <Feather name="eye" size={16} color="#64748B" />
            <Text style={styles.viewerCountText}>{viewerCount}</Text>
          </View>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Feather name="x" size={24} color="#1E293B" />
          </TouchableOpacity>
        </View>
      </View>
      
      {/* Stream content */}
      <View style={styles.content}>
        {newsItem.isVideoContent ? (
          <VideoPlayer 
            videoUrl={newsItem.videoUrl} 
            thumbnail={newsItem.thumbnail} 
          />
        ) : (
          <View style={styles.textContent}>
            <Text style={styles.description}>{newsItem.description}</Text>
            {newsItem.imageUrl && (
              <Image 
                source={{ uri: newsItem.imageUrl }} 
                style={styles.image} 
                resizeMode="cover" 
              />
            )}
          </View>
        )}
      </View>
      
      {/* Comments section */}
      <View style={styles.commentsContainer}>
        <Text style={styles.commentsTitle}>Live Comments</Text>
        
        <ScrollView 
          ref={commentsRef}
          style={styles.commentsList}
          contentContainerStyle={styles.commentsListContent}
        >
          {comments.length === 0 ? (
            <Text style={styles.noCommentsText}>
              No comments yet. Be the first to comment!
            </Text>
          ) : (
            comments.map(comment => (
              <View key={comment.id} style={styles.commentItem}>
                <Text style={styles.commentUsername}>{comment.username}</Text>
                <Text style={styles.commentText}>{comment.text}</Text>
                <Text style={styles.commentTime}>
                  {new Date(comment.timestamp).toLocaleTimeString([], { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </Text>
              </View>
            ))
          )}
        </ScrollView>
        
        {/* Comment input */}
        {user ? (
          <View style={styles.commentInputContainer}>
            <TextInput
              style={styles.commentInput}
              placeholder="Add a comment..."
              value={commentText}
              onChangeText={setCommentText}
              multiline={Platform.OS === 'ios'}
              maxLength={200}
            />
            <TouchableOpacity 
              style={[
                styles.sendButton, 
                !commentText.trim() && styles.sendButtonDisabled
              ]}
              onPress={handleSendComment}
              disabled={!commentText.trim()}
            >
              <Feather 
                name="send" 
                size={20} 
                color={commentText.trim() ? "#FFFFFF" : "#A1A1AA"} 
              />
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity style={styles.loginPrompt}>
            <Text style={styles.loginPromptText}>
              Login to join the conversation
            </Text>
          </TouchableOpacity>
        )}
        
        {/* Reaction buttons */}
        <View style={styles.reactionsContainer}>
          <TouchableOpacity 
            style={styles.reactionButton}
            onPress={() => handleSendReaction('like')}
          >
            <Feather name="thumbs-up" size={20} color="#64748B" />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.reactionButton}
            onPress={() => handleSendReaction('heart')}
          >
            <Feather name="heart" size={20} color="#64748B" />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.reactionButton}
            onPress={() => handleSendReaction('surprise')}
          >
            <Feather name="alert-circle" size={20} color="#64748B" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  headerLeft: {
    flex: 1,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 4,
  },
  viewerCount: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  viewerCountText: {
    fontSize: 14,
    color: '#64748B',
    marginLeft: 4,
  },
  closeButton: {
    padding: 4,
  },
  content: {
    height: 240,
    backgroundColor: '#F1F5F9',
  },
  textContent: {
    padding: l6,
  },
  description: {
    fontSize: 16,
    color: '#1E293B',
    marginBottom: 16,
  },
  image: {
    width: '100%',
    height: 200,
    borderRadius: 8,
  },
  commentsContainer: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  commentsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 8,
  },
  commentsList: {
    flex: 1,
  },
  commentsListContent: {
    paddingBottom: 16,
  },
  noCommentsText: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 16,
  },
  commentItem: {
    backgroundColor: '#F1F5F9',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  commentUsername: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 4,
  },
  commentText: {
    fontSize: 14,
    color: '#334155',
    marginBottom: 4,
  },
  commentTime: {
    fontSize: 12,
    color: '#94A3B8',
    alignSelf: 'flex-end',
  },
  commentInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginTop: 8,
    marginBottom: 16,
  },
  commentInput: {
    flex: 1,
    fontSize: 14,
    color: '#1E293B',
    paddingVertical: 8,
  },
  sendButton: {
    backgroundColor: '#2563EB',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#E2E8F0',
  },
  loginPrompt: {
    backgroundColor: '#F1F5F9',
    borderRadius: 24,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 16,
  },
  loginPromptText: {
    fontSize: 14,
    color: '#2563EB',
    fontWeight: 'bold',
  },
  reactionsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 16,
  },
  reactionButton: {
    backgroundColor: '#F1F5F9',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 8,
  },
});