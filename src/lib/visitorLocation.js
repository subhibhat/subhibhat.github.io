// Where the visitor is, from their browser's location. Used only after they allow it, only on their
// screen, and nothing is saved. In Thailand we name the province right here, without asking anyone;
// elsewhere BigDataCloud's free client-side reverse geocoder names the city. Both it and the
// forecast get coordinates rounded to two decimals (about 1 km).
import { nearestProvince } from './provinces.js';

const OPTIONS = { enableHighAccuracy: false, maximumAge: 30 * 60 * 1000, timeout: 10000 };
const REVERSE_GEOCODE_URL = 'https://api.bigdatacloud.net/data/reverse-geocode-client';
const TIMEOUT_MS = 8000;
const round = (degrees) => Math.round(degrees * 100) / 100;

// True when the visitor already allowed this site to use their location, so we don't need to ask
export async function locationAllowed() {
  try {
    return (await navigator.permissions.query({ name: 'geolocation' })).state === 'granted';
  } catch {
    return false;
  }
}

// { name, country } for a spot outside Thailand, or null if it can't be named
async function placeAbroad(latitude, longitude) {
  try {
    const response = await fetch(`${REVERSE_GEOCODE_URL}?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`, {
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!response.ok) return null;
    const place = await response.json();
    const name = place.city || place.locality || place.principalSubdivision;
    return typeof name === 'string' && name ? { name, country: place.countryCode || '' } : null;
  } catch {
    return null;
  }
}

function position() {
  return new Promise((resolve) => {
    if (!navigator.geolocation) return resolve(null);
    navigator.geolocation.getCurrentPosition(({ coords }) => resolve(coords), () => resolve(null), OPTIONS);
  });
}

// { name, country, latitude, longitude } where the visitor is, or null if they say no or the place
// can't be named. Asks for permission the first time.
export async function locateVisitor() {
  const coords = await position();
  if (!coords) return null;
  const latitude = round(coords.latitude);
  const longitude = round(coords.longitude);
  const province = nearestProvince(coords.latitude, coords.longitude);
  const place = province ? { name: province, country: 'TH' } : await placeAbroad(latitude, longitude);
  return place && { ...place, latitude, longitude };
}
