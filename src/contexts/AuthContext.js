import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { Alert, Platform } from 'react-native';
import {
  login as apiLogin,
  register as apiRegister,
  logout as apiLogout,
  socialLogin as apiSocialLogin,
  getUser,
} from '../services/api';
import { ApiError } from '../services/api';
import { closeNotificationSocket, setupNotificationSocket } from '../services/notifications';
import { getGoogleAuthToken, getAppleAuthToken } from '../services/socialAuth';
import { handleError, ErrorTypes, getUserFriendlyMessage, getErrorType } from '../utils/errorUtils';
import { isOnline } from '../utils/connectivityUtils';
import Config, { getGoogleClientId } from '../config';

// Get necessary config values
const GOOGLE_CLIENT_ID = getGoogleClientId();
const APPLE_CLIENT_ID = process.env.APPLE_CLIENT_ID || '';
const APPLE_TEAM_ID = process.env.APPLE_TEAM_ID || '';

const AuthContext = createContext();

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

      const online = await isOnline();
      if (!online) {
        throw new ApiError(
          'No internet connection',
          0,
          ErrorTypes.NETWORK,
          'Please check your internet connection and try again.'
        );
      }

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
      setupNotificationSocket(userData);

      return userData;
    } catch (err) {
      handleError(err, 'AuthContext.login');

      const userMessage = err.userMessage || getUserFriendlyMessage(err, {
        [ErrorTypes.AUTH]: 'Invalid username or password. Please try again.',
        [ErrorTypes.VALIDATION]: 'Please check your username and password and try again.',
        [ErrorTypes.NETWORK]: 'Unable to connect. Please check your internet connection.',
        [ErrorTypes.SERVER]: 'Our servers are experiencing issues. Please try again later.'
      });

      setError(userMessage);

      if (err && err.name === 'ApiError') {
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

      const online = await isOnline();
      if (!online) {
        throw new ApiError(
          'No internet connection',
          0,
          ErrorTypes.NETWORK,
          'Please check your internet connection and try again.'
        );
      }

      if (!username || !email || !password) {
        throw new ApiError(
          'Validation failed',
          0,
          ErrorTypes.VALIDATION,
          'Please fill in all required fields.'
        );
      }

      const usernameRegex = /^[a-zA-Z0-9_-]{3,30}$/;
      if (!usernameRegex.test(username)) {
        throw new ApiError(
          'Invalid username format',
          0,
          ErrorTypes.VALIDATION,
          'Username must be 3-30 characters and can only contain letters, numbers, underscores and hyphens.'
        );
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        throw new ApiError(
          'Invalid email format',
          0,
          ErrorTypes.VALIDATION,
          'Please enter a valid email address.'
        );
      }

      if (password.length < 8) {
        throw new ApiError(
          'Password too short',
          0,
          ErrorTypes.VALIDATION,
          'Password must be at least 8 characters long.'
        );
      }

      const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/;
      if (!passwordRegex.test(password)) {
        throw new ApiError(
          'Password too weak',
          0,
          ErrorTypes.VALIDATION,
          'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character.'
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
      setupNotificationSocket(userData);

      return userData;
    } catch (err) {
      handleError(err, 'AuthContext.register');

      const userMessage = err.userMessage || getUserFriendlyMessage(err, {
        [ErrorTypes.VALIDATION]: err.message.includes('email')
          ? 'Please enter a valid email address.'
          : err.message.includes('username')
            ? 'Username must be 3-30 characters and can only contain letters, numbers, underscores and hyphens.'
            : err.message.includes('password')
              ? 'Password must be at least 8 characters and contain uppercase, lowercase, number, and special character.'
              : 'Please check your information and try again.',
        [ErrorTypes.CONFLICT]: 'This username or email is already in use. Please try another.',
        [ErrorTypes.NETWORK]: 'Unable to connect. Please check your internet connection.',
        [ErrorTypes.SERVER]: 'Our servers are experiencing issues. Please try again later.'
      });

      setError(userMessage);

      if (err && err.name === 'ApiError') {
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
   * Provides robust error handling and user feedback
   * 
   * @param {string} provider - The authentication provider ('google' or 'apple')
   * @param {Object} options - Additional options for the login process
   * @param {string} options.device - Device information for analytics
   * @returns {Promise<Object>} User data on successful login
   * @throws {ApiError} If authentication fails
   */
  const socialLogin = async (provider, options = {}) => {
    try {
      setLoading(true);
      setError(null);
      
      const device = options.device || Platform.OS;
      console.log(`Initializing ${provider} login on ${device}`);

      // Check network connectivity first
      const online = await isOnline();
      if (!online) {
        throw new ApiError(
          'No internet connection',
          0,
          ErrorTypes.NETWORK,
          'Please check your internet connection and try again.'
        );
      }

      // Validate authentication provider
      if (!provider || !['google', 'apple'].includes(provider)) {
        throw new ApiError(
          'Invalid provider',
          0,
          ErrorTypes.VALIDATION,
          'Authentication provider not supported.'
        );
      }

      // Get authentication token from the appropriate provider
      let token;
      
      // Check for necessary API credentials based on the provider
      if (provider === 'google') {
        if (!GOOGLE_CLIENT_ID) {
          console.error('Missing Google client ID');
          throw new ApiError(
            'Missing Google API credentials',
            0,
            ErrorTypes.CONFIG,
            'Google login is not properly configured. Please contact support.'
          );
        }
        
        console.log('Initiating Google authentication flow');
        try {
          // Get the authentication token from Google
          token = await getGoogleAuthToken();
          console.log('Google authentication token obtained successfully');
        } catch (googleError) {
          // Handle specific Google authentication errors
          if (googleError.name === 'ApiError') {
            throw googleError; // Pass through API errors with user messages
          }
          
          // Check if user cancelled the sign-in
          if (googleError.message && googleError.message.includes('cancelled')) {
            throw new ApiError(
              'Google Sign-In was cancelled',
              0,
              ErrorTypes.USER_CANCELLED,
              'Sign in was cancelled. Please try again if you want to sign in.'
            );
          }
          
          // Check for platform-specific errors
          if (Platform.OS === 'android' && googleError.message && 
              googleError.message.includes('play services')) {
            throw new ApiError(
              'Google Play Services error',
              0,
              ErrorTypes.DEVICE_ERROR,
              'Google Play Services are required for Google Sign-In. Please update Google Play Services and try again.'
            );
          }
          
          // Generic Google authentication error
          throw new ApiError(
            `Google authentication error: ${googleError.message}`,
            0,
            ErrorTypes.AUTH,
            'Unable to authenticate with Google. Please try again later.'
          );
        }
      } else if (provider === 'apple') {
        // Validate platform compatibility first
        if (Platform.OS !== 'ios') {
          throw new ApiError(
            'Apple Sign In not supported on this platform',
            0,
            ErrorTypes.PLATFORM,
            'Apple Sign In is only available on iOS devices.'
          );
        }
        
        // Check for Apple credentials
        if (!APPLE_CLIENT_ID || !APPLE_TEAM_ID) {
          console.error('Missing Apple credentials');
          throw new ApiError(
            'Missing Apple API credentials',
            0,
            ErrorTypes.CONFIG,
            'Apple login is not properly configured. Please contact support.'
          );
        }
        
        console.log('Initiating Apple authentication flow');
        try {
          // Get the authentication token from Apple
          token = await getAppleAuthToken();
          console.log('Apple authentication token obtained successfully');
        } catch (appleError) {
          // Handle specific Apple authentication errors
          if (appleError.name === 'ApiError') {
            throw appleError; // Pass through API errors with user messages
          }
          
          // Check if user cancelled the sign-in
          if (appleError.message && appleError.message.includes('cancelled')) {
            throw new ApiError(
              'Apple Sign-In was cancelled',
              0,
              ErrorTypes.USER_CANCELLED,
              'Sign in was cancelled. Please try again if you want to sign in.'
            );
          }
          
          // Generic Apple authentication error
          throw new ApiError(
            `Apple authentication error: ${appleError.message}`,
            0,
            ErrorTypes.AUTH,
            'Unable to authenticate with Apple. Please try again later.'
          );
        }
      } else {
        throw new ApiError(
          'Unsupported provider',
          0,
          ErrorTypes.VALIDATION,
          'This login method is not supported. Please try another login method.'
        );
      }

      // Validate token before sending to the server
      if (!token || typeof token !== 'string' || token.length < 10) {
        throw new ApiError(
          'Invalid authentication token',
          0,
          ErrorTypes.VALIDATION,
          'Authentication failed. Please try again.'
        );
      }

      console.log(`Authenticating with the server using ${provider} token`);
      
      // Authenticate with our server using the token
      const userData = await apiSocialLogin(provider, token, { device });

      if (!userData) {
        throw new ApiError(
          'Invalid social login response',
          0,
          ErrorTypes.SERVER,
          'We encountered an issue with our servers. Please try again later.'
        );
      }

      console.log(`${provider} authentication successful`);
      
      // Set user data and establish notification socket
      setUser(userData);
      setupNotificationSocket(userData);

      return userData;
    } catch (err) {
      // Log the error for debugging
      handleError(err, `AuthContext.socialLogin.${provider}`);

      // Provide user-friendly error messages based on error type
      const userMessage = err.userMessage || getUserFriendlyMessage(err, {
        [ErrorTypes.AUTH]: `${provider.charAt(0).toUpperCase() + provider.slice(1)} authentication failed. Please try again.`,
        [ErrorTypes.VALIDATION]: 'There was a problem with your social login. Please try again.',
        [ErrorTypes.NETWORK]: 'Unable to connect. Please check your internet connection.',
        [ErrorTypes.SERVER]: 'Our servers are experiencing issues. Please try again later.',
        [ErrorTypes.CONFIG]: `${provider.charAt(0).toUpperCase() + provider.slice(1)} login is not properly configured. Please try another login method.`,
        [ErrorTypes.USER_CANCELLED]: 'Sign in was cancelled. You can try again anytime.',
        [ErrorTypes.PLATFORM]: `${provider.charAt(0).toUpperCase() + provider.slice(1)} sign in is not available on your device.`,
        [ErrorTypes.DEVICE_ERROR]: 'Your device does not support this login method. Please try another option.'
      });

      setError(userMessage);

      if (err && err.name === 'ApiError') {
        throw err;
      } else {
        throw new ApiError(
          err.message || 'Social login failed',
          0,
          err.type || (typeof getErrorType === 'function' ? getErrorType(err) : ErrorTypes.UNKNOWN),
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
