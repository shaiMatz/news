import React, { useState } from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Modal, TouchableWithoutFeedback, Platform, Share, Alert } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { useLocation } from '../contexts/LocationContext';
import { shareToPlatform, generateShareableUrl, formatShareText, trackShareEvent } from '../utils/ShareUtils';

/**
 * ShareButton component for sharing news content
 * 
 * @param {Object} props
 * @param {Object} props.newsItem - The news item to share
 * @param {string} props.size - Size of the button ('small', 'medium', 'large')
 * @param {boolean} props.showLabel - Whether to show text label
 * @param {Function} props.onShare - Callback when sharing is completed
 * @param {boolean} props.logShareEvent - Whether to log the share event
 */
export default function ShareButton({ 
  newsItem, 
  size = 'medium', 
  showLabel = false,
  onShare = () => {},
  logShareEvent = true
}) {
  const [modalVisible, setModalVisible] = useState(false);
  const { user } = useAuth();
  const { currentLocation } = useLocation();
  
  // Determine icon size based on the size prop
  let iconSize;
  switch (size) {
    case 'small':
      iconSize = 16;
      break;
    case 'large':
      iconSize = 24;
      break;
    case 'medium':
    default:
      iconSize = 20;
      break;
  }
  
  // Generate share text and URL
  const shareableUrl = generateShareableUrl(newsItem.id, { 
    source: 'app', 
    medium: 'social',
    campaign: 'user_share'
  });
  
  const shareText = formatShareText(newsItem, {
    hashtags: ['NewsGeo', 'LocalNews']
  });
  
  // Handle share button press
  const handleSharePress = () => {
    // If on native mobile, use the Share API
    if (Platform.OS !== 'web') {
      handleNativeShare();
    } else {
      // On web, show sharing options
      setModalVisible(true);
    }
  };
  
  // Handle native sharing (React Native)
  const handleNativeShare = async () => {
    try {
      const result = await Share.share({
        title: newsItem.title || 'Breaking News',
        message: `${shareText}\n${shareableUrl}`,
        url: shareableUrl
      });
      
      if (result.action === Share.sharedAction) {
        if (result.activityType) {
          // Shared with activity type of result.activityType
          logShare(result.activityType);
        } else {
          // Shared
          logShare('native');
        }
        onShare(true);
      } else if (result.action === Share.dismissedAction) {
        // Dismissed
        onShare(false);
      }
    } catch (error) {
      Alert.alert('Error sharing', error.message);
    }
  };
  
  // Log share event
  const logShare = (platform) => {
    if (logShareEvent) {
      trackShareEvent(platform, newsItem.id, {
        id: user?.id,
        location: currentLocation
      });
    }
  };
  
  // Handle sharing to a specific platform
  const handlePlatformShare = async (platform) => {
    const shareData = {
      title: newsItem.title || 'Breaking News',
      text: shareText,
      url: shareableUrl
    };
    
    const success = await shareToPlatform(platform, shareData);
    
    if (success) {
      logShare(platform);
      onShare(true);
    } else {
      onShare(false);
    }
    
    setModalVisible(false);
  };
  
  // Close the share modal
  const closeModal = () => {
    setModalVisible(false);
  };
  
  return (
    <>
      <TouchableOpacity style={styles.shareButton} onPress={handleSharePress} accessibilityLabel="Share">
        <Feather name="share-2" size={iconSize} color="#64748B" />
        {showLabel && <Text style={styles.buttonText}>Share</Text>}
      </TouchableOpacity>
      
      {/* Share Modal (for web) */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={closeModal}
      >
        <TouchableWithoutFeedback onPress={closeModal}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Share via</Text>
                  <TouchableOpacity onPress={closeModal}>
                    <Feather name="x" size={24} color="#1E293B" />
                  </TouchableOpacity>
                </View>
                <View style={styles.shareOptions}>
                  <ShareOption 
                    icon="twitter" 
                    label="Twitter"
                    onPress={() => handlePlatformShare('twitter')}
                  />
                  <ShareOption 
                    icon="facebook" 
                    label="Facebook"
                    onPress={() => handlePlatformShare('facebook')}
                  />
                  <ShareOption 
                    icon="linkedin" 
                    label="LinkedIn"
                    onPress={() => handlePlatformShare('linkedin')}
                  />
                  <ShareOption 
                    icon="send" 
                    label="WhatsApp"
                    onPress={() => handlePlatformShare('whatsapp')}
                  />
                  <ShareOption 
                    icon="mail" 
                    label="Email"
                    onPress={() => handlePlatformShare('email')}
                  />
                  <ShareOption 
                    icon="copy" 
                    label="Copy Link"
                    onPress={() => handlePlatformShare('copy')}
                  />
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </>
  );
}

/**
 * ShareOption component for individual sharing platform
 */
function ShareOption({ icon, label, onPress }) {
  return (
    <TouchableOpacity style={styles.shareOption} onPress={onPress}>
      <View style={styles.shareIconWrapper}>
        <Feather name={icon} size={24} color="#2563EB" />
      </View>
      <Text style={styles.shareOptionLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  buttonText: {
    marginLeft: 4,
    fontSize: 14,
    color: '#64748B',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '80%',
    maxWidth: 320,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1E293B',
  },
  shareOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  shareOption: {
    width: '30%',
    alignItems: 'center',
    marginBottom: 16,
  },
  shareIconWrapper: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  shareOptionLabel: {
    fontSize: 12,
    color: '#1E293B',
    textAlign: 'center',
  },
});