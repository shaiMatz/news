import React, { useState, useRef, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  TextInput, 
  ScrollView, 
  Alert,
  Platform,
  KeyboardAvoidingView,
  ActivityIndicator
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { Video } from 'expo-av';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useLocation } from '../contexts/LocationContext';
import { createStream } from '../services/api';
import { getLocationName } from '../services/geolocation';
import { requestCameraPermission, requestStoragePermission } from '../utils/permissions';
import useLocalization from '../hooks/useLocalization';
import { getErrorType, handleError } from '../utils/errorUtils';

/**
 * LiveStreamCreator component for setting up and starting a live broadcast
 * 
 * @param {Object} props
 * @param {boolean} props.isAnonymous - Whether the broadcast should be anonymous
 * @param {Function} props.onClose - Function to handle closing the creator
 * @param {Function} props.onStreamStart - Function called when stream starts
 */
export default function LiveStreamCreator({ isAnonymous = false, onClose, onStreamStart }) {
  const { user } = useAuth();
  const { theme } = useTheme();
  const { location, locationName } = useLocation();
  const navigation = useNavigation();
  const { t } = useLocalization();
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [previewSource, setPreviewSource] = useState(null);
  const [thumbnailImage, setThumbnailImage] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isPreparingStream, setIsPreparingStream] = useState(false);
  const [streamStarted, setStreamStarted] = useState(false);
  const [streamUrl, setStreamUrl] = useState(null);
  const [streamId, setStreamId] = useState(null);
  const [quality, setQuality] = useState('standard'); // 'low', 'standard', 'high'
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState(null);
  
  const videoRef = useRef(null);
  
  useEffect(() => {
    // Request necessary permissions when component mounts
    (async () => {
      await requestCameraPermission();
      await requestStoragePermission();
    })();
  }, []);
  
  // Initialize camera preview for live stream
  const startPreviewVideo = async () => {
    try {
      const cameraPermission = await requestCameraPermission();
      
      if (!cameraPermission) {
        Alert.alert(
          'Camera Permission Required',
          'We need camera permission to use the live streaming feature.'
        );
        return;
      }
      
      // Use device camera to preview the stream
      try {
        // Import image picker dynamically to avoid issues
        const ImagePicker = require('expo-image-picker');
        
        const result = await ImagePicker.launchCameraAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Videos,
          allowsEditing: false,
          aspect: [16, 9],
          quality: 0.8,
          videoMaxDuration: 0, // No limit for live stream
          captureVideo: true
        });
        
        if (!result.canceled && result.assets && result.assets.length > 0) {
          setPreviewSource({ uri: result.assets[0].uri });
        }
      } catch (err) {
        console.error('Failed to start camera preview:', err);
        setError('Failed to start camera preview. Please check your device.');
      }
    } catch (error) {
      console.error('Error starting preview:', error);
      setError('Failed to start camera preview. Please check your permissions.');
    }
  };
  
  const handleCaptureThumbnail = async () => {
    try {
      // In a real app, this would capture a frame from the live video
      // For now we'll simulate by selecting an image
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [16, 9],
        quality: 0.8,
      });
      
      if (!result.canceled && result.assets && result.assets.length > 0) {
        setThumbnailImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error capturing thumbnail:', error);
      Alert.alert('Error', 'Failed to capture thumbnail');
    }
  };
  
  const handleChangeQuality = (newQuality) => {
    // Only allow quality changes before stream starts
    if (!streamStarted) {
      setQuality(newQuality);
    }
  };
  
  const startStream = async () => {
    if (!title.trim()) {
      Alert.alert('Missing Title', 'Please enter a title for your live stream.');
      return;
    }
    
    try {
      setIsPreparingStream(true);
      setError(null);
      
      // Create a news item first (if required by your backend)
      // This might need adjustment based on your API design
      const newsData = {
        title,
        description,
        thumbnail: thumbnailImage,
        isLive: true,
        location: locationName || 'Unknown Location',
        coordinates: location ? {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude
        } : null
      };
      
      // Create the stream
      const streamData = {
        title,
        description,
        quality,
        isAnonymous,
        metadata: {
          quality,
          description: description || '',
          thumbnailUrl: thumbnailImage,
          location: newsData.location,
          coordinates: newsData.coordinates
        }
      };
      
      // Call the API to create a stream
      try {
        // Initialize the stream creation with our backend
        const stream = await createStream(streamData);
        
        if (!stream || !stream.id) {
          throw new Error('Failed to create stream, please try again.');
        }
        
        setStreamId(stream.id);
        setStreamUrl(stream.playbackUrl || stream.url);
        setStreamStarted(true);
        setIsPreparingStream(false);
        
        // Notify parent component
        if (onStreamStart) {
          onStreamStart(stream);
        }
        
        Alert.alert(
          'Live Stream Started',
          `Your ${isAnonymous ? 'anonymous' : 'public'} broadcast has begun!`,
          [{ text: 'OK' }]
        );
      } catch (err) {
        console.error('Error creating stream:', err);
        setIsPreparingStream(false);
        setError(err.message || 'Failed to start live stream. Please try again.');
        Alert.alert('Stream Error', 'Failed to start live stream. Please try again.');
      }
      
    } catch (error) {
      console.error('Error starting stream:', error);
      setIsPreparingStream(false);
      setError(handleError(error, 'LiveStreamCreator.startStream'));
      Alert.alert('Stream Error', 'Failed to start live stream. Please try again.');
    }
  };
  
  const stopStream = () => {
    Alert.alert(
      'End Stream',
      'Are you sure you want to end your live stream?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'End Stream', 
          style: 'destructive',
          onPress: async () => {
            try {
              // Call API to end the stream
              if (streamId) {
                await endStream(streamId);
              }
            } catch (error) {
              console.error('Error ending stream:', error);
            } finally {
              // Reset state even if the API call fails
              setStreamStarted(false);
              setStreamUrl(null);
              setStreamId(null);
              setPreviewSource(null);
              
              // Navigate back or close
              if (onClose) {
                onClose();
              } else {
                navigation.goBack();
              }
            }
          }
        }
      ]
    );
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={onClose}>
          <Feather name="x" size={24} color="#1E293B" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {streamStarted ? 'Live Broadcast' : 'Start Live Broadcast'}
        </Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content}>
        {/* Preview/Live Video Area */}
        <View style={styles.videoContainer}>
          {previewSource ? (
            <Video
              ref={videoRef}
              source={previewSource}
              style={styles.video}
              resizeMode="cover"
              useNativeControls={false}
              isLooping
              shouldPlay
            />
          ) : (
            <TouchableOpacity 
              style={styles.placeholderContainer}
              onPress={startPreviewVideo}
            >
              <Feather name="video" size={48} color="#94A3B8" />
              <Text style={styles.placeholderText}>Tap to start camera preview</Text>
            </TouchableOpacity>
          )}
          
          {/* Status Indicators */}
          {streamStarted && (
            <View style={styles.liveIndicatorContainer}>
              <View style={styles.liveIndicator}>
                <View style={styles.liveIndicatorDot} />
                <Text style={styles.liveIndicatorText}>LIVE</Text>
              </View>
              <Text style={styles.viewersCount}>0 viewers</Text>
            </View>
          )}
          
          {isPreparingStream && (
            <View style={styles.preparingOverlay}>
              <ActivityIndicator size="large" color="#FFFFFF" />
              <Text style={styles.preparingText}>Preparing stream...</Text>
            </View>
          )}
        </View>
        
        {/* Broadcast Settings */}
        <View style={styles.settingsContainer}>
          {!streamStarted && (
            <>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Title</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="Enter a title for your broadcast"
                  value={title}
                  onChangeText={setTitle}
                  maxLength={100}
                />
              </View>
              
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Description (optional)</Text>
                <TextInput
                  style={[styles.textInput, styles.textArea]}
                  placeholder="Provide details about your broadcast"
                  value={description}
                  onChangeText={setDescription}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                />
              </View>
              
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Thumbnail</Text>
                <TouchableOpacity 
                  style={styles.thumbnailButton}
                  onPress={handleCaptureThumbnail}
                >
                  {thumbnailImage ? (
                    <View style={styles.thumbnailSelected}>
                      <Feather name="check-circle" size={20} color="#10B981" />
                      <Text style={styles.thumbnailSelectedText}>Thumbnail set</Text>
                    </View>
                  ) : (
                    <>
                      <Feather name="image" size={20} color="#64748B" />
                      <Text style={styles.thumbnailButtonText}>Set thumbnail</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
              
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Quality</Text>
                <View style={styles.qualityButtons}>
                  <TouchableOpacity 
                    style={[
                      styles.qualityButton, 
                      quality === 'low' && styles.qualityButtonActive
                    ]}
                    onPress={() => handleChangeQuality('low')}
                  >
                    <Text style={[
                      styles.qualityButtonText,
                      quality === 'low' && styles.qualityButtonTextActive
                    ]}>Low</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={[
                      styles.qualityButton, 
                      quality === 'standard' && styles.qualityButtonActive
                    ]}
                    onPress={() => handleChangeQuality('standard')}
                  >
                    <Text style={[
                      styles.qualityButtonText,
                      quality === 'standard' && styles.qualityButtonTextActive
                    ]}>Standard</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={[
                      styles.qualityButton, 
                      quality === 'high' && styles.qualityButtonActive
                    ]}
                    onPress={() => handleChangeQuality('high')}
                  >
                    <Text style={[
                      styles.qualityButtonText,
                      quality === 'high' && styles.qualityButtonTextActive
                    ]}>High</Text>
                  </TouchableOpacity>
                </View>
              </View>
              
              <View style={styles.locationGroup}>
                <Feather name="map-pin" size={16} color="#64748B" />
                <Text style={styles.locationText}>
                  {locationName || 'Detecting location...'}
                </Text>
              </View>
              
              <View style={styles.anonymousNote}>
                <Feather 
                  name={isAnonymous ? "user-x" : "user"} 
                  size={16} 
                  color={isAnonymous ? "#F97316" : "#64748B"} 
                />
                <Text style={styles.anonymousNoteText}>
                  {isAnonymous 
                    ? "Your identity will be hidden during this broadcast."
                    : "Your username will be visible to all viewers."}
                </Text>
              </View>
            </>
          )}

          {error && (
            <View style={styles.errorContainer}>
              <Feather name="alert-circle" size={20} color="#EF4444" />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}
        </View>
      </ScrollView>
      
      {/* Footer Actions */}
      <View style={styles.footer}>
        {streamStarted ? (
          <TouchableOpacity 
            style={styles.endButton}
            onPress={stopStream}
          >
            <Feather name="slash" size={20} color="#FFFFFF" />
            <Text style={styles.endButtonText}>End Broadcast</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity 
            style={[styles.startButton, (!title.trim() || isPreparingStream) && styles.startButtonDisabled]}
            onPress={startStream}
            disabled={!title.trim() || isPreparingStream}
          >
            {isPreparingStream ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <Feather name="radio" size={20} color="#FFFFFF" />
                <Text style={styles.startButtonText}>Start Broadcasting</Text>
              </>
            )}
          </TouchableOpacity>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1E293B',
  },
  content: {
    flex: 1,
  },
  videoContainer: {
    height: 240,
    backgroundColor: '#0F172A',
    position: 'relative',
  },
  video: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  placeholderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    color: '#94A3B8',
    marginTop: 12,
    fontSize: 16,
  },
  liveIndicatorContainer: {
    position: 'absolute',
    top: 12,
    left: 12,
    right: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EF4444',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  liveIndicatorDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FFFFFF',
    marginRight: 4,
  },
  liveIndicatorText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 12,
  },
  viewersCount: {
    color: '#FFFFFF',
    fontSize: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  preparingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  preparingText: {
    color: '#FFFFFF',
    marginTop: 12,
    fontSize: 16,
  },
  settingsContainer: {
    padding: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#1E293B',
  },
  textArea: {
    minHeight: 80,
  },
  thumbnailButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    padding: 12,
    borderStyle: 'dashed',
  },
  thumbnailButtonText: {
    fontSize: 16,
    color: '#64748B',
    marginLeft: 8,
  },
  thumbnailSelected: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  thumbnailSelectedText: {
    fontSize: 16,
    color: '#10B981',
    marginLeft: 8,
  },
  qualityButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  qualityButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginHorizontal: 4,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
  },
  qualityButtonActive: {
    backgroundColor: '#2563EB',
  },
  qualityButtonText: {
    fontSize: 14,
    color: '#64748B',
  },
  qualityButtonTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  locationGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  locationText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#64748B',
  },
  anonymousNote: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  anonymousNoteText: {
    fontSize: 14,
    color: '#64748B',
    marginLeft: 8,
    flex: 1,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  errorText: {
    fontSize: 14,
    color: '#EF4444',
    marginLeft: 8,
    flex: 1,
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F97316',
    borderRadius: 8,
    paddingVertical: 14,
    paddingHorizontal: 24,
  },
  startButtonDisabled: {
    backgroundColor: '#FDA382',
  },
  startButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginLeft: 8,
  },
  endButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EF4444',
    borderRadius: 8,
    paddingVertical: 14,
    paddingHorizontal: 24,
  },
  endButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginLeft: 8,
  },
});