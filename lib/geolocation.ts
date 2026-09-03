/**
 * Browser Geolocation Helper for Office Location & Geofence Verification
 */

export interface Coordinates {
  latitude: number;
  longitude: number;
  accuracy?: number;
}

export function getCurrentLocation(): Promise<Coordinates> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      reject(new Error('Geolocation is not supported by your device or browser.'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
        });
      },
      (error) => {
        let msg = 'Unable to retrieve your current location.';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            msg = 'Location access denied: You must allow GPS location access in your browser to verify you are at the office premises.';
            break;
          case error.POSITION_UNAVAILABLE:
            msg = 'GPS location is currently unavailable on your device. Please turn on device location services.';
            break;
          case error.TIMEOUT:
            msg = 'GPS location request timed out. Please check your connection and try again.';
            break;
        }
        reject(new Error(msg));
      },
      {
        enableHighAccuracy: true,
        timeout: 12000,
        maximumAge: 0,
      }
    );
  });
}

/**
 * Calculate distance in meters between two coordinates using Haversine formula (Client-side helper).
 */
export function calculateDistanceMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const earthRadius = 6371000; // in meters
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return earthRadius * c;
}
