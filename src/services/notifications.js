import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { fetchNotifications } from './api';
import { getWebSocketUrl } from './api';

/**
 * Configure notification behavior for the app
 */
export function configureNotifications() {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    }),
  });
}

/**
 * Request notification permissions from the user
 * 
 * @returns {Promise<boolean>} Whether permissions were granted
 */
export async function requestNotificationPermissions() {
  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    
    if (finalStatus !== 'granted') {
      console.log('Notification permission not granted!');
      return false;
    }
    
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'Default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#2563EB',
      });
    }
    
    return true;
  } catch (error) {
    console.error('Error requesting notification permissions:', error);
    return false;
  }
}

/**
 * Schedule a local notification
 * 
 * @param {Object} notification - Notification details
 * @param {string} notification.title - Notification title
 * @param {string} notification.body - Notification body
 * @param {Object} notification.data - Additional data
 * @param {number} seconds - Seconds to wait before showing notification
 * @returns {Promise<string>} Notification identifier
 */
export async function scheduleLocalNotification({ title, body, data = {} }, seconds = 1) {
  try {
    const hasPermission = await requestNotificationPermissions();
    
    if (!hasPermission) {
      console.log('Cannot schedule notification: no permission');
      return null;
    }
    
    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data,
        sound: true,
        badge: 1,
      },
      trigger: { seconds },
    });
    
    return notificationId;
  } catch (error) {
    console.error('Error scheduling notification:', error);
    return null;
  }
}

/**
 * Get unread notification count for badge display
 * 
 * @returns {Promise<number>} Number of unread notifications
 */
export async function getUnreadNotificationCount() {
  try {
    const notifications = await fetchNotifications();
    return notifications.filter(notification => !notification.read).length;
  } catch (error) {
    console.error('Error getting unread notifications count:', error);
    return 0;
  }
}

/**
 * Add a notification listener
 * 
 * @param {Function} callback - Function to call when notification is received/opened
 * @returns {Function} Function to remove the listener
 */
export function addNotificationListener(callback) {
  const subscription = Notifications.addNotificationResponseReceivedListener(response => {
    callback(response);
  });
  
  return () => subscription.remove();
}

/**
 * WebSocket connection for real-time notifications
 */
let notificationSocket = null;
let notificationCallbacks = [];

/**
 * Setup WebSocket connection for real-time notifications
 * 
 * @param {Object} user - User information for authentication
 * @returns {WebSocket} WebSocket instance
 */
export function setupNotificationSocket(user) {
  if (notificationSocket) {
    return notificationSocket;
  }
  
  try {
    // Create WebSocket connection with user ID and type
    const wsUrl = getWebSocketUrl({
      userId: user?.id,
      type: 'notifications'
    });
    
    console.log('Connecting to notifications WebSocket:', wsUrl);
    notificationSocket = new WebSocket(wsUrl);
    
    // Connection opened
    notificationSocket.onopen = () => {
      console.log('Notification WebSocket connected');
      
      // Authenticate the socket connection with user ID
      if (user?.id) {
        notificationSocket.send(JSON.stringify({ 
          type: 'auth', 
          userId: user.id 
        }));
      }
      
      // Set up keepalive ping to prevent connection timeout
      setInterval(() => {
        if (notificationSocket && notificationSocket.readyState === WebSocket.OPEN) {
          notificationSocket.send(JSON.stringify({ type: 'ping' }));
        }
      }, 30000); // Send ping every 30 seconds
    };
    
    // Listen for messages
    notificationSocket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        // Handle different message types
        if (data.type === 'notification') {
          // Schedule a local notification
          scheduleLocalNotification({
            title: data.title,
            body: data.message,
            data: data
          });
          
          // Call all registered callbacks
          notificationCallbacks.forEach(callback => callback(data));
        }
      } catch (error) {
        console.error('Error processing notification message:', error);
      }
    };
    
    // Handle errors
    notificationSocket.onerror = (error) => {
      console.error('Notification WebSocket error:', error);
    };
    
    // Handle connection close
    notificationSocket.onclose = (event) => {
      console.log('Notification WebSocket disconnected, code:', event.code);
      
      // Store the user info for reconnection
      const userInfo = user;
      
      // Attempt to reconnect after a delay unless this was a deliberate close
      if (event.code !== 1000) {
        setTimeout(() => {
          console.log('Attempting to reconnect notification WebSocket...');
          notificationSocket = null;
          setupNotificationSocket(userInfo);
        }, 5000);
      } else {
        notificationSocket = null;
      }
    };
    
    return notificationSocket;
  } catch (error) {
    console.error('Error setting up notification WebSocket:', error);
    return null;
  }
}

/**
 * Add a callback for real-time notifications
 * 
 * @param {Function} callback - Function to call when a real-time notification is received
 * @param {Object} user - User information for authentication
 * @returns {Function} Function to remove the callback
 */
export function addRealtimeNotificationListener(callback, user) {
  // Make sure the WebSocket is connected
  if (!notificationSocket) {
    setupNotificationSocket(user);
  }
  
  // Add callback to the list
  notificationCallbacks.push(callback);
  
  // Return function to remove the callback
  return () => {
    notificationCallbacks = notificationCallbacks.filter(cb => cb !== callback);
    
    // Close socket if no more callbacks
    if (notificationCallbacks.length === 0 && notificationSocket) {
      notificationSocket.close(1000);
      notificationSocket = null;
    }
  };
}

/**
 * Close the notification WebSocket connection
 */
export function closeNotificationSocket() {
  if (notificationSocket) {
    notificationSocket.close(1000);
    notificationSocket = null;
  }
  notificationCallbacks = [];
}
