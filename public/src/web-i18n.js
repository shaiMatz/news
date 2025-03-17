// Web-specific implementation of i18n with enhanced RTL support and error handling
(function() {
  console.log('Loading web-i18n.js');
  
  // Constants
  const RTL_LANGUAGES = ['he', 'ar'];
  const MAX_RETRY_ATTEMPTS = 3;
  const RETRY_DELAY_BASE = 300; // milliseconds
  
  // CSS for RTL/LTR-specific styling
  const RTL_STYLES = `
    body.rtl-layout {
      direction: rtl;
      text-align: right;
    }
    
    body.rtl-layout .rtl-flip {
      transform: scaleX(-1);
    }
    
    body.rtl-layout .rtl-container {
      flex-direction: row-reverse;
    }
    
    body.rtl-layout .rtl-align {
      text-align: right;
    }
    
    body.ltr-layout .rtl-align {
      text-align: left;
    }
    
    /* Specific language adjustments */
    body.lang-ar {
      font-family: 'Arial', sans-serif;
      letter-spacing: 0;
    }
    
    body.lang-he {
      font-family: 'Arial', sans-serif;
      letter-spacing: 0;
    }
    
    .language-badge {
      display: inline-block;
      padding: 2px 6px;
      font-size: 10px;
      font-weight: bold;
      color: #64748B;
      background-color: #F1F5F9;
      border-radius: 4px;
      border: 1px solid #E2E8F0;
      margin-left: 6px;
    }
    
    body.rtl-layout .language-badge {
      margin-left: 0;
      margin-right: 6px;
    }
  `;
  
  // Add RTL styles to the page
  function addRTLStyles() {
    if (!document.getElementById('rtl-styles')) {
      const styleElem = document.createElement('style');
      styleElem.id = 'rtl-styles';
      styleElem.textContent = RTL_STYLES;
      document.head.appendChild(styleElem);
    }
  }
  
  // Fallback translations to use when loading fails
  const FALLBACK_TRANSLATIONS = {
    common: {
      loading: "Loading...",
      error: "Error",
      retry: "Try Again",
      search: "Search",
      cancel: "Cancel",
      save: "Save",
      unknown: "Unknown"
    },
    auth: {
      login: "Login",
      register: "Register",
      logout: "Logout",
      username: "Username",
      password: "Password",
      email: "Email",
      noAccount: "Don't have an account?",
      alreadyAccount: "Already have an account?"
    },
    profile: {
      language: "Language",
      languageChangeRestart: "The app may need to refresh when changing between RTL and LTR languages",
      profile: "Profile",
      settings: "Settings"
    },
    news: {
      nearby: "Nearby News",
      trending: "Trending",
      breakingNews: "Breaking News",
      comments: "Comments",
      writeComment: "Write a comment...",
      postedBy: "Posted by {{username}}"
    },
    errors: {
      notProvided: "Not provided",
      translationError: "Translation error. Please refresh the page."
    }
  };
  
  // Global i18n object with enhanced RTL support
  window.i18n = {
    language: 'en',
    translations: {},
    rtlLanguages: RTL_LANGUAGES,
    retryCount: 0,
    lastError: null,
    
    // Initialize i18n system with enhanced error handling
    init: async function() {
      console.log('Initializing i18n system');
      // Add the RTL styles immediately
      addRTLStyles();
      
      try {
        // Try to get stored language from localStorage
        const storedLanguage = localStorage.getItem('user-language') || 'en';
        console.log('Using language:', storedLanguage);
        
        // Load translations for the language
        const success = await this.loadTranslations(storedLanguage);
        console.log('Loaded translations successfully:', success);
        
        if (success) {
          // Set up language and direction
          this.setLanguage(storedLanguage);
          console.log('Language set to:', storedLanguage);
          console.log('Translations loaded:', Object.keys(this.translations));
        } else {
          console.error('Failed to load translations, falling back to English hardcoded values');
          // Add hardcoded English translations as fallback
          this.translations.en = FALLBACK_TRANSLATIONS;
          this.setLanguage('en');
        }
        
        // Reset error state on successful initialization
        this.lastError = null;
        this.retryCount = 0;
        
        return this;
      } catch (error) {
        console.error('Error initializing i18n:', error);
        this.lastError = error;
        
        // Fall back to English with hardcoded values
        this.translations.en = FALLBACK_TRANSLATIONS;
        this.setLanguage('en');
        
        // Show a subtle error indicator
        this.showTranslationErrorIndicator();
        
        return this;
      }
    },
    
    // Load translations for a specific language with retry mechanism
    loadTranslations: async function(language, retryAttempt = 0) {
      console.log('Loading translations for:', language);
      try {
        console.log('Fetching from URL:', `/locales/${language}.json`);
        const response = await fetch(`/locales/${language}.json`);
        console.log('Response status:', response.status);
        
        // Handle 502 errors or other non-200 responses
        if (!response.ok) {
          // If we haven't exceeded retry attempts, try again
          if (retryAttempt < MAX_RETRY_ATTEMPTS && (response.status === 502 || response.status === 504)) {
            const delay = RETRY_DELAY_BASE * Math.pow(2, retryAttempt);
            console.log(`Got ${response.status}, retrying in ${delay}ms (attempt ${retryAttempt + 1}/${MAX_RETRY_ATTEMPTS})...`);
            
            // Wait for delay and retry
            await new Promise(resolve => setTimeout(resolve, delay));
            return await this.loadTranslations(language, retryAttempt + 1);
          }
          
          throw new Error(`Failed to load translations for ${language}: ${response.status} ${response.statusText}`);
        }
        
        const jsonData = await response.json();
        console.log('Got JSON data:', Object.keys(jsonData));
        this.translations[language] = jsonData;
        return true;
      } catch (error) {
        console.error(`Error loading translations for ${language}:`, error);
        this.lastError = error;
        
        // If not English and failed, try to load English as fallback
        if (language !== 'en') {
          console.log('Falling back to English translations');
          return await this.loadTranslations('en');
        }
        
        // If even English fails, use the hardcoded fallback
        this.translations.en = FALLBACK_TRANSLATIONS;
        
        return false;
      }
    },
    
    // Set the current language with enhanced RTL support
    setLanguage: function(language) {
      this.language = language;
      
      // Store the selected language
      localStorage.setItem('user-language', language);
      
      // Check if the language is RTL
      const isRTL = this.rtlLanguages.includes(language);
      
      // Set HTML dir attribute
      document.documentElement.dir = isRTL ? 'rtl' : 'ltr';
      
      // Update body classes for RTL/LTR
      document.body.classList.remove('rtl-layout', 'ltr-layout');
      document.body.classList.add(isRTL ? 'rtl-layout' : 'ltr-layout');
      
      // Add language-specific class
      document.body.className = document.body.className.replace(/lang-\w+/g, '');
      document.body.classList.add(`lang-${language}`);
      
      // Update position of language selector
      this.updateLanguageSelectorPosition();
      
      // Dispatch a language change event
      window.dispatchEvent(new CustomEvent('languagechange', { detail: { language, isRTL } }));
      
      return true;
    },
    
    // Get a translation by key with enhanced error handling
    t: function(key, params = {}) {
      try {
        const language = this.language;
        const translations = this.translations[language] || this.translations.en || FALLBACK_TRANSLATIONS;
        
        // Split the key by dots to navigate the nested objects
        const keys = key.split('.');
        let value = translations;
        
        // Navigate through the nested objects
        for (const k of keys) {
          value = value?.[k];
          if (value === undefined) {
            console.warn(`Translation key not found: ${key}`);
            // Return last part of key as fallback
            return key.split('.').pop();
          }
        }
        
        // If the value is a string, replace the placeholders
        if (typeof value === 'string') {
          return value.replace(/\{\{(\w+)\}\}/g, (_, placeholder) => {
            return params[placeholder] !== undefined ? params[placeholder] : `{{${placeholder}}}`;
          });
        }
        
        return key;
      } catch (error) {
        console.error('Translation error:', error);
        this.lastError = error;
        return key.split('.').pop(); // Return last part of key as fallback
      }
    },
    
    // Check if the current language is RTL
    isRTL: function() {
      return this.rtlLanguages.includes(this.language);
    },
    
    // Get available languages with RTL info
    getLanguages: function() {
      return [
        { code: 'en', name: 'English', nativeName: 'English', isRTL: false },
        { code: 'es', name: 'Spanish', nativeName: 'Español', isRTL: false },
        { code: 'fr', name: 'French', nativeName: 'Français', isRTL: false },
        { code: 'he', name: 'Hebrew', nativeName: 'עברית', isRTL: true },
        { code: 'ar', name: 'Arabic', nativeName: 'العربية', isRTL: true },
        { code: 'zh', name: 'Chinese', nativeName: '中文', isRTL: false }
      ];
    },
    
    // Update language selector position based on RTL/LTR
    updateLanguageSelectorPosition: function() {
      const selector = document.getElementById('language-selector');
      if (selector) {
        if (this.isRTL()) {
          selector.style.left = '10px';
          selector.style.right = 'auto';
        } else {
          selector.style.right = '10px';
          selector.style.left = 'auto';
        }
      }
    },
    
    // Show error indicator for translation issues
    showTranslationErrorIndicator: function() {
      // Only create if it doesn't exist yet
      if (document.getElementById('translation-error-indicator')) {
        return;
      }
      
      const indicator = document.createElement('div');
      indicator.id = 'translation-error-indicator';
      indicator.style.position = 'fixed';
      indicator.style.bottom = '10px';
      indicator.style.left = '10px';
      indicator.style.zIndex = '9999';
      indicator.style.backgroundColor = '#FEF2F2';
      indicator.style.color = '#B91C1C';
      indicator.style.padding = '8px 12px';
      indicator.style.borderRadius = '4px';
      indicator.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.1)';
      indicator.style.fontSize = '12px';
      indicator.style.display = 'flex';
      indicator.style.alignItems = 'center';
      indicator.style.fontFamily = 'Arial, sans-serif';
      
      const icon = document.createElement('span');
      icon.innerHTML = '⚠️';
      icon.style.marginRight = '6px';
      
      const text = document.createElement('span');
      text.textContent = 'Translation error. Some texts may not display correctly.';
      
      const button = document.createElement('button');
      button.textContent = 'Reload';
      button.style.marginLeft = '10px';
      button.style.padding = '4px 8px';
      button.style.backgroundColor = '#EF4444';
      button.style.color = 'white';
      button.style.border = 'none';
      button.style.borderRadius = '4px';
      button.style.cursor = 'pointer';
      
      button.addEventListener('click', function() {
        window.location.reload();
      });
      
      indicator.appendChild(icon);
      indicator.appendChild(text);
      indicator.appendChild(button);
      
      document.body.appendChild(indicator);
    },
    
    // Force reload translations
    reloadTranslations: async function() {
      this.retryCount = 0;
      return await this.loadTranslations(this.language);
    },
    
    // Get translation error info
    getTranslationErrorInfo: function() {
      return {
        hasError: !!this.lastError,
        error: this.lastError,
        retryCount: this.retryCount
      };
    }
  };
  
  // Initialize when the document is ready
  document.addEventListener('DOMContentLoaded', async function() {
    await window.i18n.init();
    
    // Create the language selector
    createLanguageSelector();
  });
  
  // Create and append a language selector to the page with RTL enhancements
  function createLanguageSelector() {
    // Only create if it doesn't exist yet
    if (document.getElementById('language-selector')) {
      return;
    }
    
    // Create the language selector container
    const container = document.createElement('div');
    container.id = 'language-selector';
    container.className = 'language-selector';
    container.style.position = 'fixed';
    container.style.top = '10px';
    container.style.zIndex = '1000';
    container.style.backgroundColor = 'rgba(255, 255, 255, 0.9)';
    container.style.borderRadius = '4px';
    container.style.padding = '8px';
    container.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.1)';
    
    // Position based on RTL or LTR
    if (window.i18n.isRTL()) {
      container.style.left = '10px';
      container.style.right = 'auto';
    } else {
      container.style.right = '10px';
      container.style.left = 'auto';
    }
    
    // Create a styled select wrapper
    const selectWrapper = document.createElement('div');
    selectWrapper.style.display = 'flex';
    selectWrapper.style.alignItems = 'center';
    
    // Add globe icon
    const globeIcon = document.createElement('span');
    globeIcon.textContent = '🌐';
    globeIcon.style.marginRight = '8px';
    selectWrapper.appendChild(globeIcon);
    
    // Create the select element
    const select = document.createElement('select');
    select.style.padding = '5px 8px';
    select.style.border = '1px solid #E2E8F0';
    select.style.borderRadius = '4px';
    select.style.backgroundColor = 'white';
    select.style.cursor = 'pointer';
    select.style.fontFamily = 'Arial, sans-serif';
    
    // Add language options
    const languages = window.i18n.getLanguages();
    languages.forEach(lang => {
      const option = document.createElement('option');
      option.value = lang.code;
      
      // Display both native name and RTL/LTR indicator
      option.textContent = lang.nativeName;
      option.dataset.isRtl = lang.isRTL;
      option.selected = lang.code === window.i18n.language;
      
      select.appendChild(option);
    });
    
    // Handle language change with better UX for RTL transitions
    select.addEventListener('change', async function() {
      const newLanguage = this.value;
      const selectedOption = select.options[select.selectedIndex];
      const isRtl = selectedOption.dataset.isRtl === 'true';
      const currentIsRtl = window.i18n.isRTL();
      
      // If translations for this language are not loaded yet, load them
      if (!window.i18n.translations[newLanguage]) {
        // Show loading state
        select.disabled = true;
        globeIcon.textContent = '⏳';
        
        // Load translations
        await window.i18n.loadTranslations(newLanguage);
        
        // Restore state
        select.disabled = false;
        globeIcon.textContent = '🌐';
      }
      
      // Set the new language
      window.i18n.setLanguage(newLanguage);
      
      // If changing between RTL and LTR, refresh the page
      // This is necessary for a complete layout recalculation
      if (isRtl !== currentIsRtl) {
        // Show a brief message before refreshing
        const rtlChangeMessage = document.createElement('div');
        rtlChangeMessage.textContent = 'Changing layout direction...';
        rtlChangeMessage.style.position = 'fixed';
        rtlChangeMessage.style.top = '50%';
        rtlChangeMessage.style.left = '50%';
        rtlChangeMessage.style.transform = 'translate(-50%, -50%)';
        rtlChangeMessage.style.padding = '20px';
        rtlChangeMessage.style.backgroundColor = 'white';
        rtlChangeMessage.style.borderRadius = '8px';
        rtlChangeMessage.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
        rtlChangeMessage.style.zIndex = '9999';
        
        document.body.appendChild(rtlChangeMessage);
        
        // Wait a short time then reload
        setTimeout(() => {
          window.location.reload();
        }, 500);
      } else {
        // If just changing language without RTL/LTR switch, we can update more smoothly
        
        // Update the text of elements with data-i18n attributes
        document.querySelectorAll('[data-i18n]').forEach(el => {
          const key = el.dataset.i18n;
          if (key) {
            el.textContent = window.i18n.t(key);
          }
        });
        
        // Dispatch an event that components can listen for
        window.dispatchEvent(new CustomEvent('translationsUpdated'));
      }
    });
    
    selectWrapper.appendChild(select);
    container.appendChild(selectWrapper);
    
    // Add RTL/LTR indicator badge
    const rtlBadge = document.createElement('span');
    rtlBadge.className = 'language-badge';
    rtlBadge.textContent = window.i18n.isRTL() ? 'RTL' : 'LTR';
    container.appendChild(rtlBadge);
    
    // Append the container to the body
    document.body.appendChild(container);
  }
})();