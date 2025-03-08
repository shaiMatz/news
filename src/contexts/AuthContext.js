import React, { createContext, useState, useContext, useEffect } from 'react';
import { Alert } from 'react-native';
import { login as apiLogin, register as apiRegister, logout as apiLogout, getUser } from '../services/api';

const AuthContext = createContext();

/**
 * Provider component for authentication context
 * Manages user authentication state and provides login/register/logout methods
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Check if user is already logged in on app start
  useEffect(() => {
    const checkLoginStatus = async () => {
      try {
        const userData = await getUser();
        setUser(userData);
      } catch (err) {
        console.error('Error checking login status:', err);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    checkLoginStatus();
  }, []);

  /**
   * Log in a user with username and password
   */
  const login = async (username, password) => {
    try {
      setLoading(true);
      setError(null);
      const userData = await apiLogin(username, password);
      setUser(userData);
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
      const userData = await apiRegister(username, email, password);
      setUser(userData);
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
      await apiLogout();
      setUser(null);
    } catch (err) {
      console.error('Logout error:', err);
      Alert.alert('Logout Error', 'Failed to log out. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const value = {
    user,
    loading,
    error,
    login,
    register,
    logout,
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
