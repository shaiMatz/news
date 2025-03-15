import React, { useState, useRef } from 'react';
import { View, StyleSheet, TouchableOpacity, ActivityIndicator, Image, Text } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Video } from 'expo-av';
import { useTheme } from '../contexts/ThemeContext';
import { useLocalizationContext } from '../contexts/LocalizationContext';
import useLocalization from '../hooks/useLocalization';

/**
 * Custom video player component
 * 
 * @param {Object} props
 * @param {string} props.videoUrl - URL of the video to play
 * @param {string} props.thumbnail - URL of the thumbnail image
 */
export default function VideoPlayer({ videoUrl, thumbnail }) {
  const { theme } = useTheme();
  const { isRTL } = useLocalizationContext();
  const { t } = useLocalization();
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

  // Get play button style adjusted for RTL
  const getPlayButtonStyle = () => {
    const base = {
      position: 'absolute',
      top: '50%',
      width: 48,
      height: 48,
      marginTop: -24,
      borderRadius: 24,
      backgroundColor: theme.primary + 'CC',
      justifyContent: 'center',
      alignItems: 'center',
    };
    
    // For RTL layouts, position from the right
    if (isRTL) {
      return {
        ...base,
        right: '50%',
        marginRight: -24
      };
    }
    
    // For LTR layouts, position from the left
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
          <Text style={[
            styles.errorText, 
            getTextAlignStyle(),
            { color: '#FFFFFF' }
          ]}>
            {t('streaming.errorLoadingStream')}
          </Text>
        </View>
      )}
      
      {loading && (
        <View style={[
          styles.loadingContainer,
          { backgroundColor: theme.isDark ? 'rgba(0, 0, 0, 0.5)' : 'rgba(0, 0, 0, 0.3)' }
        ]}>
          <ActivityIndicator size="large" color="#FFFFFF" />
          <Text style={[styles.loadingText, getTextAlignStyle()]}>
            {t('streaming.buffering')}
          </Text>
        </View>
      )}
      
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
      
      <View style={[
        styles.controlsOverlay,
        isRTL 
          ? { left: 0, right: undefined, flexDirection: 'row-reverse' } 
          : { right: 0, left: undefined }
      ]}>
        {!showThumbnail && !loading && (
          <>
            <TouchableOpacity 
              style={[
                styles.controlButton,
                { backgroundColor: theme.primary + 'CC' },
                isRTL ? { marginLeft: 0, marginRight: 8 } : { marginLeft: 8 }
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
                { backgroundColor: theme.primary + 'CC' }
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
  // playPauseButton style is now handled by getPlayButtonStyle() function
  // to properly support RTL layouts
  controlsOverlay: {
    position: 'absolute',
    bottom: 0,
    // right/left positioning is handled in the component's return
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
    // marginLeft is now handled conditionally in the component
  },
  loadingContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
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
    paddingHorizontal: 20,
  },
});
