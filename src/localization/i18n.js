import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Import translations
import enTranslation from './locales/en.json';
import heTranslation from './locales/he.json';

const LANGUAGE_DETECTOR = {
  type: 'languageDetector',
  async: true,
  detect: async (callback) => {
    try {
      // Try to get stored language from AsyncStorage
      const storedLanguage = await AsyncStorage.getItem('user-language');
      
      if (storedLanguage) {
        // Return stored language if available
        return callback(storedLanguage);
      } else {
        // If no stored language, use device language or fallback to 'en'
        const deviceLanguage = RNLocalize.locale.split('-')[0];
        const supportedLanguages = ['en', 'he']; // Add more as needed
        
        // Only use device language if it's supported, otherwise use English
        return callback(
          supportedLanguages.includes(deviceLanguage) ? deviceLanguage : 'en'
        );
      }
    } catch (error) {
      console.error('Error detecting language:', error);
      return callback('en');
    }
  },
  init: () => {},
  cacheUserLanguage: async (language) => {
    try {
      await AsyncStorage.setItem('user-language', language);
    } catch (error) {
      console.error('Error caching language:', error);
    }
  }
};

// Initialize i18next
const initI18n = async () => {
  await i18n
    .use(LANGUAGE_DETECTOR)
    .use(initReactI18next)
    .init({
      resources: {
        en: {
          translation: enTranslation
        },
        he: {
          translation: heTranslation
        }
      },
      fallbackLng: 'en',
      debug: process.env.NODE_ENV === 'development',
      interpolation: {
        escapeValue: false // React already escapes values
      },
      react: {
        useSuspense: false // React Native doesn't support Suspense yet
      }
    });
  
  return i18n;
};

export const changeLanguage = async (language) => {
  try {
    await i18n.changeLanguage(language);
    await AsyncStorage.setItem('user-language', language);
    return true;
  } catch (error) {
    console.error('Failed to change language:', error);
    return false;
  }
};

export const getCurrentLanguage = () => {
  return i18n.language || 'en';
};

export default initI18n;