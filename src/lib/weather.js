// Current weather from Open-Meteo (free, no API key, callable from the browser), shared by the
// header readout and Khai Tun's weather pose. It's the weather where the visitor is once they let
// us use their location, and Sisaket (Oat's home) until then. Sisaket's weather always loads; the
// visitor's own place only if they allowed "weather" in their privacy choices (see consent.js).
import { allowed, onConsent } from './consent.js';
import { locateVisitor, locationAllowed } from './visitorLocation.js';

const REFRESH_MS = 15 * 60 * 1000;

// Shown until the visitor shares their location, or if they say no or we can't name their place
export const FALLBACK_LOCATION = { name: 'Sisaket', country: 'TH', latitude: 15.12, longitude: 104.32 };

const forecastUrl = ({ latitude, longitude }) =>
  `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,weather_code,is_day&timezone=auto`;

export const CONDITIONS = ['clear', 'clearNight', 'partly', 'partlyNight', 'cloudy', 'cold', 'fog', 'drizzle', 'rain', 'storm', 'snow'];

// Thai cool-season mornings: a dry sky below this many °C counts as "cold"
const COLD_BELOW = 20;
const DRY_SKIES = ['clear', 'clearNight', 'partly', 'partlyNight', 'cloudy'];

// WMO weather interpretation codes → condition + label
function describe(code, isDay) {
  if (code === 0) return { condition: isDay ? 'clear' : 'clearNight', label: 'Clear' };
  if (code <= 2) return { condition: isDay ? 'partly' : 'partlyNight', label: 'Partly cloudy' };
  if (code === 3) return { condition: 'cloudy', label: 'Cloudy' };
  if (code <= 48) return { condition: 'fog', label: 'Fog' };
  if (code <= 57) return { condition: 'drizzle', label: 'Drizzle' };
  if (code <= 67 || (code >= 80 && code <= 82)) return { condition: 'rain', label: 'Rain' };
  if (code <= 77 || code === 85 || code === 86) return { condition: 'snow', label: 'Snow' };
  return { condition: 'storm', label: 'Thunderstorm' };
}

const LABELS = {
  clear: 'Clear',
  clearNight: 'Clear',
  partly: 'Partly cloudy',
  partlyNight: 'Partly cloudy',
  cloudy: 'Cloudy',
  fog: 'Fog',
  drizzle: 'Drizzle',
  rain: 'Rain',
  storm: 'Thunderstorm',
  snow: 'Snow',
  cold: 'Chilly',
};

// `?weather=rain` (any condition above) previews that weather instead of the real one;
// in dev the weather test panel changes it live via `previewWeather`.
function conditionFromUrl() {
  const requested = new URLSearchParams(window.location.search).get('weather');
  return CONDITIONS.includes(requested) ? requested : null;
}

let reading = null;
let visitor = null;
let preview = conditionFromUrl();
const listeners = new Set();
let timer = 0;
let live = false;
let stopConsent = null;

function current() {
  if (!preview) return reading;
  return { condition: preview, label: LABELS[preview], temperature: reading?.temperature ?? null, location: reading?.location ?? FALLBACK_LOCATION.name, country: reading?.country ?? FALLBACK_LOCATION.country, here: reading?.here ?? false, preview: true };
}

// Listeners get null when there's no weather to show
function emit() {
  const weather = current();
  listeners.forEach((listener) => listener(weather));
}

async function load() {
  if (!live) return;
  try {
    const location = visitor ?? FALLBACK_LOCATION;
    const response = await fetch(forecastUrl(location));
    if (!response.ok) return;
    const { current: latest } = await response.json();
    // stopped, or the place changed while this was loading (a newer load will report)
    if (!live || location !== (visitor ?? FALLBACK_LOCATION)) return;
    const temperature = Math.round(latest.temperature_2m);
    const sky = describe(latest.weather_code, latest.is_day === 1);
    const chilly = temperature < COLD_BELOW && DRY_SKIES.includes(sky.condition);
    reading = { ...(chilly ? { condition: 'cold', label: LABELS.cold } : sky), temperature, location: location.name, country: location.country, here: location === visitor };
    emit();
  } catch {
    // offline or blocked: no weather, and Khai Tun just skips his weather pose
  }
}

// Asks for the visitor's location and switches to the weather there; false if they say no
// or we can't name the place
export async function useVisitorLocation() {
  if (!live || !allowed('weather')) return false;
  return switchToVisitor();
}

// One lookup at a time, however many things ask for it at once
let switching = null;
function switchToVisitor() {
  switching ??= (async () => {
    const found = await locateVisitor();
    if (!found || !live || !allowed('weather')) return false;
    visitor = found;
    await load();
    return true;
  })().finally(() => (switching = null));
  return switching;
}

// `null` goes back to the real weather
export function previewWeather(condition) {
  preview = condition;
  emit();
}

function start() {
  if (live) return;
  live = true;
  load();
  timer = setInterval(load, REFRESH_MS);
}

function stop() {
  if (!live) return;
  live = false;
  clearInterval(timer);
  reading = visitor = null;
}

// Consent for the visitor's own place: someone who also allowed their location on an earlier visit
// gets their own weather straight away; taking consent back returns to Sisaket
async function onLocationConsent({ weather: consented }) {
  if (consented) {
    if (!visitor && (await locationAllowed())) switchToVisitor();
  } else if (visitor) {
    // stop showing their place right away, then fetch Sisaket's weather again
    visitor = reading = null;
    emit();
    load();
  }
}

// Calls `listener` with { condition, label, temperature, location, country, here, preview? } now (if known) and whenever it
// changes, or with null when the weather goes away.
export function onWeather(listener) {
  listeners.add(listener);
  const weather = current();
  if (weather) listener(weather);
  if (listeners.size === 1) {
    start();
    stopConsent = onConsent(onLocationConsent);
  }
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) {
      stopConsent?.();
      stop();
    }
  };
}
