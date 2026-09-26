// Geolocation and Haversine Distance Calculation Utility
// Used for server-side attendance punch in/out verification

/**
 * Calculates great-circle distance between two geographic coordinates using the Haversine formula.
 * @param lat1 Latitude of point 1 in decimal degrees
 * @param lon1 Longitude of point 1 in decimal degrees
 * @param lat2 Latitude of point 2 in decimal degrees
 * @param lon2 Longitude of point 2 in decimal degrees
 * @returns Distance in meters (rounded to nearest meter)
 */
export function calculateHaversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  if (
    typeof lat1 !== 'number' ||
    typeof lon1 !== 'number' ||
    typeof lat2 !== 'number' ||
    typeof lon2 !== 'number' ||
    isNaN(lat1) ||
    isNaN(lon1) ||
    isNaN(lat2) ||
    isNaN(lon2)
  ) {
    throw new Error('Invalid coordinates supplied for distance calculation.');
  }

  const R = 6371000; // Mean radius of the Earth in meters
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);

  const radLat1 = toRadians(lat1);
  const radLat2 = toRadians(lat2);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(radLat1) * Math.cos(radLat2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(R * c);
}

function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

/**
 * Checks whether user coordinates fall within the allowed office boundary radius.
 */
export function isWithinOfficeRadius(
  userLat: number,
  userLon: number,
  officeLat: number,
  officeLon: number,
  allowedRadiusMeters: number = 500
): { isWithin: boolean; distanceMeters: number } {
  const distanceMeters = calculateHaversineDistance(userLat, userLon, officeLat, officeLon);
  return {
    isWithin: distanceMeters <= allowedRadiusMeters,
    distanceMeters
  };
}
