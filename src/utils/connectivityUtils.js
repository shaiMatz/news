import { useEffect, useState } from 'react';
import NetInfo from '@react-native-community/netinfo';
import { API_URL } from '../services/api';

/**
 * Check if the device is currently online
 * 
 * @returns {Promise<boolean>} True if online, false if offline
 */
export async function isOnline() {
  try {
    const netInfo = await NetInfo.fetch();
    return netInfo.isConnected && netInfo.isInternetReachable;
  } catch (error) {
    console.error('Error checking network status:', error);
    return false;
  }
}

/**
 * Ping a URL to check server availability
 * 
 * @param {string} url - URL to ping
 * @param {number} timeout - Timeout in milliseconds
 * @returns {Promise<boolean>} True if server is reachable
 */
export async function pingServer(url = `${API_URL}/ping`, timeout = 5000) {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    
    const response = await fetch(url, { 
      method: 'HEAD',
      signal: controller.signal,
      cache: 'no-store',
      headers: { 'Cache-Control': 'no-cache' }
    });
    
    clearTimeout(timeoutId);
    return response.ok;
  } catch (error) {
    console.error('Server ping failed:', error.message);
    return false;
  }
}

/**
 * React hook to monitor network status changes
 * 
 * @param {string} serverUrl - Optional server URL to ping
 * @returns {Object} Network status information
 * @returns {boolean} Object.isOnline - Whether device has connectivity
 * @returns {boolean} Object.isServerReachable - Whether server is reachable
 * @returns {string} Object.connectionType - Type of connection
 */
export function useNetworkStatus(serverUrl = null) {
  const [networkStatus, setNetworkStatus] = useState({
    isOnline: true,
    isServerReachable: true,
    connectionType: 'unknown',
    details: null
  });
  
  useEffect(() => {
    // Subscribe to network info changes
    const unsubscribe = NetInfo.addEventListener(state => {
      const isOnline = state.isConnected && state.isInternetReachable !== false;
      
      setNetworkStatus(prev => ({
        ...prev,
        isOnline,
        connectionType: state.type,
        details: state
      }));
      
      // If we're online, check server reachability
      if (isOnline && serverUrl) {
        pingServer(serverUrl).then(reachable => {
          setNetworkStatus(prev => ({
            ...prev,
            isServerReachable: reachable
          }));
        });
      }
    });
    
    // Initial check
    NetInfo.fetch().then(state => {
      const isOnline = state.isConnected && state.isInternetReachable !== false;
      
      setNetworkStatus(prev => ({
        ...prev,
        isOnline,
        connectionType: state.type,
        details: state
      }));
      
      // Check server reachability on first load if online
      if (isOnline && serverUrl) {
        pingServer(serverUrl).then(reachable => {
          setNetworkStatus(prev => ({
            ...prev,
            isServerReachable: reachable
          }));
        });
      }
    });
    
    // Clean up subscription
    return () => {
      unsubscribe();
    };
  }, [serverUrl]);
  
  return networkStatus;
}

/**
 * Show a user-friendly message based on network status
 * 
 * @param {Object} networkStatus - Network status object from useNetworkStatus
 * @returns {string|null} User-friendly message or null if everything is fine
 */
export function getNetworkStatusMessage(networkStatus) {
  if (!networkStatus) return null;
  
  if (!networkStatus.isOnline) {
    return 'You are currently offline. Please check your connection.';
  }
  
  if (!networkStatus.isServerReachable) {
    return 'We\'re having trouble connecting to our servers. Please try again later.';
  }
  
  if (networkStatus.connectionType === 'cellular' && networkStatus?.details?.effectiveType === '2g') {
    return 'You\'re on a slow connection. Some features may be limited.';
  }
  
  return null;
}