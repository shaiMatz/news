import React, { useState, useRef } from 'react';
import { View, StyleSheet, TouchableOpacity, ActivityIndicator, Image, Text } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Video } from 'expo-av';
import { useTheme } from '../contexts/ThemeContext';

/**
 * Custom video player component
 * 
 * @param {Object} props
 * @param {string} props.videoUrl - URL of the video to play
 * @param {string} props.thumbnail - URL of the thumbnail image
 */
export default function VideoPlayer({ videoUrl, thumbnail }) {
  const { theme } = useTheme();
  const [status, setStatus] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [showThumbnail, setShowThumbnail] = useState(true);
  const videoRef = useRef(null);

  const handlePlaybackStatusUpdate = (status) => {
    setStatus(status);
    
    if (status.isLoaded && loading) {
      setLoading(false);
    }
    
    if (status.error) {
      console.error('Video error:', status.error);
      setError(true);
      setLoading(false);
    }
  };

  const handlePlayPause = async () => {
    if (showThumbnail) {
      setShowThumbnail(false);
      setLoading(true);
      try {
        await videoRef.current.playAsync();
      } catch (e) {
        console.error('Error playing video:', e);
        setError(true);
        setLoading(false);
      }
      return;
    }
    
    if (status.isPlaying) {
      await videoRef.current.pauseAsync();
    } else {
      await videoRef.current.playAsync();
    }
  };

  return (
    <View style={styles.container}>
      {showThumbnail ? (
        <Image 
          source={{ uri: thumbnail }} 
          style={styles.thumbnail}
          resizeMode="cover"
        />
      ) : (
        <Video
          ref={videoRef}
          style={styles.video}
          source={{ uri: videoUrl }}
          resizeMode="cover"
          isLooping
          onPlaybackStatusUpdate={handlePlaybackStatusUpdate}
          useNativeControls={false}
        />
      )}
      
      {error && (
        <View style={styles.errorContainer}>
          <Feather name="alert-circle" size={24} color={theme.danger} />
          <Text style={[styles.errorText, { color: theme.isDark ? '#FFFFFF' : '#FFFFFF' }]}>
            Failed to load video
          </Text>
        </View>
      )}
      
      {loading && (
        <View style={[
          styles.loadingContainer,
          { backgroundColor: theme.isDark ? 'rgba(0, 0, 0, 0.5)' : 'rgba(0, 0, 0, 0.3)' }
        ]}>
          <ActivityIndicator size="large" color="#FFFFFF" />
        </View>
      )}
      
      <TouchableOpacity
        style={[
          styles.playPauseButton,
          { backgroundColor: theme.primary + 'CC' }  // Add some transparency
        ]}
        onPress={handlePlayPause}
      >
        <Feather 
          name={showThumbnail || !status.isPlaying ? "play" : "pause"} 
          size={24} 
          color="#FFFFFF" 
        />
      </TouchableOpacity>
      
      <View style={styles.controlsOverlay}>
        {!showThumbnail && !loading && (
          <>
            <TouchableOpacity 
              style={[
                styles.controlButton,
                { backgroundColor: theme.primary + 'CC' }
              ]}
            >
              <Feather name="volume-2" size={20} color="#FFFFFF" />
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[
                styles.controlButton,
                { backgroundColor: theme.primary + 'CC' }
              ]}
            >
              <Feather name="maximize" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: 240,
    backgroundColor: '#000000',
    position: 'relative',
  },
  video: {
    width: '100%',
    height: '100%',
  },
  thumbnail: {
    width: '100%',
    height: '100%',
  },
  playPauseButton: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginLeft: -24,
    marginTop: -24,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  controlsOverlay: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    flexDirection: 'row',
    padding: 16,
  },
  controlButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  loadingContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  errorContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  errorText: {
    color: '#FFFFFF',
    marginTop: 8,
    fontSize: 14,
  },
});
