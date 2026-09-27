// Line icons on a 24×24 grid, drawn with the same stroke as the rest of the UI
const CLOUD = 'M7 18h10a4 4 0 0 0 .5-7.97A6 6 0 0 0 6.1 11 3.5 3.5 0 0 0 7 18z';
const CLOUD_HIGH = 'M7 14h10a4 4 0 0 0 .5-7.97A6 6 0 0 0 6.1 7 3.5 3.5 0 0 0 7 14z';
const SUN_RAYS = 'M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4';
const SMALL_CLOUD = 'M9 20h8a3.5 3.5 0 0 0 .4-6.98A5 5 0 0 0 8.2 14 3 3 0 0 0 9 20z';

export const WEATHER_ICONS = {
  clear: { paths: ['M12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8z', SUN_RAYS], spin: true },
  clearNight: { paths: ['M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z'] },
  partly: { paths: ['M8 10.5a2.8 2.8 0 1 1 3.9-3.3', 'M8 2.5v1.2M3.2 7.7h1.2M4.6 4.3l.9.9', SMALL_CLOUD] },
  partlyNight: { paths: ['M11 7.5A3.5 3.5 0 0 1 6.4 12 4 4 0 1 0 11 7.5z', SMALL_CLOUD] },
  cloudy: { paths: [CLOUD] },
  fog: { paths: ['M4 9h16M4 13h16M7 17h10'] },
  drizzle: { paths: [CLOUD_HIGH, 'M9 18v.5M13 18v.5M17 18v.5M11 21v.5M15 21v.5'] },
  rain: { paths: [CLOUD_HIGH, 'M9 17l-1 3M13 17l-1 3M17 17l-1 3'] },
  storm: { paths: [CLOUD_HIGH, 'M13 14l-3 4h4l-3 4'] },
  snow: { paths: [CLOUD_HIGH, 'M9 18h.01M13 18h.01M17 18h.01M11 21h.01M15 21h.01'] },
};
