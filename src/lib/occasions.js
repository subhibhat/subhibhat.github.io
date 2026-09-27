// Special days when Khai Tun dresses up. Dates are [month, day] in Thai time, inclusive.
export const OCCASIONS = [
  { key: 'yearEnd', label: 'year end', from: [12, 24], to: [12, 31] },
  { key: 'newYear', label: 'new year', from: [1, 1], to: [1, 3] },
  { key: 'songkran', label: 'songkran', from: [4, 13], to: [4, 15] },
  { key: 'halloween', label: 'halloween', from: [10, 31], to: [10, 31] },
  { key: 'birthday', label: 'birthday', from: [11, 4], to: [11, 4] },
];

const RECHECK_MS = 10 * 60 * 1000;

function todayInThailand() {
  const parts = new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Bangkok', month: 'numeric', day: 'numeric' }).formatToParts(new Date());
  const get = (type) => Number(parts.find((part) => part.type === type).value);
  return [get('month'), get('day')];
}

const asNumber = ([month, day]) => month * 100 + day;

function occasionToday() {
  const today = asNumber(todayInThailand());
  return OCCASIONS.find(({ from, to }) => today >= asNumber(from) && today <= asNumber(to))?.key ?? null;
}

// `?occasion=halloween` previews one; in dev the test panel changes it live via `previewOccasion`
function occasionFromUrl() {
  const requested = new URLSearchParams(window.location.search).get('occasion');
  return OCCASIONS.some(({ key }) => key === requested) ? requested : undefined;
}

let preview = occasionFromUrl();
let today = occasionToday();
const listeners = new Set();
let timer = 0;

const current = () => (preview === undefined ? { key: today, preview: false } : { key: preview, preview: true });
const emit = () => listeners.forEach((listener) => listener(current()));

// `undefined` goes back to the real date; `null` previews an ordinary day
export function previewOccasion(key) {
  preview = key;
  emit();
}

// Calls `listener` with { key, preview } right away and whenever it changes (key is null on ordinary days).
export function onOccasion(listener) {
  listeners.add(listener);
  listener(current());
  if (listeners.size === 1) {
    timer = setInterval(() => {
      const next = occasionToday();
      if (next !== today) {
        today = next;
        emit();
      }
    }, RECHECK_MS);
  }
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) clearInterval(timer);
  };
}
