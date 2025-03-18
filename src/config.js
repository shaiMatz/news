/**
 * Configuration module to centralize access to environment variables and app settings
 * This module handles environment variable access with fallbacks and validation
 */

import { Platform } from 'react-native';

// Environment variables
const ENV = {
  // Google Auth
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID || '',
  
  // API Settings
  API_URL: process.env.API_URL || 'http://localhost:5000',
  
  // Feature Flags
  ENABLE_ANALYTICS: process.env.ENABLE_ANALYTICS === 'true',
  DEBUG_MODE: process.env.DEBUG_MODE === 'true',
};

/**
 * Gets the appropriate Google Client ID for the current platform
 * 
 * @returns {string} Google Client ID for the current platform
 */
export function getGoogleClientId() {
  // Use environment variable if available
  if (ENV.GOOGLE_CLIENT_ID) {
    return ENV.GOOGLE_CLIENT_ID;
  }
  
  // Fallback to hard-coded values in development (not recommended for production)
  console.warn('Using fallback Google Client ID - you should set the GOOGLE_CLIENT_ID env variable');
  
  return '';
}

/**
 * Get the API URL with optional path
 * 
 * @param {string} path - Optional path to append to the API URL
 * @returns {string} Full API URL
 */
export function getApiUrl(path = '') {
  return `${ENV.API_URL}${path}`;
}

/**
 * Validates that required configuration is available
 * 
 * @returns {Object} Object containing validation results
 */
export function validateConfig() {
  const missingVars = [];
  
  // Check critical environment variables
  if (!ENV.GOOGLE_CLIENT_ID) {
    missingVars.push('GOOGLE_CLIENT_ID');
  }
  
  return {
    isValid: missingVars.length === 0,
    missingVars
  };
}

/**
 * Get full configuration object for debugging
 * Masks sensitive values
 * 
 * @returns {Object} Configuration object with masked sensitive values
 */
export function getDebugConfig() {
  return {
    ...ENV,
    // Mask sensitive information
    GOOGLE_CLIENT_ID: ENV.GOOGLE_CLIENT_ID ? `${ENV.GOOGLE_CLIENT_ID.substring(0, 6)}...` : undefined,
  };
}

export default {
  ...ENV,
  getGoogleClientId,
  getApiUrl,
  validateConfig,
  getDebugConfig
};