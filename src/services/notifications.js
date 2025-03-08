import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { fetchNotifications } from './api';

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
