import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  StyleSheet, 
  SafeAreaView,
  Platform,
  BackHandler
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import LiveStreamCreator from '../components/LiveStreamCreator';
import LiveNewsStream from '../components/LiveNewsStream';
import { useAuth } from '../contexts/AuthContext';

/**
 * LiveStreamScreen for creating and viewing live streams
 */
export default function LiveStreamScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { user } = useAuth();
  
  // Get parameters from navigation
  const isAnonymous = route.params?.isAnonymous || false;
  const newsItem = route.params?.newsItem;
  const mode = route.params?.mode || 'create'; // 'create' or 'view'
  
  const [activeStream, setActiveStream] = useState(null);
  const backHandlerRef = useRef(null);
  
  // Handle back button press to show confirmation before leaving
  useEffect(() => {
    const handleBackPress = () => {
      if (activeStream) {
        // Show confirmation dialog before exiting live stream
        return true; // Prevent default behavior
      }
      return false; // Allow default back behavior
    };
    
    backHandlerRef.current = BackHandler.addEventListener('hardwareBackPress', handleBackPress);
    
    return () => {
      if (backHandlerRef.current) {
        backHandlerRef.current.remove();
      }
    };
  }, [activeStream]);
  
  const handleStreamStart = (stream) => {
    setActiveStream(stream);
  };
  
  const handleClose = () => {
    if (activeStream) {
      // If there's an active stream, we should show confirmation before closing
      setActiveStream(null);
    }
    navigation.goBack();
  };
  
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      
      {mode === 'create' ? (
        <LiveStreamCreator
          isAnonymous={isAnonymous}
          onClose={handleClose}
          onStreamStart={handleStreamStart}
        />
      ) : (
        <LiveNewsStream
          newsItem={newsItem}
          onClose={handleClose}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
});