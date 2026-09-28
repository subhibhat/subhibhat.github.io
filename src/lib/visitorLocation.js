// The visitor's own province, from their browser's location. Used only after they allow it,
// only on their screen, and nothing is saved; the forecast request gets rounded coordinates.
import { nearestProvince } from './provinces.js';

const OPTIONS = { enableHighAccuracy: false, maximumAge: 30 * 60 * 1000, timeout: 10000 };
const round = (degrees) => Math.round(degrees * 100) / 100;

// True when the visitor already allowed this site to use their location, so we don't need to ask
export async function locationAllowed() {
  try {
    return (await navigator.permissions.query({ name: 'geolocation' })).state === 'granted';
  } catch {
    return false;
  }
}

// { name, latitude, longitude } where the visitor is, or null if they say no or are outside Thailand.
// Asks for permission the first time.
export function locateVisitor() {
  return new Promise((resolve) => {
    if (!navigator.geolocation) return resolve(null);
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const name = nearestProvince(coords.latitude, coords.longitude);
        resolve(name ? { name, latitude: round(coords.latitude), longitude: round(coords.longitude) } : null);
      },
      () => resolve(null),
      OPTIONS,
    );
  });
}
