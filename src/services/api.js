import { Platform } from 'react-native';

// Determine if we're running on Replit or locally
const isReplit = typeof window !== 'undefined' && 
  window.location && 
  window.location.hostname && 
  window.location.hostname.includes('.replit.app');

// Base URL for API requests
const API_HOST = isReplit 
  ? window.location.origin
  : Platform.OS === 'web'
    ? 'http://localhost:8080'
    : 'http:/10.100.102.3:8080'; // Android emulator IP for localhost

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
    if (response.status === 401) {
      throw new Error('Unauthorized. Please login.');
    }
    
    if (response.status === 403) {
      throw new Error('Forbidden. You do not have permission to access this resource.');
    }
    
    if (response.status === 429) {
      throw new Error('Too many requests. Please try again later.');
    }
    
    if (!response.ok) {
      let errorMessage;
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || `Request failed with status ${response.status}`;
      } catch (e) {
        errorMessage = `Request failed with status ${response.status}`;
      }
      throw new Error(errorMessage);
    }
    
    // Parse JSON response if it exists
    const contentType = response.headers.get('Content-Type');
    if (contentType && contentType.includes('application/json')) {
      return await response.json();
    }
    
    return true; // Return true for successful requests with no JSON response
  } catch (error) {
    console.error(`API error for ${endpoint}:`, error);
    throw error;
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
        
        // Handle unauthorized errors specially if requested
        if (error.message.includes('Unauthorized') && on401 === 'returnNull') {
          return null;
        }
        
        // Throw if we're out of retry attempts or error isn't network-related
        if (attempts > retries || (!error.message.includes('Network') && !error.message.includes('timeout'))) {
          throw error;
        }
        
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

export async function logout() {
  return apiRequest('/logout', 'POST');
}

export async function getUser() {
  return apiRequest('/user');
}

// News API
export async function fetchNews(locationParams, limit) {
  let queryParams = [];
  
  if (locationParams) {
    queryParams.push(`lat=${locationParams.latitude}`);
    queryParams.push(`lon=${locationParams.longitude}`);
  }
  
  if (limit) {
    queryParams.push(`limit=${limit}`);
  }
  
  const queryString = queryParams.length > 0 ? `?${queryParams.join('&')}` : '';
  return apiRequest(`/news${queryString}`);
}

export async function fetchNewsById(newsId) {
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
    if (error.message.includes('Unauthorized')) {
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

// WebSocket helpers
export function getWebSocketUrl(params = {}) {
  const { newsId, userId, type } = params;
  
  // For Replit environment, use the current URL with /ws path and change protocol
  const isReplit = typeof window !== 'undefined' && 
    window.location && 
    window.location.hostname && 
    window.location.hostname.includes('.replit.dev');
  
  let url;
  if (isReplit) {
    // Use the current origin but replace the protocol
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    url = `${protocol}//${window.location.host}/ws`;
  } else {
    // For local development
    const protocol = typeof window !== 'undefined' && window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsHost = API_URL ? API_URL.replace(/^https?:\/\//, '') : 'localhost:5000';
    url = `${protocol}//${wsHost}/ws`;
  }
  
  // Create URL with query parameters
  const queryParams = [];
  
  if (newsId) queryParams.push(`newsId=${newsId}`);
  if (userId) queryParams.push(`userId=${userId || 'anonymous-' + Date.now()}`);
  if (type) queryParams.push(`type=${type}`);
  
  if (queryParams.length > 0) {
    url += `?${queryParams.join('&')}`;
  }
  
  console.log('Connecting to WebSocket at:', url);
  return url;
}
