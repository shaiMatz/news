/**
 * Social authentication service functions
 * Provides interfaces to third-party authentication providers
 */

import { Platform } from 'react-native';
import { ApiError, ErrorTypes } from '../utils/errorUtils';
import Config, { getGoogleClientId } from '../config';

// Get the Google Client ID from environment variables via config
const GOOGLE_CLIENT_ID = getGoogleClientId();
const APPLE_CLIENT_ID = process.env.APPLE_CLIENT_ID || '';
const APPLE_TEAM_ID = process.env.APPLE_TEAM_ID || '';

/**
 * Get Google authentication token
 * Integrates with Google SignIn SDK for native and web platforms
 * 
 * @returns {Promise<string>} Authentication token from Google
 * @throws {ApiError} If authentication fails or API keys are missing
 */
export async function getGoogleAuthToken() {
  // Check for required environment variables
  if (!GOOGLE_CLIENT_ID) {
    throw new ApiError(
      'Missing Google API keys',
      0,
      ErrorTypes.CONFIG,
      'Google login is not currently available. Please try another login method.'
    );
  }

  console.log('Getting Google auth token with credentials...');
  
  // Check if we're on web or native platform
  if (Platform.OS === 'web') {
    // For web platform - use window.gapi
    try {
      return await getGoogleTokenWeb();
    } catch (error) {
      console.error('Web Google Sign-In error:', error);
      
      if (error && error.name === 'ApiError') {
        throw error;
      }
      
      throw new ApiError(
        `Google authentication failed on web: ${error.message}`,
        0,
        ErrorTypes.AUTH,
        'Unable to authenticate with Google. Please try again later.'
      );
    }
  } else {
    // For native platforms - use @react-native-google-signin/google-signin
    try {
      const { GoogleSignin, statusCodes } = require('@react-native-google-signin/google-signin');
      
      // Configure Google Sign-In
      GoogleSignin.configure({
        webClientId: GOOGLE_CLIENT_ID, // client ID from Google Cloud Console
        offlineAccess: true, // if you want to access Google API on behalf of the user FROM YOUR SERVER
        forceCodeForRefreshToken: true, // [Android] related to `serverAuthCode`
        scopes: ['profile', 'email'] // what API you want to access on behalf of the user
      });

      // Check if user is already signed in
      const isSignedIn = await GoogleSignin.isSignedIn();
      if (isSignedIn) {
        // If already signed in, sign out first to ensure a fresh token
        await GoogleSignin.signOut();
      }

      // Perform Google Sign-In
      await GoogleSignin.hasPlayServices();
      const userInfo = await GoogleSignin.signIn();
      console.log('Google Sign-In successful:', userInfo.user.email);
      
      // Get user ID token
      const { idToken } = userInfo;
      
      if (!idToken) {
        throw new ApiError(
          'Failed to obtain Google ID token',
          0,
          ErrorTypes.AUTH,
          'Unable to authenticate with Google. Please try again.'
        );
      }
      
      return idToken;
    } catch (error) {
      console.error('Native Google Sign-In error:', error);
      
      const { statusCodes } = require('@react-native-google-signin/google-signin');
      
      if (error.code === statusCodes.SIGN_IN_CANCELLED) {
        throw new ApiError(
          'Google Sign-In was cancelled by the user',
          0,
          ErrorTypes.USER_CANCELLED,
          'Sign in was cancelled. Please try again.'
        );
      } else if (error.code === statusCodes.IN_PROGRESS) {
        throw new ApiError(
          'Google Sign-In operation is in progress already',
          0, 
          ErrorTypes.IN_PROGRESS,
          'Sign in is already in progress. Please wait.'
        );
      } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        throw new ApiError(
          'Google Play Services not available',
          0,
          ErrorTypes.DEVICE_ERROR,
          'Google Play Services are not available on this device.'
        );
      }
      
      if (error && error.name === 'ApiError') {
        throw error;
      }
      
      throw new ApiError(
        `Google authentication failed: ${error.message}`,
        0,
        ErrorTypes.AUTH,
        'Unable to authenticate with Google. Please try again later.'
      );
    }
  }
}

/**
 * Get Google token for web platform using Google Identity Services
 * 
 * @returns {Promise<string>} Google ID token
 * @throws {ApiError} If authentication fails
 */
async function getGoogleTokenWeb() {
  // Create a promise that loads the Google API
  const loadGoogleAPI = new Promise((resolve, reject) => {
    // Check if already loaded
    if (window.google && window.google.accounts) {
      return resolve(window.google.accounts);
    }
    
    // Load the Google Identity Services API
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => {
      if (window.google && window.google.accounts) {
        resolve(window.google.accounts);
      } else {
        reject(new Error('Failed to load Google Identity Services'));
      }
    };
    script.onerror = () => {
      reject(new Error('Failed to load Google Identity Services script'));
    };
    document.head.appendChild(script);
  });
  
  try {
    // Wait for the Google API to load
    const googleAccounts = await loadGoogleAPI;
    
    // Initialize Google Sign-In
    return await new Promise((resolve, reject) => {
      googleAccounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: (response) => {
          if (response.credential) {
            resolve(response.credential);
          } else {
            reject(new ApiError(
              'Failed to get Google credential',
              0,
              ErrorTypes.AUTH,
              'Unable to authenticate with Google. Please try again.'
            ));
          }
        },
        auto_select: false,
      });
      
      // Prompt the user to sign in
      googleAccounts.id.prompt((notification) => {
        if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
          reject(new ApiError(
            'Google sign-in prompt cannot be displayed',
            0,
            ErrorTypes.DEVICE_ERROR,
            'Unable to display the Google sign-in prompt. Please try another login method.'
          ));
        }
        
        if (notification.isDismissedMoment()) {
          reject(new ApiError(
            'Google sign-in was dismissed',
            0,
            ErrorTypes.USER_CANCELLED,
            'Sign in was cancelled. Please try again.'
          ));
        }
      });
    });
  } catch (error) {
    console.error('Google Identity Services error:', error);
    throw new ApiError(
      `Google authentication failed: ${error.message}`,
      0,
      ErrorTypes.AUTH,
      'Unable to authenticate with Google. Please try again later.'
    );
  }
}

/**
 * Get Apple authentication token
 * This would normally integrate with Apple SignIn SDK (iOS only)
 * 
 * @returns {Promise<string>} Authentication token from Apple
 * @throws {ApiError} If authentication fails, API keys are missing, or platform is not supported
 */
export async function getAppleAuthToken() {
  // Check platform compatibility
  if (Platform.OS !== 'ios') {
    throw new ApiError(
      'Apple Sign In is only available on iOS',
      0,
      ErrorTypes.VALIDATION,
      'Apple Sign In is only available on iOS devices.'
    );
  }

  // Check for required environment variables
  if (!APPLE_CLIENT_ID || !APPLE_TEAM_ID) {
    throw new ApiError(
      'Missing Apple API keys',
      0,
      ErrorTypes.CONFIG,
      'Apple login is not currently available. Please try another login method.'
    );
  }

  try {
    // In a real implementation, this would use the Apple SDK to authenticate
    // and return a valid token
    console.log('Getting Apple auth token with credentials...');

    // Request proper API keys
    return await new Promise((resolve, reject) => {
      // This is where we would use the Apple SignIn SDK
      // For now, throw an error to indicate we need real API credentials
      reject(new ApiError(
        'Apple Auth not fully implemented - API keys required',
        0,
        ErrorTypes.CONFIG,
        'Apple login requires proper API keys. Please contact the app administrator.'
      ));
    });
  } catch (error) {
    if (error && error.name === 'ApiError') {
      throw error;
    }
    throw new ApiError(
      `Apple authentication failed: ${error.message}`,
      0,
      ErrorTypes.AUTH,
      'Unable to authenticate with Apple. Please try again later.'
    );
  }
}
