import React, { createContext, useState, useContext, useEffect } from 'react';
import { Alert, Platform } from 'react-native';
import * as Location from 'expo-location';
import { getLocationName } from '../services/geolocation';

const LocationContext = createContext();

/**
 * Provider component for location context
 * Manages user location data and provides relevant methods
 */
export function LocationProvider({ children }) {
  const [location, setLocation] = useState(null);
  const [locationName, setLocationName] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [permissionStatus, setPermissionStatus] = useState(null);

  // Request location permissions and get location on mount
  useEffect(() => {
    requestLocationPermissions();
  }, []);

  // Get location name whenever location changes
  useEffect(() => {
    if (location) {
      fetchLocationName();
    }
  }, [location]);

  /**
   * Request location permissions from the user
   */
  const requestLocationPermissions = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { status } = await Location.requestForegroundPermissionsAsync();
      setPermissionStatus(status);
      
      if (status === 'granted') {
        await getCurrentLocation();
      } else {
        setError('Location permission not granted');
        setLoading(false);
      }
    } catch (err) {
      console.error('Error requesting location permissions:', err);
      setError('Failed to request location permissions');
      setLoading(false);
    }
  };

  /**
   * Get the user's current location
   */
  const getCurrentLocation = async () => {
    try {
      setLoading(true);
      
      const currentLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      
      setLocation(currentLocation);
      
      // Start watching position for real-time updates
      watchPositionChanges();
    } catch (err) {
      console.error('Error getting current location:', err);
      setError('Failed to get current location');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Watch for changes in the user's position
   */
  const watchPositionChanges = async () => {
    try {
      await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.Balanced,
          distanceInterval: 100, // Update every 100 meters
          timeInterval: 60000, // Or every minute
        },
        (newLocation) => {
          setLocation(newLocation);
        }
      );
    } catch (err) {
      console.error('Error watching position:', err);
    }
  };

  /**
   * Get the name of the current location (city, region, etc.)
   */
  const fetchLocationName = async () => {
    try {
      if (!location) return;
      
      const name = await getLocationName(
        location.coords.latitude,
        location.coords.longitude
      );
      
      setLocationName(name);
    } catch (err) {
      console.error('Error fetching location name:', err);
    }
  };

  const value = {
    location,
    locationName,
    loading,
    error,
    permissionStatus,
    requestLocationPermissions,
    getCurrentLocation,
  };

  return (
    <LocationContext.Provider value={value}>
      {children}
    </LocationContext.Provider>
  );
}

/**
 * Hook to use the location context
 */
export function useLocation() {
  const context = useContext(LocationContext);
  if (!context) {
    throw new Error('useLocation must be used within a LocationProvider');
  }
  return context;
}
