import { useTranslation } from 'react-i18next';
import { StyleSheet, I18nManager, Platform } from 'react-native';
import { useLocalizationContext } from '../contexts/LocalizationContext';
import { useState, useCallback } from 'react';

/**
 * Custom hook for handling localization in the app
 * 
 * @returns {Object} Localization utilities
 */
export default function useLocalization() {
  const { t, i18n } = useTranslation();
  const { language, isRTL, setLanguage, isLoading, getContainerStyle } = useLocalizationContext();
  const [translationError, setTranslationError] = useState(null);

  /**
   * Safe translation function that handles loading state and errors
   * to prevent UI breaking when translations aren't ready or fail
   * 
   * @param {string} key - Translation key
   * @param {Object} options - Translation options
   * @param {string} defaultValue - Default fallback value
   * @returns {string} Translated string or fallback
   */
  const safeT = useCallback((key, options = {}, defaultValue = null) => {
    // Handle loading state
    if (isLoading) {
      return defaultValue || key.split('.').pop(); // Return the default or last part of the key
    }

    try {
      // Check if the key exists in translations
      const hasKey = i18n.exists(key);
      if (!hasKey) {
        console.warn(`Translation key not found: ${key}`);
        return defaultValue || key.split('.').pop();
      }
      
      // Get the translation
      return t(key, options);
    } catch (error) {
      console.error('Translation error:', error);
      setTranslationError(error);
      return defaultValue || key.split('.').pop();
    }
  }, [isLoading, t, i18n]);

  /**
   * Change the application language with improved error handling
   * 
   * @param {string} newLanguage - Language code ('en', 'he', etc.)
   * @returns {Promise<boolean>} Success state
   */
  const changeLanguage = async (newLanguage) => {
    try {
      setTranslationError(null);
      const success = await setLanguage(newLanguage);
      return success;
    } catch (error) {
      console.error('Error changing language:', error);
      setTranslationError(error);
      return false;
    }
  };

  /**
   * Get the current language code
   * 
   * @returns {string} Language code
   */
  const getCurrentLanguage = () => {
    return language;
  };

  /**
   * Check if the current language is a RTL language
   * 
   * @returns {boolean} True if the current language is RTL
   */
  const isRTLLanguage = () => {
    return isRTL;
  };

  /**
   * Get a style object with RTL-aware flexDirection
   * 
   * @param {boolean} reverse - If true, reverse the direction
   * @returns {Object} Style object
   */
  const getDirectionStyle = (reverse = false) => {
    return {
      flexDirection: isRTL !== reverse ? 'row-reverse' : 'row',
    };
  };

  /**
   * Get a style object with RTL-aware text alignment
   * 
   * @param {boolean} reverse - If true, reverse the alignment
   * @returns {Object} Style object
   */
  const getTextAlignStyle = (reverse = false) => {
    return {
      textAlign: isRTL !== reverse ? 'right' : 'left',
    };
  };

  /**
   * Get a style object for horizontal margins/paddings that respects RTL
   * 
   * @param {number} start - Start (left in LTR, right in RTL) value
   * @param {number} end - End (right in LTR, left in RTL) value
   * @returns {Object} Style object with proper RTL-aware margins
   */
  const getHorizontalSpacingStyle = (start, end) => {
    if (isRTL) {
      return {
        marginRight: start,
        marginLeft: end,
        paddingRight: start,
        paddingLeft: end,
      };
    }
    return {
      marginLeft: start,
      marginRight: end,
      paddingLeft: start,
      paddingRight: end,
    };
  };

  /**
   * Convert a value to match RTL-appropriate direction
   * Useful for icons, animations, and other directional elements
   * 
   * @param {any} ltrValue - Value to use in LTR mode
   * @param {any} rtlValue - Value to use in RTL mode
   * @returns {any} The appropriate value based on RTL status
   */
  const getDirectionalValue = (ltrValue, rtlValue) => {
    return isRTL ? rtlValue : ltrValue;
  };

  /**
   * Get available languages
   * 
   * @returns {Array} Array of language objects
   */
  const getAvailableLanguages = () => {
    return [
      { code: 'en', name: 'English', nativeName: 'English', isRTL: false },
      { code: 'he', name: 'Hebrew', nativeName: 'עברית', isRTL: true },
      { code: 'es', name: 'Spanish', nativeName: 'Español', isRTL: false },
      { code: 'fr', name: 'French', nativeName: 'Français', isRTL: false },
      { code: 'ar', name: 'Arabic', nativeName: 'العربية', isRTL: true },
      { code: 'zh', name: 'Chinese', nativeName: '中文', isRTL: false },
    ];
  };

  /**
   * Get current RTL settings from system
   * 
   * @returns {Object} RTL status information
   */
  const getRTLInfo = () => {
    return {
      isRTL,
      systemIsRTL: I18nManager.isRTL,
      allowedRTL: I18nManager.allowRTL,
      forcedRTL: I18nManager.forceRTL,
      platform: Platform.OS,
    };
  };

  /**
   * Get error information about translation system
   */
  const getTranslationErrorInfo = () => {
    return {
      hasError: !!translationError,
      error: translationError,
      isLoading,
    };
  };

  return {
    t,
    safeT,
    i18n,
    language,
    isRTL,
    isLoading,
    changeLanguage,
    getCurrentLanguage,
    isRTLLanguage,
    getDirectionStyle,
    getTextAlignStyle,
    getContainerStyle,
    getHorizontalSpacingStyle,
    getDirectionalValue,
    getAvailableLanguages,
    getRTLInfo,
    getTranslationErrorInfo,
    translationError,
  };
}