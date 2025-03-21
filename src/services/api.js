import { Platform } from 'react-native';
import { ErrorTypes, logError, getErrorType, getUserFriendlyMessage } from '../utils/errorUtils';

// Determine if we're running on Replit or locally
const isReplit = typeof window !== 'undefined' && 
  window.location && 
  window.location.hostname && 
  window.location.hostname.includes('.replit.app');

// Base URL for API requests
const API_HOST = isReplit 
  ? window.location.origin
  : Platform.OS !== 'android'
    ? 'http://localhost:8080'
    : 'http://172.20.10.5:8080'; // Android emulator IP for localhost


/**
 * Custom API error class with enhanced information for error handling
 */
export class ApiError extends Error {
  /**
   * Create a new API error
   * 
   * @param {string} message - Technical error message (for logging)
   * @param {number} status - HTTP status code (if applicable)
   * @param {string} type - Error type from ErrorTypes
   * @param {string} userMessage - User-friendly error message
   * @param {Object} details - Additional error details
   */
  constructor(message, status = 0, type = ErrorTypes.UNKNOWN, userMessage = null, details = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.type = type;
    this.userMessage = userMessage;
    this.details = details;
    this.timestamp = new Date().toISOString();
    
    // Capture stack trace for debugging
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ApiError);
    }
  }
  
  /**
   * Get user-friendly description of the error
   * This is useful for quickly getting a message suitable for display
   */
  getUserMessage() {
    return this.userMessage || this.message;
  }
  
  /**
   * Convert error to JSON for logging
   */
  toJSON() {
    return {
      name: this.name,
      message: this.message,
      status: this.status,
      type: this.type,
      userMessage: this.userMessage,
      details: this.details,
      timestamp: this.timestamp
    };
  }
}

export const API_URL = API_HOST;
const API_BASE_URL = `${API_HOST}/api`;

// Create a caching and request queue system
let requestQueue = [];
let isProcessingQueue = false;

// Process the request queue sequentially
async function processQueue() {
  if (isProcessingQueue || requestQueue.length === 0) return;
  
  isProcessingQueue = true;
  
  const { resolve, reject, url, options } = requestQueue.shift();
  
  try {
    const response = await fetch(url, options);
    resolve(response);
  } catch (error) {
    reject(error);
  } finally {
    isProcessingQueue = false;
    processQueue(); // Process next item in queue
  }
}

/**
 * Helper function for making API requests
 * 
 * @param {string} endpoint - API endpoint
 * @param {string} method - HTTP method
 * @param {Object} data - Request body
 * @param {Object} headers - Additional headers
 * @param {Object} options - Additional fetch options
 * @returns {Promise<any>} Response data
 */
async function apiRequest(endpoint, method = 'GET', data = null, customHeaders = {}, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const headers = {
    'Content-Type': 'application/json',
    ...customHeaders,
  };
  
  const fetchOptions = {
    method,
    headers,
    credentials: 'include', // Include cookies for session authentication
    ...options
  };
  
  if (data) {
    fetchOptions.body = JSON.stringify(data);
  }
  
  try {
    // For authentication endpoints, use the request queue to prevent race conditions
    let response;
    if (endpoint.startsWith('/login') || endpoint.startsWith('/register') || endpoint.startsWith('/logout')) {
      response = await new Promise((resolve, reject) => {
        requestQueue.push({ resolve, reject, url, options: fetchOptions });
        processQueue();
      });
    } else {
      response = await fetch(url, fetchOptions);
    }
    
    // Handle different status codes
    if (!response.ok) {
      let errorMessage;
      let errorType = ErrorTypes.UNKNOWN;
      let userMessage = null;

      try {
        // Try to parse error response
        const errorData = await response.json();
        errorMessage = errorData.message || `Request failed with status ${response.status}`;
        
        // Use server-provided user message if available
        if (errorData.userMessage) {
          userMessage = errorData.userMessage;
        }
      } catch (e) {
        // If can't parse JSON, use default message based on status
        errorMessage = `Request failed with status ${response.status}`;
      }

      // Determine error type based on status code
      if (response.status === 401) {
        errorType = ErrorTypes.AUTH;
        errorMessage = 'Unauthorized. Please login.';
        userMessage = userMessage || 'Please sign in to continue.';
      } else if (response.status === 403) {
        errorType = ErrorTypes.PERMISSION;
        errorMessage = 'Forbidden. You do not have permission to access this resource.';
        userMessage = userMessage || 'You don\'t have permission to access this resource.';
      } else if (response.status === 402) {
        errorType = ErrorTypes.NOT_FOUND;
        errorMessage = 'Resource not found.';
        userMessage = userMessage || 'The requested information could not be found.';
      } else if (response.status === 429) {
        errorType = ErrorTypes.SERVER;
        errorMessage = 'Too many requests. Please try again later.';
        userMessage = userMessage || 'Please slow down and try again in a moment.';
      } else if (response.status >= 500) {
        errorType = ErrorTypes.SERVER;
        userMessage = userMessage || 'Our system is currently experiencing issues. Please try again later.';
      } else if (response.status >= 400) {
        errorType = ErrorTypes.VALIDATION;
        userMessage = userMessage || 'Please check your information and try again.';
      }

      throw new ApiError(errorMessage, response.status, errorType, userMessage);
    }
    
    // Parse JSON response if it exists
    const contentType = response.headers.get('Content-Type');
    if (contentType && contentType.includes('application/json')) {
      return await response.json();
    }
    
    return true; // Return true for successful requests with no JSON response
  } catch (error) {
    // Log the error
    logError(error, `API request to ${endpoint}`);
    
    // If it's a network error, create a proper ApiError
    if (!error.status && !error.type && 
        (error.message.includes('Network') || 
         error.message.includes('fetch') || 
         error.message.includes('Failed to fetch'))) {
      throw new ApiError(
        'Network connection error', 
        0, 
        ErrorTypes.NETWORK,
        'Please check your internet connection and try again.'
      );
    }
    
    // If it's already an ApiError, just throw it
    if (error && error.name === 'ApiError') {
      throw error;
    }
    
    // Otherwise, convert generic errors to ApiError with appropriate type
    const errorType = getErrorType(error);
    const userMessage = getUserFriendlyMessage(error);
    
    throw new ApiError(
      error.message || 'An error occurred',
      error.status || 0,
      errorType,
      userMessage
    );
  }
}

/**
 * Custom fetch function that can handle retries and special error handling
 */
export async function queryFn({ method = 'GET', on401 = 'throw', retries = 1 }) {
  return async (endpoint, data) => {
    let attempts = 0;
    
    while (attempts <= retries) {
      try {
        return await apiRequest(endpoint, method, data);
      } catch (error) {
        attempts++;
        
        // Check error type for more accurate handling
        const errorType = error.type || getErrorType(error);
        
        // Handle auth errors based on option
        if (errorType === ErrorTypes.AUTH && on401 === 'returnNull') {
          return null;
        }
        
        // Only retry network errors
        if (attempts > retries || errorType !== ErrorTypes.NETWORK) {
          throw error;
        }
        
        // Log retry attempt
        console.log(`Retrying request (${attempts}/${retries}) after network error: ${endpoint}`);
        
        // Wait with exponential backoff before retrying
        await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, attempts - 1)));
      }
    }
  };
}

// Auth API
export async function login(username, password) {
  return apiRequest('/login', 'POST', { username, password });
}

export async function register(username, email, password) {
  return apiRequest('/register', 'POST', { username, email, password });
}

export async function socialLogin(provider, token) {
  // Collect detailed device information for security logging and analytics
  const deviceInfo = {
    platform: Platform.OS,
    version: Platform.Version,
    name: Platform.OS === 'web' ? 'Browser' : 'Mobile App',
    timestamp: new Date().toISOString(),
    locale: navigator?.language || 'unknown',
    timeZone: Intl?.DateTimeFormat()?.resolvedOptions()?.timeZone || 'unknown',
    screenDimensions: {
      width: window?.innerWidth || 0,
      height: window?.innerHeight || 0
    },
    userAgent: navigator?.userAgent || 'unknown',
    // Obscured device IP will be added on the server side
  };
  
  // Only include basic device info in logs to protect user privacy
  console.log('Social login attempt:', {
    provider,
    platform: deviceInfo.platform,
    tokenLength: token ? token.length : 0
  });
  
  try {
    return await apiRequest('/api/social-login', 'POST', { 
      provider, 
      token,
      device: deviceInfo
    });
  } catch (error) {
    console.error(`Social login (${provider}) failed:`, error.message);
    // Add specific error handling for social login failures
    if (error.status === 401) {
      throw new ApiError(
        'Social login authentication failed',
        401,
        ErrorTypes.AUTH,
        `${provider.charAt(0).toUpperCase() + provider.slice(1)} authentication failed. Please try again.`
      );
    }
    throw error;
  }
}

export async function logout() {
  return apiRequest('/logout', 'POST');
}

export async function getUser() {
  return apiRequest('/user');
}

// News API
export async function fetchNews(locationParams, limit) {
  console.log('fetchNews', locationParams, limit);
  let queryParams = [];
  
  if (locationParams) {
    queryParams.push(`lat=${locationParams.latitude}`);
    queryParams.push(`lon=${locationParams.longitude}`);
  }
  
  if (limit) {
    queryParams.push(`limit=${limit}`);
  }
  
  const queryString = queryParams.length > 0 ? `?${queryParams.join('&')}` : '';
  console.log('fetchNews', queryString);
  return apiRequest(`/news/${queryString}`);
}

export async function fetchNewsById(newsId) {
  console.log('fetchNewsById', newsId);
  return apiRequest(`/news/${newsId}`);
}

export async function uploadNews(newsData) {
  return apiRequest('/news', 'POST', newsData);
}

export async function likeNews(newsId) {
  return apiRequest(`/news/${newsId}/like`, 'POST');
}

export async function fetchNewsComments(newsId) {
  return apiRequest(`/news/${newsId}/comments`);
}

export async function addNewsComment(newsId, comment) {
  return apiRequest(`/news/${newsId}/comments`, 'POST', { text: comment });
}

// User profile API
export async function fetchUserProfile() {
  return apiRequest('/user');
}

export async function updateUserProfile(profileData) {
  return apiRequest('/user', 'PUT', profileData);
}

export async function updateUserSettings(settings) {
  return apiRequest('/user/settings', 'PUT', settings);
}

export async function fetchUserContent() {
  return apiRequest('/user/content');
}

// Notifications API
export async function fetchNotifications() {
  try {
    return await apiRequest('/notifications');
  } catch (error) {
    // Return empty array instead of throwing if the user is not authenticated
    const errorType = error.type || getErrorType(error);
    if (errorType === ErrorTypes.AUTH) {
      return [];
    }
    throw error;
  }
}

export async function markNotificationAsRead(notificationId) {
  return apiRequest(`/notifications/${notificationId}/read`, 'POST');
}

export async function markAllNotificationsAsRead() {
  return apiRequest('/notifications/read-all', 'POST');
}

// Streaming API
export async function fetchActiveStreams(locationParams) {
  const queryParams = locationParams 
    ? `?latitude=${locationParams.latitude}&longitude=${locationParams.longitude}&radius=${locationParams.radius || 50}` 
    : '';
  return apiRequest(`/streams${queryParams}`);
}

export async function fetchStreamById(streamId) {
  return apiRequest(`/streams/${streamId}`);
}

/**
 * Create a new live stream
 * 
 * @param {Object} streamData - Stream data
 * @param {number} streamData.newsId - ID of the news item
 * @param {string} streamData.title - Stream title
 * @param {Object} streamData.metadata - Additional metadata
 * @param {boolean} streamData.isAnonymous - Whether to hide broadcaster identity
 * @returns {Promise<Object>} Created stream data
 */
export async function createStream(streamData) {
  return apiRequest('/streams', 'POST', streamData);
}

export async function endStream(streamId) {
  return apiRequest(`/streams/${streamId}/end`, 'POST');
}

// User following API
/**
 * Follow a user
 * 
 * @param {number} userId - ID of the user to follow
 * @returns {Promise<Object>} Follow status
 */
export async function followUser(userId) {
  return apiRequest(`/user/follow/${userId}`, 'POST');
}

/**
 * Unfollow a user
 * 
 * @param {number} userId - ID of the user to unfollow
 * @returns {Promise<Object>} Unfollow status
 */
export async function unfollowUser(userId) {
  return apiRequest(`/user/follow/${userId}`, 'DELETE');
}

/**
 * Get the followers of the current user
 * 
 * @returns {Promise<Array>} List of followers
 */
export async function fetchFollowers() {
  return apiRequest('/user/followers');
}

/**
 * Get the users the current user is following
 * 
 * @returns {Promise<Array>} List of users being followed
 */
export async function fetchFollowing() {
  return apiRequest('/user/following');
}

/**
 * Check if the current user is following another user
 * 
 * @param {number} userId - ID of the user to check
 * @returns {Promise<Object>} Object with isFollowing property
 */
export async function checkFollowingStatus(userId) {
  return apiRequest(`/user/following/${userId}`);
}

/**
 * Get the news feed from followed users
 * 
 * @param {number} limit - Maximum number of items to return
 * @returns {Promise<Array>} List of news items from followed users
 */
export async function fetchFollowingFeed(limit = 20) {
  return apiRequest(`/user/feed?limit=${limit}`);
}

/**
 * Get public profile for a user
 * 
 * @param {number} userId - ID of the user
 * @returns {Promise<Object>} User profile data
 */
export async function fetchUserProfileById(userId) {
  return apiRequest(`/user/profile/${userId}`);
}

/**
 * Request a password reset email
 * 
 * @param {string} email - User's email address
 * @returns {Promise<Object>} Response data
 */
export async function requestPasswordReset(email) {
  return apiRequest('/password-reset/request-reset', 'POST', { email });
}

/**
 * Validate a password reset token
 * 
 * @param {string} token - Reset token from email
 * @returns {Promise<Object>} Response with token validity
 */
export async function validatePasswordResetToken(token) {
  return apiRequest(`/password-reset/validate-token/${token}`);
}

/**
 * Reset password using a valid token
 * 
 * @param {string} token - Valid reset token
 * @param {string} password - New password
 * @returns {Promise<Object>} Response data
 */
export async function resetPassword(token, password) {
  return apiRequest('/password-reset/reset-password', 'POST', { token, password });
}

/// Get the correct WebSocket base URL
function getWebSocketBaseURL() {
  if (typeof window !== 'undefined' && window.location) {
    return window.location.protocol === 'https:' ? 'wss://' : 'ws://';
  }

  // Handle different platforms correctly
  if (Platform.OS === 'android') {
    return 'ws://10.0.2.2:8080'; // Android emulator
  }

  if (Platform.OS === 'ios') {
    return 'ws://localhost:8080'; // iOS simulator
  }

  return 'ws://172.20.10.5:8080';
}

export function getWebSocketUrl(params = {}) {
  const { userId, type } = params;
  const wsBaseURL = getWebSocketBaseURL();

  let url = `${wsBaseURL}/ws`;

  const queryParams = [];
  if (userId) queryParams.push(`userId=${userId}`);
  if (type) queryParams.push(`type=${type}`);

  if (queryParams.length > 0) {
    url += `?${queryParams.join('&')}`;
  }

  console.log('Connecting to WebSocket at:', url);
  return url;
}