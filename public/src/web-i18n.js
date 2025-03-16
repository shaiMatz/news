// Web-specific implementation of i18n
(function() {
  console.log('Loading web-i18n.js');
  
  // Global i18n object
  window.i18n = {
    language: 'en',
    translations: {},
    rtlLanguages: ['he', 'ar'],
    
    // Initialize i18n system
    init: async function() {
      console.log('Initializing i18n system');
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
          this.translations.en = {
            common: {
              loading: "Loading...",
              error: "Error",
              retry: "Try Again",
              search: "Search"
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
              profile: "Profile",
              accountInfo: "Account Information"
            },
            news: {
              nearby: "Nearby News",
              trending: "Trending",
              breakingNews: "Breaking News"
            },
            errors: {
              notProvided: "Not provided"
            }
          };
          this.setLanguage('en');
        }
        
        return this;
      } catch (error) {
        console.error('Error initializing i18n:', error);
        // Fall back to English with hardcoded values
        this.translations.en = {
          common: {
            loading: "Loading...",
            error: "Error",
            retry: "Try Again",
            search: "Search"
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
            profile: "Profile",
            accountInfo: "Account Information"
          },
          news: {
            nearby: "Nearby News",
            trending: "Trending",
            breakingNews: "Breaking News"
          },
          errors: {
            notProvided: "Not provided"
          }
        };
        this.setLanguage('en');
        return this;
      }
    },
    
    // Load translations for a specific language
    loadTranslations: async function(language) {
      console.log('Loading translations for:', language);
      try {
        console.log('Fetching from URL:', `/locales/${language}.json`);
        const response = await fetch(`/locales/${language}.json`);
        console.log('Response status:', response.status);
        
        if (!response.ok) {
          throw new Error(`Failed to load translations for ${language}`);
        }
        
        const jsonData = await response.json();
        console.log('Got JSON data:', Object.keys(jsonData));
        this.translations[language] = jsonData;
        return true;
      } catch (error) {
        console.error(`Error loading translations for ${language}:`, error);
        
        // If not English and failed, try to load English as fallback
        if (language !== 'en') {
          console.log('Falling back to English translations');
          return await this.loadTranslations('en');
        }
        
        return false;
      }
    },
    
    // Set the current language
    setLanguage: function(language) {
      this.language = language;
      
      // Store the selected language
      localStorage.setItem('user-language', language);
      
      // Check if the language is RTL
      const isRTL = this.rtlLanguages.includes(language);
      
      // Set HTML dir attribute
      document.documentElement.dir = isRTL ? 'rtl' : 'ltr';
      
      // Add a class to the body for language-specific styling
      document.body.className = document.body.className.replace(/lang-\w+/g, '');
      document.body.classList.add(`lang-${language}`);
      
      // Dispatch a language change event
      window.dispatchEvent(new CustomEvent('languagechange', { detail: { language, isRTL } }));
      
      return true;
    },
    
    // Get a translation by key
    t: function(key, params = {}) {
      const language = this.language;
      const translations = this.translations[language] || this.translations.en || {};
      
      // Split the key by dots to navigate the nested objects
      const keys = key.split('.');
      let value = translations;
      
      // Navigate through the nested objects
      for (const k of keys) {
        value = value?.[k];
        if (value === undefined) {
          console.warn(`Translation key not found: ${key}`);
          return key;
        }
      }
      
      // If the value is a string, replace the placeholders
      if (typeof value === 'string') {
        return value.replace(/\{\{(\w+)\}\}/g, (_, placeholder) => {
          return params[placeholder] !== undefined ? params[placeholder] : `{{${placeholder}}}`;
        });
      }
      
      return key;
    },
    
    // Check if the current language is RTL
    isRTL: function() {
      return this.rtlLanguages.includes(this.language);
    },
    
    // Get available languages
    getLanguages: function() {
      return [
        { code: 'en', name: 'English', nativeName: 'English' },
        { code: 'es', name: 'Spanish', nativeName: 'Español' },
        { code: 'fr', name: 'French', nativeName: 'Français' },
        { code: 'he', name: 'Hebrew', nativeName: 'עברית' },
        { code: 'ar', name: 'Arabic', nativeName: 'العربية' },
        { code: 'zh', name: 'Chinese', nativeName: '中文' }
      ];
    }
  };
  
  // Initialize when the document is ready
  document.addEventListener('DOMContentLoaded', async function() {
    await window.i18n.init();
    
    // Create the language selector
    createLanguageSelector();
  });
  
  // Create and append a language selector to the page
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
    container.style.right = '10px';
    container.style.zIndex = '1000';
    container.style.backgroundColor = 'rgba(255, 255, 255, 0.8)';
    container.style.borderRadius = '4px';
    container.style.padding = '5px';
    container.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.1)';
    
    // Create the select element
    const select = document.createElement('select');
    select.style.padding = '5px';
    select.style.border = '1px solid #ccc';
    select.style.borderRadius = '4px';
    select.style.backgroundColor = 'white';
    
    // Add language options
    const languages = window.i18n.getLanguages();
    languages.forEach(lang => {
      const option = document.createElement('option');
      option.value = lang.code;
      option.textContent = lang.nativeName;
      option.selected = lang.code === window.i18n.language;
      select.appendChild(option);
    });
    
    // Handle language change
    select.addEventListener('change', async function() {
      const newLanguage = this.value;
      
      // If translations for this language are not loaded yet, load them
      if (!window.i18n.translations[newLanguage]) {
        await window.i18n.loadTranslations(newLanguage);
      }
      
      // Set the new language
      window.i18n.setLanguage(newLanguage);
      
      // Refresh the page to apply translations
      window.location.reload();
    });
    
    // Append the select to the container
    container.appendChild(select);
    
    // Append the container to the body
    document.body.appendChild(container);
  }
})();