import React, { useState } from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Modal, Alert } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import AuthModal from './AuthModal';

/**
 * LiveShareButton component for initiating live streams or news uploads
 * 
 * @param {Object} props
 * @param {boolean} props.floating - Whether to display as a floating action button
 * @param {Function} props.onPress - Optional custom press handler
 */
export default function LiveShareButton({ floating = false, onPress }) {
  const { user } = useAuth();
  const { theme } = useTheme();
  const navigation = useNavigation();
  const [showOptions, setShowOptions] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  
  const handlePress = () => {
    if (onPress) {
      onPress();
      return;
    }
    
    if (!user) {
      setShowAuthModal(true);
      return;
    }
    
    setShowOptions(true);
  };
  
  const handleOptionPress = (option) => {
    setShowOptions(false);
    
    switch(option) {
      case 'upload':
        navigation.navigate('Upload');
        break;
      case 'live':
        // Navigate to live stream creation
        Alert.alert('Coming Soon', 'Live streaming will be available soon!');
        break;
      case 'story':
        // Navigate to story creation
        Alert.alert('Coming Soon', 'Story sharing will be available soon!');
        break;
      default:
        break;
    }
  };
  
  return (
    <>
      {floating ? (
        <TouchableOpacity
          style={[styles.floatingButton, { backgroundColor: theme.primary }]}
          onPress={handlePress}
          activeOpacity={0.8}
        >
          <Feather name="plus" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      ) : (
        <TouchableOpacity
          style={styles.button}
          onPress={handlePress}
          activeOpacity={0.8}
        >
          <View style={[styles.buttonInner, { backgroundColor: theme.primary }]}>
            <Feather name="plus" size={24} color="#FFFFFF" />
          </View>
        </TouchableOpacity>
      )}
      
      {/* Options Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={showOptions}
        onRequestClose={() => setShowOptions(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowOptions(false)}
        >
          <View style={[styles.optionsContainer, { backgroundColor: theme.cardBackground }]}>
            <TouchableOpacity
              style={styles.option}
              onPress={() => handleOptionPress('upload')}
            >
              <View style={[styles.optionIcon, { backgroundColor: theme.primary }]}>
                <Feather name="upload" size={20} color="#FFFFFF" />
              </View>
              <Text style={[styles.optionText, { color: theme.text }]}>Upload News</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.option}
              onPress={() => handleOptionPress('live')}
            >
              <View style={[styles.optionIcon, { backgroundColor: '#f97316' }]}>
                <Feather name="radio" size={20} color="#FFFFFF" />
              </View>
              <Text style={[styles.optionText, { color: theme.text }]}>Go Live</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.option}
              onPress={() => handleOptionPress('story')}
            >
              <View style={[styles.optionIcon, { backgroundColor: '#8b5cf6' }]}>
                <Feather name="camera" size={20} color="#FFFFFF" />
              </View>
              <Text style={[styles.optionText, { color: theme.text }]}>Create Story</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
      
      {/* Auth Modal */}
      <AuthModal
        visible={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        initialTab="login"
      />
    </>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonInner: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  floatingButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
    zIndex: 999,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  optionsContainer: {
    padding: 16,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.1,
    shadowRadius: 4.65,
    elevation: 10,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  optionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  optionText: {
    fontSize: 16,
    fontWeight: '500',
  },
});