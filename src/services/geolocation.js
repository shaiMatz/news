import * as Location from 'expo-location';

/**
 * Get the name of a location based on coordinates
 * 
 * @param {number} latitude - Latitude of the location
 * @param {number} longitude - Longitude of the location
 * @returns {Promise<string>} The name of the location (city, region)
 */
export async function getLocationName(latitude, longitude) {
  try {
    const locationData = await Location.reverseGeocodeAsync({
      latitude,
      longitude
    });

    if (locationData && locationData.length > 0) {
      const { city, region, subregion, district } = locationData[0];
      
      // Different regions have different available fields
      // So we prioritize what to display
      if (city) {
        return city;
      } else if (district) {
        return district;
      } else if (subregion) {
        return subregion;
      } else if (region) {
        return region;
      }
      
      return 'Unknown Location';
    }
    
    return 'Unknown Location';
  } catch (error) {
    console.error('Error getting location name:', error);
    return 'Unknown Location';
  }
}

/**
 * Calculate distance between two coordinates
 * 
 * @param {number} lat1 - Latitude of first point
 * @param {number} lon1 - Longitude of first point
 * @param {number} lat2 - Latitude of second point
 * @param {number} lon2 - Longitude of second point
 * @returns {number} Distance in kilometers
 */
export function getDistanceBetweenCoordinates(lat1, lon1, lat2, lon2) {
  // Haversine formula to calculate distance between two points
  const R = 6371; // Radius of the earth in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c; // Distance in km
  
  return distance;
}

function deg2rad(deg) {
  return deg * (Math.PI / 180);
}
