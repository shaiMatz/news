import { useTranslation } from 'react-i18next';
import { StyleSheet } from 'react-native';
import { useLocalizationContext } from '../contexts/LocalizationContext';

/**
 * Custom hook for handling localization in the app
 * 
 * @returns {Object} Localization utilities
 */
export default function useLocalization() {
  const { t, i18n } = useTranslation();
  const { language, isRTL, setLanguage } = useLocalizationContext();

  /**
   * Change the application language
   * 
   * @param {string} newLanguage - Language code ('en', 'he', etc.)
   * @returns {Promise<void>}
   */
  const changeLanguage = async (newLanguage) => {
    return await setLanguage(newLanguage);
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
   * @returns {Object} Style object
   */
  const getDirectionStyle = () => {
    return {
      flexDirection: isRTL ? 'row-reverse' : 'row',
    };
  };

  /**
   * Get a style object with RTL-aware text alignment
   * 
   * @returns {Object} Style object
   */
  const getTextAlignStyle = () => {
    return {
      textAlign: isRTL ? 'right' : 'left',
    };
  };

  /**
   * Get an RTL-aware style for a container
   * 
   * @returns {Object} Style object
   */
  const getContainerStyle = () => {
    return {
      direction: isRTL ? 'rtl' : 'ltr',
      ...getTextAlignStyle(),
    };
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

  return {
    t,
    i18n,
    language,
    isRTL,
    changeLanguage,
    getCurrentLanguage,
    isRTLLanguage,
    getDirectionStyle,
    getTextAlignStyle,
    getContainerStyle,
    getAvailableLanguages,
  };
}