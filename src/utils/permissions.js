import { Platform } from 'react-native';
import * as Permissions from 'expo-permissions';
import * as ImagePicker from 'expo-image-picker';

/**
 * Request camera permission from the user
 * 
 * @returns {Promise<boolean>} Whether permission was granted
 */
export async function requestCameraPermission() {
  if (Platform.OS !== 'web') {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    return status === 'granted';
  }
  return true;
}

/**
 * Request photo library / storage permission from the user
 * 
 * @returns {Promise<boolean>} Whether permission was granted
 */
export async function requestStoragePermission() {
  if (Platform.OS !== 'web') {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    return status === 'granted';
  }
  return true;
}

/**
 * Request location permission from the user
 * 
 * @returns {Promise<boolean>} Whether permission was granted
 */
export async function requestLocationPermission() {
  if (Platform.OS === 'ios') {
    const { status } = await Permissions.askAsync(Permissions.LOCATION);
    return status === 'granted';
  } 
  
  if (Platform.OS === 'android') {
    const { status } = await Permissions.askAsync(Permissions.LOCATION);
    return status === 'granted';
  }
  
  return true;
}

/**
 * Request multiple permissions at once
 * 
 * @param {Array<string>} permissions - Array of permission types to request
 * @returns {Promise<Object>} Object with permission status
 */
export async function requestMultiplePermissions(permissions) {
  const results = {};
  
  for (const permission of permissions) {
    switch (permission) {
      case 'camera':
        results.camera = await requestCameraPermission();
        break;
      case 'storage':
        results.storage = await requestStoragePermission();
        break;
      case 'location':
        results.location = await requestLocationPermission();
        break;
      default:
        console.warn(`Unknown permission type: ${permission}`);
    }
  }
  
  return results;
}
