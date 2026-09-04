/**
 * Browser Geolocation Helper for Office Location & Geofence Verification
 * Provides multi-tier location detection:
 * 1. High-accuracy device GPS
 * 2. Standard accuracy browser geolocation (Wi-Fi / Cell tower triangulation)
 * 3. Fallback IP-based geolocation (for desktop browsers without GPS hardware)
 */

export interface Coordinates {
  latitude: number;
  longitude: number;
  accuracy?: number;
  source?: 'gps' | 'browser' | 'ip';
  city?: string;
}

/**
 * Fetch approximate coordinates from IP geolocation service as fallback.
 */
async function getIpLocation(): Promise<Coordinates> {
  const ipEndpoints = [
    { url: 'https://ipapi.co/json/', latKey: 'latitude', lngKey: 'longitude', cityKey: 'city' },
    { url: 'https://freeipapi.com/api/json', latKey: 'latitude', lngKey: 'longitude', cityKey: 'cityName' },
    { url: 'https://ipwho.is/', latKey: 'latitude', lngKey: 'longitude', cityKey: 'city' },
  ];

  for (const ep of ipEndpoints) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);
      const res = await fetch(ep.url, { signal: controller.signal });
      clearTimeout(timeoutId);
      if (res.ok) {
        const data = await res.json();
        const lat = parseFloat(data[ep.latKey]);
        const lng = parseFloat(data[ep.lngKey]);
        if (!isNaN(lat) && !isNaN(lng)) {
          return {
            latitude: lat,
            longitude: lng,
            accuracy: 1000,
            source: 'ip',
            city: data[ep.cityKey] || '',
          };
        }
      }
    } catch {
      // try next IP endpoint
    }
  }

  throw new Error('Could not determine location via IP or GPS.');
}

export async function getCurrentLocation(): Promise<Coordinates> {
  if (typeof window === 'undefined' || !navigator.geolocation) {
    throw new Error('Location services are not supported by your device or browser. Please use a device with location/GPS support.');
  }

  // Tier 1: Try high accuracy GPS (6s timeout)
  try {
    const highAccPos = await new Promise<Coordinates>((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        (pos) => resolve({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
          source: 'gps',
        }),
        (err) => reject(err),
        {
          enableHighAccuracy: true,
          timeout: 6000,
          maximumAge: 30000,
        }
      );
    });
    return highAccPos;
  } catch (err: any) {
    if (err?.code === 1) { // PERMISSION_DENIED
      throw new Error('Location permission denied: You must allow browser location/GPS access to verify you are within 500m of the office.');
    }

    // Tier 2: Try standard device network/Wi-Fi positioning (8s timeout)
    try {
      const stdPos = await new Promise<Coordinates>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          (pos) => resolve({
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            accuracy: pos.coords.accuracy,
            source: 'browser',
          }),
          (err) => reject(err),
          {
            enableHighAccuracy: false,
            timeout: 8000,
            maximumAge: 60000,
          }
        );
      });
      return stdPos;
    } catch (stdErr: any) {
      if (stdErr?.code === 1) {
        throw new Error('Location permission denied: Please allow location access in your browser settings to clock in.');
      }
      throw new Error('Unable to determine your GPS location. Please turn on device Location Services and try again.');
    }
  }
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
