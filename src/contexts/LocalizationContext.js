import React, { createContext, useState, useEffect, useContext } from 'react';
import { I18nManager } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import i18n from '../localization/i18n';
import { changeLanguage as i18nChangeLanguage } from '../localization/i18n';

// Create the context
const LocalizationContext = createContext();

/**
 * Provider component for localization context
 * Manages app language and RTL/LTR direction
 */
export function LocalizationProvider({ children }) {
  const [isLoading, setIsLoading] = useState(true);
  const [language, setLanguage] = useState('en');
  const [isRTL, setIsRTL] = useState(false);
  const getDirectionStyle = () => isRTL ? { flexDirection: 'row-reverse' } : { flexDirection: 'row' };
  const getTextAlignStyle = () => isRTL ? { textAlign: 'right' } : { textAlign: 'left' };

  useEffect(() => {
    // Initialize i18n and get the stored language
    const loadLanguage = async () => {
      try {
        setIsLoading(true);
        
        // Initialize i18n
        await i18n();
        
        // Get the current language
        const currentLang = i18n.language || 'en';
        setLanguage(currentLang);
        
        // Check if the language is RTL
        const rtlLanguages = ['he', 'ar']; // Hebrew and Arabic are RTL languages
        const isRtl = rtlLanguages.includes(currentLang);
        
        // Set RTL flag
        setIsRTL(isRtl);
        
        // Set React Native's direction
        await enableRTL(isRtl);
      } catch (error) {
        console.error('Error loading language:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadLanguage();
  }, []);

  /**
   * Change the application language
   * 
   * @param {string} newLanguage - Language code ('en', 'he', etc.)
   * @returns {Promise<void>}
   */
  const setAppLanguage = async (newLanguage) => {
    try {
      if (newLanguage === language) return true;
      
      // Change language in i18n
      const success = await i18nChangeLanguage(newLanguage);
      if (!success) return false;
      
      // Set language state
      setLanguage(newLanguage);
      
      // Check if the language is RTL
      const rtlLanguages = ['he', 'ar']; // Hebrew and Arabic are RTL languages
      const isRtl = rtlLanguages.includes(newLanguage);
      
      // Set RTL flag
      setIsRTL(isRtl);
      
      // Set React Native's direction
      await enableRTL(isRtl);
      
      return true;
    } catch (error) {
      console.error('Error changing language:', error);
      return false;
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
      } catch (error) {
        console.error('Error setting RTL:', error);
      }
    }
  };

  // Define context value
  const contextValue = {
    isLoading,
    language,
    isRTL,
    setLanguage: setAppLanguage,
    getDirectionStyle,
    getTextAlignStyle,

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