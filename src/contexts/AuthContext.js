import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { Alert, Platform } from 'react-native';
import { 
  login as apiLogin, 
  register as apiRegister, 
  logout as apiLogout, 
  socialLogin as apiSocialLogin,
  getUser,
  ApiError
} from '../services/api';
import { closeNotificationSocket, setupNotificationSocket } from '../services/notifications';
import { getGoogleAuthToken, getAppleAuthToken } from '../services/socialAuth';
import { handleError, ErrorTypes, getUserFriendlyMessage } from '../utils/errorUtils';
import { isOnline } from '../utils/connectivityUtils';

const AuthContext = createContext();

/**
 * Provider component for authentication context
 * Manages user authentication state and provides login/register/logout methods
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [initialized, setInitialized] = useState(false);

  // Check if user is already logged in on app start
  const checkLoginStatus = useCallback(async () => {
    if (initialized) return;
    
    try {
      setLoading(true);
      const userData = await getUser();
      
      if (userData) {
        setUser(userData);
        // Set up notification socket for authenticated user
        setupNotificationSocket(userData);
      }
    } catch (err) {
      console.log('Not authenticated, skipping notifications fetch');
      setUser(null);
    } finally {
      setLoading(false);
      setInitialized(true);
    }
  }, [initialized]);

  useEffect(() => {
    checkLoginStatus();
  }, [checkLoginStatus]);

  /**
   * Log in a user with username and password
   */
  const login = async (username, password) => {
    try {
      setLoading(true);
      setError(null);
      
      // Check for internet connection first
      const online = await isOnline();
      if (!online) {
        throw new ApiError(
          'No internet connection',
          0,
          ErrorTypes.NETWORK,
          'Please check your internet connection and try again.'
        );
      }
      
      // Validate input
      if (!username || !password) {
        throw new ApiError(
          'Validation failed',
          0,
          ErrorTypes.VALIDATION,
          'Please enter both username and password.'
        );
      }
      
      const userData = await apiLogin(username, password);
      
      if (!userData) {
        throw new ApiError(
          'Invalid login response',
          0,
          ErrorTypes.SERVER,
          'We encountered an issue with our servers. Please try again later.'
        );
      }
      
      setUser(userData);
      
      // Set up notification socket for newly logged in user
      setupNotificationSocket(userData);
      
      return userData;
    } catch (err) {
      // Log error for debugging
      handleError(err, 'AuthContext.login');
      
      // Get user-friendly error message
      const userMessage = err.userMessage || getUserFriendlyMessage(err, {
        [ErrorTypes.AUTH]: 'Invalid username or password. Please try again.',
        [ErrorTypes.VALIDATION]: 'Please check your username and password and try again.',
        [ErrorTypes.NETWORK]: 'Unable to connect. Please check your internet connection.',
        [ErrorTypes.SERVER]: 'Our servers are experiencing issues. Please try again later.'
      });
      
      // Store error for display
      setError(userMessage);
      
      // Throw with user-friendly message attached
      if (err instanceof ApiError) {
        throw err;
      } else {
        throw new ApiError(
          err.message || 'Login failed',
          0,
          err.type || getErrorType(err),
          userMessage
        );
      }
    } finally {
      setLoading(false);
    }
  };

  /**
   * Register a new user
   */
  const register = async (username, email, password) => {
    try {
      setLoading(true);
      setError(null);
      
      // Check for internet connection first
      const online = await isOnline();
      if (!online) {
        throw new ApiError(
          'No internet connection',
          0,
          ErrorTypes.NETWORK,
          'Please check your internet connection and try again.'
        );
      }
      
      // Validate input
      if (!username || !email || !password) {
        throw new ApiError(
          'Validation failed',
          0,
          ErrorTypes.VALIDATION,
          'Please fill in all required fields.'
        );
      }
      
      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        throw new ApiError(
          'Invalid email format',
          0,
          ErrorTypes.VALIDATION,
          'Please enter a valid email address.'
        );
      }
      
      // Validate password strength
      if (password.length < 6) {
        throw new ApiError(
          'Password too short',
          0,
          ErrorTypes.VALIDATION,
          'Password must be at least 6 characters long.'
        );
      }
      
      const userData = await apiRegister(username, email, password);
      
      if (!userData) {
        throw new ApiError(
          'Invalid registration response',
          0,
          ErrorTypes.SERVER,
          'We encountered an issue with our servers. Please try again later.'
        );
      }
      
      setUser(userData);
      
      // Set up notification socket for newly registered user
      setupNotificationSocket(userData);
      
      return userData;
    } catch (err) {
      // Log error for debugging
      handleError(err, 'AuthContext.register');
      
      // Get user-friendly error message
      const userMessage = err.userMessage || getUserFriendlyMessage(err, {
        [ErrorTypes.VALIDATION]: err.message.includes('email') 
          ? 'Please enter a valid email address.' 
          : err.message.includes('password')
            ? 'Please use a stronger password (minimum 6 characters).'
            : 'Please check your information and try again.',
        [ErrorTypes.CONFLICT]: 'This username or email is already in use. Please try another.',
        [ErrorTypes.NETWORK]: 'Unable to connect. Please check your internet connection.',
        [ErrorTypes.SERVER]: 'Our servers are experiencing issues. Please try again later.'
      });
      
      // Store error for display
      setError(userMessage);
      
      // Throw with user-friendly message attached
      if (err instanceof ApiError) {
        throw err;
      } else {
        throw new ApiError(
          err.message || 'Registration failed',
          0,
          err.type || getErrorType(err),
          userMessage
        );
      }
    } finally {
      setLoading(false);
    }
  };

  /**
   * Log out the current user
   */
  const logout = async () => {
    try {
      setLoading(true);
      
      // Close notification socket before logging out
      closeNotificationSocket();
      
      await apiLogout();
      setUser(null);
    } catch (err) {
      console.error('Logout error:', err);
      Alert.alert('Logout Error', 'Failed to log out. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle social login through providers like Google or Apple
   */
  const socialLogin = async (provider) => {
    try {
      setLoading(true);
      setError(null);
      
      // Check for internet connection first
      const online = await isOnline();
      if (!online) {
        throw new ApiError(
          'No internet connection',
          0,
          ErrorTypes.NETWORK,
          'Please check your internet connection and try again.'
        );
      }
      
      // Validate provider
      if (!provider || !['google', 'apple'].includes(provider)) {
        throw new ApiError(
          'Invalid provider',
          0,
          ErrorTypes.VALIDATION,
          'Authentication provider not supported.'
        );
      }
      
      // We need to check if we have the required API keys for the social login providers
      let token;
      
      // Check for required environment variables
      const missingKeys = [];
      if (provider === 'google') {
        // Check for Google API keys
        if (!process.env.GOOGLE_CLIENT_ID) {
          missingKeys.push('GOOGLE_CLIENT_ID');
        }
        if (!process.env.GOOGLE_CLIENT_SECRET) {
          missingKeys.push('GOOGLE_CLIENT_SECRET');
        }
        
        if (missingKeys.length > 0) {
          throw new ApiError(
            `Missing API keys: ${missingKeys.join(', ')}`,
            0,
            ErrorTypes.CONFIG,
            'Google login is not currently available. Please try another login method.'
          );
        }
        
        // Implementation with actual SDK would go here
        // This is where we'd use the Google Sign-In SDK to get a token
        console.log('Using Google credentials:', process.env.GOOGLE_CLIENT_ID);
        token = await getGoogleAuthToken();
      } else if (provider === 'apple' && Platform.OS === 'ios') {
        // Check for Apple API keys
        if (!process.env.APPLE_CLIENT_ID) {
          missingKeys.push('APPLE_CLIENT_ID');
        }
        if (!process.env.APPLE_TEAM_ID) {
          missingKeys.push('APPLE_TEAM_ID');
        }
        
        if (missingKeys.length > 0) {
          throw new ApiError(
            `Missing API keys: ${missingKeys.join(', ')}`,
            0,
            ErrorTypes.CONFIG,
            'Apple login is not currently available. Please try another login method.'
          );
        }
        
        // Implementation with actual SDK would go here
        // This is where we'd use the Apple Sign-In SDK to get a token
        console.log('Using Apple credentials:', process.env.APPLE_CLIENT_ID);
        token = await getAppleAuthToken();
      } else {
        throw new ApiError(
          'Provider not supported on this platform',
          0,
          ErrorTypes.VALIDATION,
          'This login method is not available on your device.'
        );
      }
      
      const userData = await apiSocialLogin(provider, token);
      
      if (!userData) {
        throw new ApiError(
          'Invalid social login response',
          0,
          ErrorTypes.SERVER,
          'We encountered an issue with our servers. Please try again later.'
        );
      }
      
      setUser(userData);
      
      // Set up notification socket for newly logged in user
      setupNotificationSocket(userData);
      
      return userData;
    } catch (err) {
      // Log error for debugging
      handleError(err, `AuthContext.socialLogin.${provider}`);
      
      // Get user-friendly error message
      const userMessage = err.userMessage || getUserFriendlyMessage(err, {
        [ErrorTypes.AUTH]: `${provider.charAt(0).toUpperCase() + provider.slice(1)} authentication failed. Please try again.`,
        [ErrorTypes.VALIDATION]: 'There was a problem with your social login. Please try again.',
        [ErrorTypes.NETWORK]: 'Unable to connect. Please check your internet connection.',
        [ErrorTypes.SERVER]: 'Our servers are experiencing issues. Please try again later.'
      });
      
      // Store error for display
      setError(userMessage);
      
      // Throw with user-friendly message attached
      if (err instanceof ApiError) {
        throw err;
      } else {
        throw new ApiError(
          err.message || 'Social login failed',
          0,
          err.type || getErrorType(err),
          userMessage
        );
      }
    } finally {
      setLoading(false);
    }
  };

  /**
   * Update the current user's data (e.g. after profile update)
   */
  const updateUserData = (newUserData) => {
    setUser(prev => ({
      ...prev,
      ...newUserData
    }));
  };

  const value = {
    user,
    loading,
    error,
    isAuthenticated: !!user,
    login,
    register,
    logout,
    socialLogin,
    updateUserData,
    checkLoginStatus
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * Hook to use the authentication context
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
