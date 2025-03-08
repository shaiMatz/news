import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity, 
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useLocation } from '../contexts/LocationContext';
import { uploadNews } from '../services/api';
import { requestCameraPermission, requestStoragePermission } from '../utils/permissions';
import LoadingIndicator from '../components/LoadingIndicator';

export default function UploadNewsScreen() {
  const navigation = useNavigation();
  const { location, locationName } = useLocation();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [videoSource, setVideoSource] = useState(null);
  const [thumbnail, setThumbnail] = useState(null);
  const [loading, setLoading] = useState(false);

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
      
      // In a real app, we would use something like react-native-image-picker
      // This is a simplified example
      Alert.alert(
        'Select Video Source',
        'Choose where you want to select your video from',
        [
          {
            text: 'Camera',
            onPress: () => console.log('Camera selected'),
          },
          {
            text: 'Gallery',
            onPress: () => console.log('Gallery selected'),
          },
          {
            text: 'Cancel',
            style: 'cancel',
          },
        ]
      );
      
      // Mock video selection
      setVideoSource({ uri: 'mock://video-uri' });
      setThumbnail({ uri: 'mock://thumbnail-uri' });
      
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
      
      await uploadNews(newsData);
      
      Alert.alert(
        'Upload Successful',
        'Your news has been uploaded successfully!',
        [{ text: 'OK', onPress: () => {
          setTitle('');
          setDescription('');
          setVideoSource(null);
          setThumbnail(null);
          navigation.navigate('Home');
        }}]
      );
    } catch (error) {
      console.error('Upload error:', error);
      Alert.alert('Upload Failed', 'There was an error uploading your news. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingIndicator message="Uploading your news..." />;
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
            <TouchableOpacity 
              style={styles.videoSelectButton}
              onPress={handleSelectVideo}
            >
              {videoSource ? (
                <View style={styles.videoSelected}>
                  <Feather name="check-circle" size={24} color="#10B981" />
                  <Text style={styles.videoSelectedText}>Video selected</Text>
                </View>
              ) : (
                <>
                  <Feather name="video" size={24} color="#64748B" />
                  <Text style={styles.videoSelectText}>Select video</Text>
                </>
              )}
            </TouchableOpacity>
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
});
