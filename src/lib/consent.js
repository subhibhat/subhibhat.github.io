// The visitor's privacy choices. Nothing optional runs until they say yes:
// - preferences: remember the theme and sound switches in localStorage
// - weather: ask Open-Meteo for the live weather (they see the visitor's IP address)
// Without a choice, or after "Reject all", the switches still work but are forgotten on reload,
// and the header shows no weather. The choice itself is kept for a year, then we ask again.
// index.html reads the same record before the page draws, to apply a remembered theme.

const KEY = 'consent';
// bump when the categories or what they do change, so everyone is asked again
const VERSION = 1;
const MAX_AGE_MS = 365 * 24 * 60 * 60 * 1000;
// everything "preferences" covers, removed again when it's switched off
const PREFERENCE_KEYS = ['theme', 'sound'];

export const CATEGORIES = [
  {
    id: 'preferences',
    title: 'Remember my settings',
    description: 'Keeps your light or dark theme and your sound on/off choice in this browser, so they stay the same next time. Stored on your device only.',
  },
  {
    id: 'weather',
    title: 'Live weather',
    description:
      'Loads the current weather from Open-Meteo (open-meteo.com), which receives your IP address. If you also tap the place name and allow your location, your position rounded to about 1 km goes to Open-Meteo for the forecast and, outside Thailand, to BigDataCloud (bigdatacloud.com) to name the city.',
  },
];

const storage = {
  get(key) {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  set(key, value) {
    try {
      localStorage.setItem(key, value);
    } catch {}
  },
  remove(key) {
    try {
      localStorage.removeItem(key);
    } catch {}
  },
};

function readChoice() {
  try {
    const saved = JSON.parse(storage.get(KEY));
    if (saved?.version === VERSION && Date.now() - Date.parse(saved.at) < MAX_AGE_MS) return saved;
  } catch {}
  // missing, outdated or expired: start over, and drop anything stored under the old choice
  storage.remove(KEY);
  PREFERENCE_KEYS.forEach(storage.remove);
  return null;
}

let choice = readChoice();
let settingsOpen = false;
// preferences set while they may not be stored: used for the rest of this visit, saved if allowed later
const unsaved = new Map();
const listeners = new Set();

function notify() {
  const state = { decided: choice !== null, settingsOpen, ...allowedNow() };
  listeners.forEach((listener) => listener(state));
}

function allowedNow() {
  return Object.fromEntries(CATEGORIES.map(({ id }) => [id, choice?.[id] === true]));
}

export function allowed(category) {
  return choice?.[category] === true;
}

// Saves the visitor's answer, e.g. { preferences: true, weather: false }
export function choose(answer) {
  choice = { version: VERSION, at: new Date().toISOString() };
  for (const { id } of CATEGORIES) choice[id] = answer[id] === true;
  storage.set(KEY, JSON.stringify(choice));
  if (choice.preferences) {
    unsaved.forEach((value, key) => storage.set(key, value));
  } else {
    PREFERENCE_KEYS.forEach((key) => {
      const value = storage.get(key);
      if (value !== null && !unsaved.has(key)) unsaved.set(key, value);
      storage.remove(key);
    });
  }
  settingsOpen = false;
  notify();
}

export const acceptAll = () => choose(Object.fromEntries(CATEGORIES.map(({ id }) => [id, true])));
export const rejectAll = () => choose({});

export function openSettings() {
  settingsOpen = true;
  notify();
}

export function closeSettings() {
  settingsOpen = false;
  notify();
}

// Calls `listener` with { decided, settingsOpen, preferences, weather } now and whenever they change
export function onConsent(listener) {
  listeners.add(listener);
  listener({ decided: choice !== null, settingsOpen, ...allowedNow() });
  return () => listeners.delete(listener);
}

// Theme and sound go through these instead of localStorage, so they're only stored with consent
export function rememberPreference(key, value) {
  unsaved.set(key, value);
  if (allowed('preferences')) storage.set(key, value);
}

export function recallPreference(key) {
  return allowed('preferences') ? storage.get(key) : (unsaved.get(key) ?? null);
}
