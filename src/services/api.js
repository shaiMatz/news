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
    ? 'http://localhost:5000'
    : 'http://10.0.2.2:5000'; // Android emulator IP for localhost

export const API_URL = API_HOST;
const API_BASE_URL = `${API_HOST}/api`;

/**
 * Helper function for making API requests
 * 
 * @param {string} endpoint - API endpoint
 * @param {string} method - HTTP method
 * @param {Object} data - Request body
 * @param {Object} headers - Additional headers
 * @returns {Promise<any>} Response data
 */
async function apiRequest(endpoint, method = 'GET', data = null, customHeaders = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const headers = {
    'Content-Type': 'application/json',
    ...customHeaders,
  };
  
  const options = {
    method,
    headers,
    credentials: 'include', // Include cookies for session authentication
  };
  
  if (data) {
    options.body = JSON.stringify(data);
  }
  
  try {
    const response = await fetch(url, options);
    
    // Check if response is unauthorized
    if (response.status === 401) {
      throw new Error('Unauthorized. Please login.');
    }
    
    // Check if the response is not ok
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Request failed with status ${response.status}`);
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
export async function fetchNews(locationParams) {
  const queryParams = locationParams 
    ? `?lat=${locationParams.latitude}&lon=${locationParams.longitude}` 
    : '';
  return apiRequest(`/news${queryParams}`);
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
  return apiRequest('/profile');
}

export async function updateUserProfile(profileData) {
  return apiRequest('/profile', 'PUT', profileData);
}

export async function updateUserSettings(settings) {
  return apiRequest('/profile/settings', 'PUT', settings);
}

export async function fetchUserContent() {
  return apiRequest('/profile/content');
}

// Notifications API
export async function fetchNotifications() {
  return apiRequest('/notifications');
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

// WebSocket helpers
export function getWebSocketUrl(params = {}) {
  const { newsId, userId, type } = params;
  const protocol = typeof window !== 'undefined' && window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const wsHost = API_URL ? API_URL.replace(/^https?:\/\//, '') : 'localhost:5000';
  
  // Create URL with query parameters
  let url = `${protocol}//${wsHost}/ws`;
  const queryParams = [];
  
  if (newsId) queryParams.push(`newsId=${newsId}`);
  if (userId) queryParams.push(`userId=${userId}`);
  if (type) queryParams.push(`type=${type}`);
  
  if (queryParams.length > 0) {
    url += `?${queryParams.join('&')}`;
  }
  
  return url;
}
