import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import { I18nManager, Platform, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import i18n from '../localization/i18n';
import { changeLanguage as i18nChangeLanguage } from '../localization/i18n';

// Create the context
const LocalizationContext = createContext();

// List of RTL languages
const RTL_LANGUAGES = ['he', 'ar'];

// Max retry attempts for translation loading
const MAX_TRANSLATION_LOAD_RETRIES = 3;

/**
 * Provider component for localization context
 * Manages app language and RTL/LTR direction
 */
export function LocalizationProvider({ children }) {
  const [isLoading, setIsLoading] = useState(true);
  const [language, setLanguage] = useState('en');
  const [isRTL, setIsRTL] = useState(false);
  const [error, setError] = useState(null);
  const [loadRetries, setLoadRetries] = useState(0);
  
  /**
   * Get style object with RTL-aware flexDirection
   * 
   * @param {boolean} reverse - Whether to reverse normal direction
   * @returns {Object} Style object with flexDirection
   */
  const getDirectionStyle = useCallback((reverse = false) => {
    return {
      flexDirection: isRTL !== reverse ? 'row-reverse' : 'row',
    };
  }, [isRTL]);
  
  /**
   * Get style object with RTL-aware text alignment
   * 
   * @param {boolean} reverse - Whether to reverse normal alignment
   * @returns {Object} Style object with textAlign
   */
  const getTextAlignStyle = useCallback((reverse = false) => {
    return {
      textAlign: isRTL !== reverse ? 'right' : 'left',
    };
  }, [isRTL]);

  /**
   * Get container style for layout containers
   * Applies proper RTL-aware padding
   * 
   * @returns {Object} Style object for container
   */
  const getContainerStyle = useCallback(() => {
    return {
      direction: isRTL ? 'rtl' : 'ltr',
      ...(isRTL 
        ? { paddingRight: 0, paddingLeft: 16, alignItems: 'flex-end' } 
        : { paddingLeft: 0, paddingRight: 16, alignItems: 'flex-start' })
    };
  }, [isRTL]);

  /**
   * Initialize i18n and get the stored language
   * With retry mechanism for handling 502 errors
   */
  const loadLanguage = useCallback(async (retry = 0) => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Initialize i18n
      const i18nInstance = await i18n();
      
      // Get the current language (from AsyncStorage or device)
      const currentLang = i18nInstance.language || 'en';
      setLanguage(currentLang);
      
      // Check if the language is RTL
      const isRtl = RTL_LANGUAGES.includes(currentLang);
      
      // Set RTL flag
      setIsRTL(isRtl);
      
      // Set React Native's direction
      await enableRTL(isRtl);
      
      // Reset retry count on success
      setLoadRetries(0);
      
      return true;
    } catch (error) {
      console.error('Error loading language:', error);
      setError(error);
      
      // If failed due to network issues and within retry limit, attempt again
      if (retry < MAX_TRANSLATION_LOAD_RETRIES) {
        console.log(`Retrying language load (${retry + 1}/${MAX_TRANSLATION_LOAD_RETRIES})...`);
        setLoadRetries(retry + 1);
        
        // Exponential backoff for retries (300ms, 900ms, 2700ms)
        const delay = 300 * Math.pow(3, retry);
        setTimeout(() => loadLanguage(retry + 1), delay);
      } else {
        // If web platform, show console message about refreshing
        if (Platform.OS === 'web') {
          console.warn('Translation loading failed after multiple attempts. You may need to refresh the page.');
        }
        
        // Fall back to English on failure
        if (language !== 'en') {
          setLanguage('en');
          setIsRTL(false);
          await enableRTL(false);
        }
      }
      
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initialize on mount
  useEffect(() => {
    loadLanguage();
  }, []);

  /**
   * Change the application language
   * 
   * @param {string} newLanguage - Language code ('en', 'he', etc.)
   * @returns {Promise<boolean>} Success state
   */
  const setAppLanguage = async (newLanguage) => {
    try {
      if (newLanguage === language) return true;
      
      setIsLoading(true);
      setError(null);
      
      // Change language in i18n
      const success = await i18nChangeLanguage(newLanguage);
      if (!success) {
        throw new Error(`Failed to change language to ${newLanguage}`);
      }
      
      // Set language state
      setLanguage(newLanguage);
      
      // Check if the language is RTL
      const isRtl = RTL_LANGUAGES.includes(newLanguage);
      
      // If switching between RTL and LTR, we need special handling
      const isRTLSwitch = isRTL !== isRtl;
      
      // Set RTL flag
      setIsRTL(isRtl);
      
      // Set React Native's direction
      await enableRTL(isRtl);
      
      // If this was an RTL-LTR switch on web, we may need to reload
      if (isRTLSwitch && Platform.OS === 'web') {
        // In real app we might want to reload the page here
        console.log('Switched RTL/LTR direction. Page may need to reload for proper layout.');
      }
      
      return true;
    } catch (error) {
      console.error('Error changing language:', error);
      setError(error);
      
      // Fall back to existing language
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Enable RTL support in React Native
   * 
   * @param {boolean} enable - Whether to enable RTL
   * @returns {Promise<void>}
   */
  const enableRTL = async (enable) => {
    // Only change if needed to avoid unnecessary refreshing
    if (I18nManager.isRTL !== enable) {
      try {
        // Set React Native's direction
        I18nManager.allowRTL(enable);
        I18nManager.forceRTL(enable);
        
        // Store the RTL preference
        await AsyncStorage.setItem('app-rtl', String(enable));
        
        // Note: In a real app, we might need to restart the app
        // or reload the page for RTL changes to fully take effect
      } catch (error) {
        console.error('Error setting RTL:', error);
      }
    }
  };

  /**
   * Force reload translations
   * Useful when encountering 502 errors
   * 
   * @returns {Promise<boolean>} Success state
   */
  const reloadTranslations = async () => {
    return await loadLanguage();
  };

  // Define context value
  const contextValue = {
    isLoading,
    language,
    isRTL,
    error,
    loadRetries,
    setLanguage: setAppLanguage,
    getDirectionStyle,
    getTextAlignStyle,
    getContainerStyle,
    reloadTranslations,
  };

  return (
    <LocalizationContext.Provider value={contextValue}>
      {children}
    </LocalizationContext.Provider>
  );
}

/**
 * Hook to use the localization context
 */
export function useLocalizationContext() {
  const context = useContext(LocalizationContext);
  if (!context) {
    throw new Error('useLocalizationContext must be used within a LocalizationProvider');
  }
  return context;
}