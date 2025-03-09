import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, TextInput, Switch, ScrollView, TouchableWithoutFeedback, Image, Platform } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { useLocation } from '../contexts/LocationContext';
import { generateShareableUrl, formatShareText, shareToPlatform, getShareTargets, trackShareEvent } from '../utils/ShareUtils';

/**
 * ShareSheet component - A detailed sharing interface with customization options
 * 
 * @param {Object} props
 * @param {boolean} props.visible - Whether the share sheet is visible
 * @param {Function} props.onClose - Function to close the share sheet
 * @param {Object} props.newsItem - The news item to share
 * @param {Function} props.onShare - Callback when sharing is completed
 * @param {Array} props.additionalHashtags - Additional hashtags to include
 */
export default function ShareSheet({ 
  visible, 
  onClose, 
  newsItem, 
  onShare = () => {},
  additionalHashtags = []
}) {
  const [customMessage, setCustomMessage] = useState('');
  const [includeLocation, setIncludeLocation] = useState(true);
  const [selectedHashtags, setSelectedHashtags] = useState(['NewsGeo']);
  const [previewUrl, setPreviewUrl] = useState('');
  const { user } = useAuth();
  const { currentLocation } = useLocation();
  
  // Default hashtags to choose from
  const availableHashtags = [
    'NewsGeo', 'LocalNews', 'Breaking', 'Community',
    'LiveNews', 'Trending', 'MustRead', 'NowHappening',
    ...additionalHashtags
  ].filter((value, index, self) => self.indexOf(value) === index); // Remove duplicates
  
  // Initialize selected hashtags on mount
  useEffect(() => {
    if (visible) {
      // Add any news category as a hashtag
      if (newsItem.category) {
        const categoryHashtag = newsItem.category.replace(/\s+/g, '');
        if (!selectedHashtags.includes(categoryHashtag)) {
          setSelectedHashtags([...selectedHashtags, categoryHashtag]);
        }
      }
      
      // Generate preview URL
      const shareableUrl = generateShareableUrl(newsItem.id, {
        source: 'app',
        medium: 'social',
        campaign: 'user_share'
      });
      setPreviewUrl(shareableUrl);
    }
  }, [visible, newsItem]);
  
  // Toggle a hashtag selection
  const toggleHashtag = (hashtag) => {
    if (selectedHashtags.includes(hashtag)) {
      setSelectedHashtags(selectedHashtags.filter(h => h !== hashtag));
    } else {
      setSelectedHashtags([...selectedHashtags, hashtag]);
    }
  };
  
  // Get available share targets for the current platform
  const shareTargets = getShareTargets();
  
  // Generate share text based on current options
  const getShareText = () => {
    return formatShareText(newsItem, {
      message: customMessage,
      hashtags: selectedHashtags,
      excludeLocation: !includeLocation
    });
  };
  
  // Handle sharing to a specific platform
  const handleShare = async (platform) => {
    const shareText = getShareText();
    
    const shareData = {
      title: newsItem.title || 'Breaking News',
      text: shareText,
      url: previewUrl
    };
    
    const success = await shareToPlatform(platform, shareData);
    
    if (success) {
      // Track the share event
      trackShareEvent(platform, newsItem.id, {
        id: user?.id,
        location: currentLocation
      });
      
      onShare(platform, shareText, previewUrl);
      onClose();
    }
  };
  
  // Copy link to clipboard
  const copyLink = async () => {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      try {
        await navigator.clipboard.writeText(previewUrl);
        alert('Link copied to clipboard!');
        
        // Track copy event
        trackShareEvent('copy', newsItem.id, {
          id: user?.id,
          location: currentLocation
        });
        
        onShare('copy', null, previewUrl);
      } catch (error) {
        console.error('Failed to copy link:', error);
      }
    }
  };
  
  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View style={styles.container}>
              <View style={styles.header}>
                <Text style={styles.title}>Share this news</Text>
                <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                  <Feather name="x" size={24} color="#1E293B" />
                </TouchableOpacity>
              </View>
              
              <ScrollView style={styles.content}>
                {/* News Preview */}
                <View style={styles.previewContainer}>
                  {newsItem.imageUrl && (
                    <Image 
                      source={{ uri: newsItem.imageUrl }} 
                      style={styles.previewImage} 
                      resizeMode="cover" 
                    />
                  )}
                  <View style={styles.previewContent}>
                    <Text style={styles.previewTitle} numberOfLines={2}>
                      {newsItem.title || 'Breaking News'}
                    </Text>
                    {newsItem.location && includeLocation && (
                      <Text style={styles.previewLocation}>{newsItem.location}</Text>
                    )}
                    <Text style={styles.previewUrl} numberOfLines={1}>
                      {previewUrl}
                    </Text>
                  </View>
                </View>
                
                {/* Customization Options */}
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Customize your message</Text>
                  <TextInput
                    style={styles.messageInput}
                    placeholder="Add a comment (optional)"
                    value={customMessage}
                    onChangeText={setCustomMessage}
                    multiline
                    maxLength={100}
                  />
                  
                  {/* Include Location Toggle */}
                  {newsItem.location && (
                    <View style={styles.optionRow}>
                      <Text style={styles.optionLabel}>Include location</Text>
                      <Switch
                        value={includeLocation}
                        onValueChange={setIncludeLocation}
                        trackColor={{ true: '#2563EB', false: '#E2E8F0' }}
                      />
                    </View>
                  )}
                  
                  {/* Hashtags */}
                  <Text style={styles.subsectionTitle}>Hashtags</Text>
                  <View style={styles.hashtagsContainer}>
                    {availableHashtags.map(hashtag => (
                      <TouchableOpacity
                        key={hashtag}
                        style={[
                          styles.hashtagButton,
                          selectedHashtags.includes(hashtag) && styles.selectedHashtag
                        ]}
                        onPress={() => toggleHashtag(hashtag)}
                      >
                        <Text 
                          style={[
                            styles.hashtagText,
                            selectedHashtags.includes(hashtag) && styles.selectedHashtagText
                          ]}
                        >
                          #{hashtag}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
                
                {/* Share Preview */}
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Preview</Text>
                  <View style={styles.previewBox}>
                    <Text style={styles.previewText}>{getShareText()}</Text>
                  </View>
                </View>
                
                {/* Share Platforms */}
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Share to</Text>
                  <View style={styles.shareTargets}>
                    {shareTargets.map(target => (
                      <TouchableOpacity
                        key={target.id}
                        style={styles.shareTarget}
                        onPress={() => handleShare(target.id)}
                      >
                        <View style={styles.shareIconContainer}>
                          <Feather name={target.icon} size={24} color="#2563EB" />
                        </View>
                        <Text style={styles.shareTargetLabel}>{target.name}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
                
                {/* Copy Link Button */}
                <TouchableOpacity style={styles.copyButton} onPress={copyLink}>
                  <Feather name="link" size={20} color="#FFFFFF" />
                  <Text style={styles.copyButtonText}>Copy Link</Text>
                </TouchableOpacity>
              </ScrollView>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  container: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    height: '80%',
    paddingBottom: Platform.OS === 'ios' ? 40 : 20, // Extra padding for iOS
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1E293B',
  },
  closeButton: {
    padding: 4,
  },
  content: {
    flex: 1,
  },
  previewContainer: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    margin: 16,
    overflow: 'hidden',
  },
  previewImage: {
    width: 80,
    height: 80,
  },
  previewContent: {
    flex: 1,
    padding: 8,
  },
  previewTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 4,
  },
  previewLocation: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 4,
  },
  previewUrl: {
    fontSize: 12,
    color: '#94A3B8',
  },
  section: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 12,
  },
  messageInput: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#1E293B',
    minHeight: 80,
    textAlignVertical: 'top',
  },
  optionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
  },
  optionLabel: {
    fontSize: 16,
    color: '#1E293B',
  },
  subsectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
    marginTop: 16,
    marginBottom: 8,
  },
  hashtagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  hashtagButton: {
    backgroundColor: '#F1F5F9',
    borderRadius: 16,
    paddingVertical: 6,
    paddingHorizontal: 12,
    margin: 4,
  },
  selectedHashtag: {
    backgroundColor: '#2563EB',
  },
  hashtagText: {
    color: '#64748B',
    fontSize: 14,
  },
  selectedHashtagText: {
    color: '#FFFFFF',
  },
  previewBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    padding: 12,
  },
  previewText: {
    fontSize: 14,
    color: '#334155',
    lineHeight: 20,
  },
  shareTargets: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  shareTarget: {
    width: '30%',
    alignItems: 'center',
    marginBottom: 16,
  },
  shareIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  shareTargetLabel: {
    fontSize: 12,
    color: '#1E293B',
  },
  copyButton: {
    flexDirection: 'row',
    backgroundColor: '#2563EB',
    borderRadius: 8,
    padding: 12,
    justifyContent: 'center',
    alignItems: 'center',
    margin: 16,
  },
  copyButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    marginLeft: 8,
  },
});