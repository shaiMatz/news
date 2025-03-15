import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  StyleSheet, 
  TouchableOpacity, 
  ActivityIndicator, 
  Image, 
  Text,
  Dimensions,
  Platform
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Video } from 'expo-av';
import { useTheme } from '../contexts/ThemeContext';
import { useLocalizationContext } from '../contexts/LocalizationContext';
import useLocalization from '../hooks/useLocalization';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

/**
 * LiveStreamPlayer component for displaying live video streams
 * 
 * @param {Object} props
 * @param {string} props.streamUrl - URL of the live stream
 * @param {string} props.streamId - ID of the stream
 * @param {string} props.thumbnail - URL of the thumbnail image
 * @param {boolean} props.isLive - Whether the stream is currently live
 * @param {Function} props.onError - Error callback
 */
export default function LiveStreamPlayer({ 
  streamUrl, 
  streamId, 
  thumbnail, 
  isLive = true,
  onError 
}) {
  const { theme } = useTheme();
  const { t } = useLocalization();
  const { isRTL } = useLocalizationContext();
  
  const [status, setStatus] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showThumbnail, setShowThumbnail] = useState(true);
  const [streamStats, setStreamStats] = useState({
    viewers: 0,
    quality: 'HD',
    buffering: false
  });
  
  const videoRef = useRef(null);
  
  // Handle when stream URL changes (e.g., resolution change)
  useEffect(() => {
    if (!showThumbnail && videoRef.current) {
      // If we're already playing and the URL changes, reload
      handlePlaybackStatusUpdate({ isLoaded: false });
      setLoading(true);
      
      // Give a slight delay to unload the current stream
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.loadAsync({ uri: streamUrl }, {}, false);
        }
      }, 300);
    }
  }, [streamUrl]);
  
  // Periodic check of stream health
  useEffect(() => {
    let statsInterval;
    
    if (!showThumbnail && isLive) {
      // Simulate updating viewer count every 10 seconds
      statsInterval = setInterval(() => {
        setStreamStats(current => ({
          ...current,
          viewers: Math.max(1, Math.floor(Math.random() * 20) + current.viewers - 1),
          buffering: Math.random() > 0.9 // Occasionally show buffering for realism
        }));
      }, 10000);
    }
    
    return () => {
      if (statsInterval) clearInterval(statsInterval);
    };
  }, [showThumbnail, isLive]);
  
  const handlePlaybackStatusUpdate = (status) => {
    setStatus(status);
    
    if (status.isLoaded) {
      setLoading(false);
      
      // Check if the video is buffering
      if (status.isBuffering !== streamStats.buffering) {
        setStreamStats(prev => ({
          ...prev,
          buffering: status.isBuffering
        }));
      }
    }
    
    if (status.error) {
      console.error('Video stream error:', status.error);
      setError(true);
      setErrorMessage(status.error.message || t('streaming.errorLoadingStream'));
      setLoading(false);
      
      if (onError) {
        onError(status.error);
      }
    }
  };
  
  const handleRetry = async () => {
    setError(false);
    setLoading(true);
    
    try {
      if (videoRef.current) {
        await videoRef.current.unloadAsync();
        await videoRef.current.loadAsync(
          { uri: streamUrl },
          { shouldPlay: true },
          false
        );
      }
    } catch (e) {
      console.error('Error retrying video load:', e);
      setError(true);
      setErrorMessage(e.message || t('streaming.errorLoadingStream'));
      setLoading(false);
    }
  };
  
  const handlePlayPause = async () => {
    if (showThumbnail) {
      setShowThumbnail(false);
      setLoading(true);
      
      try {
        if (videoRef.current) {
          await videoRef.current.loadAsync(
            { uri: streamUrl },
            { shouldPlay: true },
            false
          );
        }
      } catch (e) {
        console.error('Error loading video:', e);
        setError(true);
        setErrorMessage(e.message || t('streaming.errorLoadingStream'));
        setLoading(false);
      }
      return;
    }
    
    try {
      if (status.isPlaying) {
        await videoRef.current.pauseAsync();
      } else {
        await videoRef.current.playAsync();
      }
    } catch (e) {
      console.error('Error toggling playback:', e);
    }
  };
  
  // Helper function for RTL-aware styling
  const getDirectionStyle = () => {
    return isRTL
      ? { flexDirection: 'row-reverse' }
      : { flexDirection: 'row' };
  };

  // Helper function for text alignment
  const getTextAlignStyle = () => {
    return { textAlign: isRTL ? 'right' : 'left' };
  };

  // Adjust play button position for RTL
  const getPlayButtonStyle = () => {
    const base = {
      position: 'absolute',
      top: '50%',
      width: 48,
      height: 48,
      marginTop: -24,
      borderRadius: 24,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: theme.primary + 'CC'
    };
    
    // For RTL layouts, position differently
    if (isRTL) {
      return {
        ...base,
        right: '50%',
        marginRight: -24
      };
    }
    
    return {
      ...base,
      left: '50%',
      marginLeft: -24
    };
  };

  return (
    <View style={styles.container}>
      {showThumbnail ? (
        <Image 
          source={{ uri: thumbnail || 'https://via.placeholder.com/400x240?text=Live' }} 
          style={styles.thumbnail}
          resizeMode="cover"
        />
      ) : (
        <Video
          ref={videoRef}
          style={styles.video}
          source={{ uri: streamUrl }}
          resizeMode="cover"
          shouldPlay
          isLooping={false}
          onPlaybackStatusUpdate={handlePlaybackStatusUpdate}
          useNativeControls={false}
        />
      )}
      
      {/* Live indicator and stream stats */}
      {isLive && (
        <View style={[
          styles.liveContainer,
          isRTL ? { left: 12, right: undefined } : { right: 12, left: undefined }
        ]}>
          <View style={[styles.liveIndicator, getDirectionStyle()]}>
            <View style={styles.liveIndicatorDot} />
            <Text style={[
              styles.liveText, 
              isRTL ? { marginRight: 4 } : { marginLeft: 4 }
            ]}>
              {t('streaming.live')}
            </Text>
          </View>
          
          {!showThumbnail && (
            <View style={[styles.viewerContainer, getDirectionStyle()]}>
              <Feather name="eye" size={14} color="#FFFFFF" />
              <Text style={[
                styles.viewerText, 
                isRTL ? { marginRight: 4 } : { marginLeft: 4 }
              ]}>
                {streamStats.viewers}
              </Text>
            </View>
          )}
          
          {streamStats.buffering && !showThumbnail && (
            <View style={[styles.bufferingIndicator, getDirectionStyle()]}>
              <ActivityIndicator size="small" color="#FFFFFF" />
              <Text style={[
                styles.bufferingText, 
                isRTL ? { marginRight: 4 } : { marginLeft: 4 }
              ]}>
                {t('streaming.buffering')}
              </Text>
            </View>
          )}
        </View>
      )}
      
      {/* Error message */}
      {error && (
        <View style={styles.errorContainer}>
          <Feather name="alert-circle" size={24} color="#FFFFFF" />
          <Text style={[styles.errorText, getTextAlignStyle()]}>
            {errorMessage || t('streaming.errorLoadingStream')}
          </Text>
          <TouchableOpacity 
            style={styles.retryButton}
            onPress={handleRetry}
          >
            <Text style={styles.retryText}>{t('common.retry')}</Text>
          </TouchableOpacity>
        </View>
      )}
      
      {/* Loading indicator */}
      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FFFFFF" />
          <Text style={[styles.loadingText, getTextAlignStyle()]}>
            {t('streaming.connecting')}
          </Text>
        </View>
      )}
      
      {/* Play/Pause button */}
      <TouchableOpacity
        style={getPlayButtonStyle()}
        onPress={handlePlayPause}
      >
        <Feather 
          name={showThumbnail || !status.isPlaying ? "play" : "pause"} 
          size={24} 
          color="#FFFFFF" 
        />
      </TouchableOpacity>
      
      {/* Controls overlay */}
      <View style={[
        styles.controlsOverlay,
        isRTL ? { flexDirection: 'row-reverse', left: 0, right: undefined } : { right: 0, left: undefined }
      ]}>
        {!showThumbnail && !loading && (
          <>
            <TouchableOpacity 
              style={[
                styles.controlButton,
                { backgroundColor: theme.primary + 'CC' }
              ]}
            >
              <Feather 
                name="volume-2" 
                size={20} 
                color="#FFFFFF" 
              />
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[
                styles.controlButton,
                { backgroundColor: theme.primary + 'CC' },
                isRTL ? { marginRight: 8 } : { marginLeft: 8 }
              ]}
            >
              <Feather 
                name="maximize" 
                size={20} 
                color="#FFFFFF" 
              />
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
  },
  loadingContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  loadingText: {
    color: '#FFFFFF',
    marginTop: 12,
    fontSize: 14,
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
    marginBottom: 16,
    fontSize: 14,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  retryButton: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 4,
  },
  retryText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
  liveContainer: {
    position: 'absolute',
    top: 12,
    flexDirection: 'column',
    alignItems: 'flex-end',
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EF4444',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginBottom: 8,
  },
  liveIndicatorDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FFFFFF',
    marginRight: 4,
  },
  liveText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  viewerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  viewerText: {
    color: '#FFFFFF',
    fontSize: 12,
    marginLeft: 4,
  },
  bufferingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginTop: 8,
  },
  bufferingText: {
    color: '#FFFFFF',
    fontSize: 12,
    marginLeft: 4,
  },
});