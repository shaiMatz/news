import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  FlatList,
  Platform,
  Picker,
  I18nManager
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useLocalizationContext } from '../contexts/LocalizationContext';
import useLocalization from '../hooks/useLocalization';

/**
 * LanguageSelector component for changing app language
 * 
 * @param {Object} props
 * @param {boolean} props.showLabel - Whether to show language name label
 * @param {string} props.type - Display type ('dropdown', 'modal', 'inline')
 * @param {Function} props.onLanguageChange - Callback when language changes
 */
export default function LanguageSelector({ 
  showLabel = true, 
  type = 'dropdown',
  onLanguageChange = null
}) {
  const { language, changeLanguage, getAvailableLanguages, safeT } = useLocalization();
  const { isRTL, getDirectionStyle, getTextAlignStyle, getContainerStyle } = useLocalizationContext();
  const [modalVisible, setModalVisible] = useState(false);
  const languages = getAvailableLanguages();
  
  const currentLanguage = languages.find(lang => lang.code === language) || languages[0];

  // Show refresh notice when changing RTL setting
  const [showReloadNotice, setShowReloadNotice] = useState(false);
  
  const handleLanguageSelect = async (langCode) => {
    if (langCode !== language) {
      // Check if we're switching between RTL/LTR
      const selectedLang = languages.find(lang => lang.code === langCode);
      const isCurrentLangRTL = currentLanguage.isRTL;
      const isSelectedLangRTL = selectedLang.isRTL;
      
      // If RTL direction is changing, handle specially
      if (isCurrentLangRTL !== isSelectedLangRTL) {
        setShowReloadNotice(true);
      }
      
      const success = await changeLanguage(langCode);
      if (success && onLanguageChange) {
        onLanguageChange(langCode);
      }
    }
    
    setModalVisible(false);
  };
  
  // Create directional icon based on RTL status
  const getDirectionalIcon = (iconName) => {
    if (iconName === 'chevron-left' && isRTL) {
      return 'chevron-right';
    } else if (iconName === 'chevron-right' && isRTL) {
      return 'chevron-left';
    }
    return iconName;
  };
  
  // RTL indicator for languages
  const RTLIndicator = ({ isRTL }) => (
    <View style={styles.rtlIndicator}>
      <Text style={styles.rtlIndicatorText}>
        {isRTL ? 'RTL' : 'LTR'}
      </Text>
    </View>
  );
  
  if (type === 'inline') {
    return (
      <View style={[styles.inlineContainer, getDirectionStyle()]}>
        {languages.map(lang => (
          <TouchableOpacity
            key={lang.code}
            style={[
              styles.inlineOption,
              lang.code === language && styles.selectedInlineOption,
              lang.isRTL && styles.rtlLanguageOption
            ]}
            onPress={() => handleLanguageSelect(lang.code)}
          >
            <Text style={[
              styles.inlineOptionText,
              getTextAlignStyle(),
              lang.code === language && styles.selectedInlineOptionText,
              // Use actual language's RTL for text, not app's current RTL
              {textAlign: lang.isRTL ? 'right' : 'left'}
            ]}>
              {lang.nativeName}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  }
  
  if ((Platform.OS === 'ios' || Platform.OS === 'web') && type === 'dropdown') {
    return (
      <View style={styles.container}>
        <TouchableOpacity 
          style={[styles.dropdownButton, getDirectionStyle()]}
          onPress={() => setModalVisible(true)}
        >
          {showLabel && (
            <Text style={[
              styles.dropdownLabel, 
              getTextAlignStyle(), 
              // Handle native text rendering for RTL languages
              currentLanguage.isRTL && styles.rtlLanguageText
            ]}>
              {currentLanguage.nativeName}
            </Text>
          )}
          <Feather name="globe" size={20} color="#64748B" />
        </TouchableOpacity>
        
        <Modal
          animationType="slide"
          transparent={true}
          visible={modalVisible}
          onRequestClose={() => setModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={[styles.modalHeader, getDirectionStyle()]}>
                <Text style={[styles.modalTitle, getTextAlignStyle()]}>{safeT('profile.language')}</Text>
                <TouchableOpacity onPress={() => setModalVisible(false)}>
                  <Feather name="x" size={24} color="#64748B" />
                </TouchableOpacity>
              </View>
              
              <FlatList
                data={languages}
                keyExtractor={(item) => item.code}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[
                      styles.languageOption,
                      getDirectionStyle(),
                      item.code === language && styles.selectedLanguageOption
                    ]}
                    onPress={() => handleLanguageSelect(item.code)}
                  >
                    <View style={{flex: 1}}>
                      <Text style={[
                        styles.languageName,
                        getTextAlignStyle(),
                        item.code === language && styles.selectedLanguageName
                      ]}>
                        {item.name}
                      </Text>
                      <Text style={[
                        styles.nativeName, 
                        // Use actual language's RTL for text, not app's current RTL
                        {textAlign: item.isRTL ? 'right' : 'left'},
                        item.isRTL && styles.rtlLanguageText
                      ]}>
                        {item.nativeName}
                      </Text>
                    </View>
                    
                    <RTLIndicator isRTL={item.isRTL} />
                    
                    {item.code === language && (
                      <Feather name="check" size={20} color="#2563EB" />
                    )}
                  </TouchableOpacity>
                )}
              />
              
              {showReloadNotice && (
                <View style={styles.reloadNotice}>
                  <Text style={styles.reloadNoticeText}>
                    {safeT('profile.languageChangeRestart', 'The app may need to refresh when changing between RTL and LTR languages')}
                  </Text>
                </View>
              )}
            </View>
          </View>
        </Modal>
      </View>
    );
  }
  
  // Default dropdown for other platforms
  return (
    <View style={[styles.container, getDirectionStyle()]}>
      <Picker
        selectedValue={language}
        style={[
          styles.picker, 
          isRTL && {textAlign: 'right', direction: 'rtl'},
          getContainerStyle()
        ]}
        onValueChange={handleLanguageSelect}
      >
        {languages.map(lang => (
          <Picker.Item 
            key={lang.code} 
            label={lang.nativeName} 
            value={lang.code} 
          />
        ))}
      </Picker>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    minWidth: 100,
  },
  dropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  dropdownLabel: {
    marginHorizontal: 8,
    fontSize: 16,
    color: '#64748B',
  },
  rtlLanguageText: {
    fontWeight: '500',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  rtlLanguageOption: {
    borderLeftWidth: 3,
    borderLeftColor: '#EAB308',
  },
  rtlIndicator: {
    marginHorizontal: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  rtlIndicatorText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#64748B',
  },
  reloadNotice: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FEF3C7',
    marginHorizontal: 12,
    marginVertical: 8,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#F59E0B',
  },
  reloadNoticeText: {
    fontSize: 14,
    color: '#92400E',
    lineHeight: 20,
  },
  picker: {
    height: 50,
    width: 150,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1E293B',
  },
  languageOption: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  selectedLanguageOption: {
    backgroundColor: '#F1F5F9',
  },
  languageName: {
    fontSize: 16,
    color: '#334155',
    flex: 1,
  },
  selectedLanguageName: {
    fontWeight: 'bold',
    color: '#2563EB',
  },
  nativeName: {
    fontSize: 14,
    color: '#64748B',
    marginHorizontal: 8,
  },
  inlineContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flexWrap: 'wrap',
  },
  inlineOption: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginHorizontal: 4,
    marginVertical: 4,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
  },
  selectedInlineOption: {
    backgroundColor: '#BFDBFE',
  },
  inlineOptionText: {
    fontSize: 14,
    color: '#64748B',
  },
  selectedInlineOptionText: {
    fontWeight: 'bold',
    color: '#2563EB',
  },
});