import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { Alert } from 'react-native';
import { 
  login as apiLogin, 
  register as apiRegister, 
  logout as apiLogout, 
  getUser 
} from '../services/api';
import { closeNotificationSocket, setupNotificationSocket } from '../services/notifications';

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
      
      // Validate input
      if (!username || !password) {
        throw new Error('Username and password are required');
      }
      
      const userData = await apiLogin(username, password);
      
      if (!userData) {
        throw new Error('Invalid login response');
      }
      
      setUser(userData);
      
      // Set up notification socket for newly logged in user
      setupNotificationSocket(userData);
      
      return userData;
    } catch (err) {
      console.error('Login error:', err);
      setError(err.message || 'Failed to login');
      throw err;
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
      
      // Validate input
      if (!username || !email || !password) {
        throw new Error('Username, email, and password are required');
      }
      
      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        throw new Error('Please enter a valid email address');
      }
      
      // Validate password strength
      if (password.length < 6) {
        throw new Error('Password must be at least 6 characters');
      }
      
      const userData = await apiRegister(username, email, password);
      
      if (!userData) {
        throw new Error('Invalid registration response');
      }
      
      setUser(userData);
      
      // Set up notification socket for newly registered user
      setupNotificationSocket(userData);
      
      return userData;
    } catch (err) {
      console.error('Registration error:', err);
      setError(err.message || 'Failed to register');
      throw err;
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
