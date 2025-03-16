import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity, 
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Image,
  ActivityIndicator,
  Animated
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useLocation } from '../contexts/LocationContext';
import { uploadNews } from '../services/api';
import { requestCameraPermission, requestStoragePermission } from '../utils/permissions';
import { Video } from 'expo-av';
import LoadingIndicator from '../components/LoadingIndicator';

export default function UploadNewsScreen() {
  const navigation = useNavigation();
  const { location, locationName } = useLocation();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [videoSource, setVideoSource] = useState(null);
  const [thumbnail, setThumbnail] = useState(null);
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showVideoPreview, setShowVideoPreview] = useState(false);
  
  // Animation for upload progress
  const progressAnimation = new Animated.Value(0);
  
  useEffect(() => {
    if (loading && uploadProgress > 0) {
      Animated.timing(progressAnimation, {
        toValue: uploadProgress,
        duration: 300,
        useNativeDriver: false,
      }).start();
    }
  }, [uploadProgress, loading]);

  const handleSelectVideo = async () => {
    try {
      const cameraPermission = await requestCameraPermission();
      const storagePermission = await requestStoragePermission();
      
      if (!cameraPermission || !storagePermission) {
        Alert.alert(
          'Permission Denied',
          'We need camera and storage permissions to upload videos.'
        );
        return;
      }
      
      // Show source selection options
      Alert.alert(
        'Select Video Source',
        'Choose where you want to select your video from',
        [
          {
            text: 'Camera',
            onPress: async () => {
              try {
                // Import image picker dynamically to avoid issues
                const ImagePicker = require('expo-image-picker');
                
                const result = await ImagePicker.launchCameraAsync({
                  mediaTypes: ImagePicker.MediaTypeOptions.Videos,
                  allowsEditing: true,
                  quality: 0.8,
                  videoMaxDuration: 60, // Limit to 60 seconds
                });
      
                if (!result.canceled && result.assets && result.assets.length > 0) {
                  setVideoSource({ uri: result.assets[0].uri });
                  
                  // Normally we would generate a thumbnail from video here
                  // For now, we'll just set a placeholder
                  setThumbnail({ 
                    uri: result.assets[0].uri, 
                    type: 'video'
                  });
                }
              } catch (err) {
                console.error('Camera video selection error:', err);
                Alert.alert('Error', 'Failed to record video. Please try again.');
              }
            },
          },
          {
            text: 'Gallery',
            onPress: async () => {
              try {
                // Import image picker dynamically to avoid issues
                const ImagePicker = require('expo-image-picker');
                
                const result = await ImagePicker.launchImageLibraryAsync({
                  mediaTypes: ImagePicker.MediaTypeOptions.Videos,
                  allowsEditing: true,
                  quality: 0.8,
                });
      
                if (!result.canceled && result.assets && result.assets.length > 0) {
                  setVideoSource({ uri: result.assets[0].uri });
                  
                  // Normally we would generate a thumbnail from video here
                  // For now, we'll just set a placeholder
                  setThumbnail({ 
                    uri: result.assets[0].uri, 
                    type: 'video'
                  });
                }
              } catch (err) {
                console.error('Gallery video selection error:', err);
                Alert.alert('Error', 'Failed to select video. Please try again.');
              }
            },
          },
          {
            text: 'Cancel',
            style: 'cancel',
          },
        ]
      );
    } catch (error) {
      console.error('Error selecting video:', error);
      Alert.alert('Error', 'Failed to select video. Please try again.');
    }
  };

  const handleUpload = async () => {
    if (!title.trim()) {
      Alert.alert('Missing Title', 'Please enter a title for your news.');
      return;
    }
    
    if (!description.trim()) {
      Alert.alert('Missing Description', 'Please enter a description for your news.');
      return;
    }
    
    if (!videoSource) {
      Alert.alert('Missing Video', 'Please select a video to upload.');
      return;
    }
    
    try {
      setLoading(true);
      setUploadProgress(0);
      
      const newsData = {
        title,
        description,
        videoUrl: videoSource.uri,
        thumbnail: thumbnail?.uri,
        location: locationName || 'Unknown Location',
        coordinates: location ? {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude
        } : null
      };
      
      // Simulate upload progress
      // In a real app, your API would provide progress updates
      const simulateProgress = () => {
        // Progress stops at 90% to simulate server-side processing
        const intervalId = setInterval(() => {
          setUploadProgress(prev => {
            if (prev >= 90) {
              clearInterval(intervalId);
              return prev;
            }
            // Random jumps in progress to simulate real upload behavior
            return Math.min(90, prev + (Math.random() * 15));
          });
        }, 500);
        
        return intervalId;
      };
      
      const progressInterval = simulateProgress();
      
      // Actual API call - in a real app this would report progress
      await uploadNews(newsData);
      
      // Clear the interval and set progress to 100%
      clearInterval(progressInterval);
      setUploadProgress(100);
      
      // Short delay to show 100% completion before success message
      setTimeout(() => {
        setLoading(false);
        Alert.alert(
          'Upload Successful',
          'Your news has been uploaded successfully!',
          [{ text: 'OK', onPress: () => {
            setTitle('');
            setDescription('');
            setVideoSource(null);
            setThumbnail(null);
            setUploadProgress(0);
            navigation.navigate('Home');
          }}]
        );
      }, 500);
      
    } catch (error) {
      console.error('Upload error:', error);
      setLoading(false);
      Alert.alert('Upload Failed', 'There was an error uploading your news. Please try again.');
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <View style={styles.loadingContent}>
          <ActivityIndicator size="large" color="#2563EB" />
          <Text style={styles.loadingText}>Uploading your news...</Text>
          
          <View style={styles.uploadProgressContainer}>
            <Animated.View 
              style={[
                styles.uploadProgressBar, 
                {
                  width: progressAnimation.interpolate({
                    inputRange: [0, 100],
                    outputRange: ['0%', '100%']
                  })
                }
              ]} 
            />
          </View>
          
          <Text style={styles.uploadProgressText}>
            {Math.round(uploadProgress)}% complete
          </Text>

          {uploadProgress >= 90 && (
            <Text style={styles.processingText}>
              Processing video, almost done...
            </Text>
          )}
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : null}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <Text style={styles.title}>Upload News</Text>
        <Text style={styles.subtitle}>Share news from your location</Text>
        
        <View style={styles.formContainer}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Title</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Enter a title for your news"
              value={title}
              onChangeText={setTitle}
              maxLength={100}
            />
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Description</Text>
            <TextInput
              style={[styles.textInput, styles.textArea]}
              placeholder="Provide details about the news"
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={6}
              textAlignVertical="top"
            />
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Video</Text>
            {videoSource ? (
              <View style={styles.videoPreviewContainer}>
                <Video
                  source={{ uri: videoSource.uri }}
                  style={styles.videoPreview}
                  resizeMode="cover"
                  useNativeControls
                  isLooping={false}
                />
                <View style={styles.videoActions}>
                  <TouchableOpacity 
                    style={styles.videoActionButton}
                    onPress={() => setShowVideoPreview(!showVideoPreview)}
                  >
                    <Feather name={showVideoPreview ? "eye-off" : "eye"} size={16} color="#64748B" />
                    <Text style={styles.videoActionText}>
                      {showVideoPreview ? "Hide Preview" : "Show Preview"}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.videoActionButton, styles.videoActionButtonDanger]}
                    onPress={() => {
                      Alert.alert(
                        "Remove Video",
                        "Are you sure you want to remove this video?",
                        [
                          { text: "Cancel", style: "cancel" },
                          { 
                            text: "Remove", 
                            style: "destructive",
                            onPress: () => {
                              setVideoSource(null);
                              setThumbnail(null);
                            }
                          }
                        ]
                      );
                    }}
                  >
                    <Feather name="trash-2" size={16} color="#EF4444" />
                    <Text style={[styles.videoActionText, styles.videoActionTextDanger]}>
                      Remove
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <TouchableOpacity 
                style={styles.videoSelectButton}
                onPress={handleSelectVideo}
              >
                <Feather name="video" size={24} color="#64748B" />
                <Text style={styles.videoSelectText}>Select video</Text>
              </TouchableOpacity>
            )}
          </View>
          
          <View style={styles.locationGroup}>
            <Feather name="map-pin" size={16} color="#64748B" />
            <Text style={styles.locationText}>
              {locationName || 'Detecting location...'}
            </Text>
          </View>
          
          <TouchableOpacity 
            style={styles.uploadButton}
            onPress={handleUpload}
            disabled={!title || !description || !videoSource}
          >
            <Text style={styles.uploadButtonText}>Upload News</Text>
            <Feather name="upload-cloud" size={20} color="#FFFFFF" />
          </TouchableOpacity>
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
  scrollContainer: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#64748B',
    marginBottom: 24,
  },
  formContainer: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  inputGroup: {
    marginBottom: 20,
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
    minHeight: 120,
  },
  videoSelectButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderStyle: 'dashed',
  },
  videoSelectText: {
    marginLeft: 8,
    fontSize: 16,
    color: '#64748B',
  },
  videoSelected: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  videoSelectedText: {
    marginLeft: 8,
    fontSize: 16,
    color: '#10B981',
  },
  locationGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  locationText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#64748B',
  },
  uploadButton: {
    backgroundColor: '#2563EB',
    borderRadius: 8,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginRight: 8,
  },
  videoPreviewContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 12,
  },
  videoPreview: {
    width: '100%',
    height: 200,
    backgroundColor: '#0F172A',
  },
  videoActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 8,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  videoActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
  },
  videoActionButtonDanger: {
    borderRadius: 4,
  },
  videoActionText: {
    marginLeft: 6,
    fontSize: 14,
    color: '#64748B',
  },
  videoActionTextDanger: {
    color: '#EF4444',
  },
  uploadProgressContainer: {
    marginTop: 16,
    backgroundColor: '#F1F5F9',
    borderRadius: 8,
    height: 8,
    overflow: 'hidden',
  },
  uploadProgressBar: {
    height: '100%',
    backgroundColor: '#10B981',
  },
  uploadProgressText: {
    marginTop: 4,
    fontSize: 12,
    color: '#64748B',
    textAlign: 'right',
  },
});
