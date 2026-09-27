// Current weather in Sisaket from Open-Meteo (free, no API key, callable from the browser),
// shared by the header readout and Khai Tun's weather pose.
const FORECAST_URL =
  'https://api.open-meteo.com/v1/forecast?latitude=15.12&longitude=104.32&current=temperature_2m,weather_code,is_day&timezone=Asia%2FBangkok';
const REFRESH_MS = 15 * 60 * 1000;

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
let preview = conditionFromUrl();
const listeners = new Set();
let timer = 0;

function current() {
  if (preview) return { condition: preview, label: LABELS[preview], temperature: reading?.temperature ?? null, preview: true };
  return reading;
}

function emit() {
  const weather = current();
  if (weather) listeners.forEach((listener) => listener(weather));
}

async function load() {
  try {
    const response = await fetch(FORECAST_URL);
    if (!response.ok) return;
    const { current: latest } = await response.json();
    const temperature = Math.round(latest.temperature_2m);
    const sky = describe(latest.weather_code, latest.is_day === 1);
    const chilly = temperature < COLD_BELOW && DRY_SKIES.includes(sky.condition);
    reading = { ...(chilly ? { condition: 'cold', label: LABELS.cold } : sky), temperature };
    emit();
  } catch {
    // offline or blocked: no weather, and Khai Tun just skips his weather pose
  }
}

// `null` goes back to the real weather
export function previewWeather(condition) {
  preview = condition;
  emit();
}

// Calls `listener` with { condition, label, temperature, preview? } now (if known) and whenever it changes.
export function onWeather(listener) {
  listeners.add(listener);
  const weather = current();
  if (weather) listener(weather);
  if (listeners.size === 1) {
    load();
    timer = setInterval(load, REFRESH_MS);
  }
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) clearInterval(timer);
  };
}
