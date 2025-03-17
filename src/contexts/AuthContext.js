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
import Config from 'react-native-config';

const GOOGLE_CLIENT_ID = Config.GOOGLE_CLIENT_ID || '';
const GOOGLE_CLIENT_SECRET = Config.GOOGLE_CLIENT_SECRET || '';
const APPLE_CLIENT_ID = Config.APPLE_CLIENT_ID || '';
const APPLE_TEAM_ID = Config.APPLE_TEAM_ID || '';

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
   */
  const socialLogin = async (provider) => {
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

      if (!provider || !['google', 'apple'].includes(provider)) {
        throw new ApiError(
          'Invalid provider',
          0,
          ErrorTypes.VALIDATION,
          'Authentication provider not supported.'
        );
      }

      let token;
      const missingKeys = [];
      if (provider === 'google') {
        if (!GOOGLE_CLIENT_ID) {
          missingKeys.push('GOOGLE_CLIENT_ID');
        }
        if (!GOOGLE_CLIENT_SECRET) {
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
        console.log('Using Google credentials:', GOOGLE_CLIENT_ID);
        token = await getGoogleAuthToken();
      } else if (provider === 'apple' && Platform.OS === 'ios') {
        if (!APPLE_CLIENT_ID) {
          missingKeys.push('APPLE_CLIENT_ID');
        }
        if (!APPLE_TEAM_ID) {
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
        console.log('Using Apple credentials:', APPLE_CLIENT_ID);
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
      setupNotificationSocket(userData);

      return userData;
    } catch (err) {
      handleError(err, `AuthContext.socialLogin.${provider}`);

      const userMessage = err.userMessage || getUserFriendlyMessage(err, {
        [ErrorTypes.AUTH]: `${provider.charAt(0).toUpperCase() + provider.slice(1)} authentication failed. Please try again.`,
        [ErrorTypes.VALIDATION]: 'There was a problem with your social login. Please try again.',
        [ErrorTypes.NETWORK]: 'Unable to connect. Please check your internet connection.',
        [ErrorTypes.SERVER]: 'Our servers are experiencing issues. Please try again later.'
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
