import { every, midiToFrequency, noiseBurst, noiseLoop, now, random, tone } from './engine.js';

// Background sound for each pose. Each one starts playing and returns a function that stops it.

const combine =
  (...stops) =>
  () =>
    stops.forEach((stop) => stop());

function rain(level = 1) {
  const hiss = noiseLoop({ type: 'lowpass', frequency: 2400, gain: 0.22 * level });
  const drops = every(0.04, 0.18, () =>
    noiseBurst({ to: 'ambience', type: 'bandpass', frequency: random(2500, 5000), q: 4, duration: 0.03, gain: 0.05 * level }),
  );
  return combine(hiss, drops);
}

function thunder(to = 'ambience') {
  noiseBurst({ to, type: 'lowpass', frequency: 170, duration: 2.8, gain: 0.55, attack: 0.08 });
  noiseBurst({ to, start: now() + 0.05, type: 'lowpass', frequency: 600, duration: 0.5, gain: 0.25, attack: 0.01 });
}

const wind = (level = 1) => noiseLoop({ type: 'bandpass', frequency: 480, q: 0.6, gain: 0.14 * level, wobble: { rate: 0.12, depth: 0.7 } });

function chirp(start, from, to) {
  tone({ frequency: from, glideTo: to, start, duration: 0.08, gain: 0.05, to: 'ambience' });
}

const birds = () =>
  every(1.5, 4, () => {
    const t = now();
    const count = 2 + Math.floor(Math.random() * 3);
    for (let i = 0; i < count; i++) chirp(t + i * 0.11, random(2400, 3000), random(3400, 4200));
  });

const crickets = () =>
  every(0.6, 1.4, () => {
    const t = now();
    for (let i = 0; i < 3; i++) tone({ frequency: 4600, start: t + i * 0.06, duration: 0.03, gain: 0.025, to: 'ambience' });
  });

// breathing in and out through a squashed nose
const snore = () => noiseLoop({ type: 'lowpass', frequency: 380, q: 1.2, gain: 0.16, wobble: { rate: 0.22, depth: 1 } });

const chewing = () =>
  every(0.25, 0.5, () => noiseBurst({ to: 'ambience', type: 'bandpass', frequency: random(1200, 2600), q: 2, duration: 0.06, gain: 0.12 }));

function firework(to = 'ambience') {
  const t = now();
  tone({ frequency: 900, glideTo: 2000, start: t, duration: 0.5, gain: 0.03, to });
  noiseBurst({ to, start: t + 0.55, type: 'lowpass', frequency: 1800, duration: 0.7, gain: 0.28, attack: 0.005 });
  for (let i = 0; i < 6; i++) noiseBurst({ to, start: t + 0.7 + i * random(0.05, 0.12), type: 'highpass', frequency: 5000, duration: 0.02, gain: 0.06 });
}

const fireworks = () => every(1.2, 3, () => firework());

const sleighBells = () =>
  every(0.35, 0.7, () => {
    const t = now();
    for (let i = 0; i < 3; i++) tone({ frequency: random(3200, 5200), type: 'triangle', start: t + i * 0.03, duration: 0.15, gain: 0.02, to: 'ambience' });
  });

function splash(to = 'ambience', level = 1) {
  const t = now();
  noiseBurst({ to, start: t, type: 'bandpass', frequency: 1400, q: 0.8, duration: 0.45, gain: 0.18 * level });
  for (let i = 0; i < 5; i++) noiseBurst({ to, start: t + 0.1 + i * random(0.04, 0.1), type: 'bandpass', frequency: random(3000, 5000), q: 5, duration: 0.03, gain: 0.05 * level });
}

const splashing = () => combine(every(0.8, 2, () => splash()), rain(0.35));

// a low hum with the occasional ghostly swoop
const spooky = () =>
  combine(
    noiseLoop({ type: 'lowpass', frequency: 140, q: 2, gain: 0.12, wobble: { rate: 0.08, depth: 0.5 } }),
    every(4, 8, () => tone({ frequency: midiToFrequency(69), glideTo: midiToFrequency(62), duration: 1.6, gain: 0.04, attack: 0.4, vibrato: 7, to: 'ambience' })),
  );

export const AMBIENCES = {
  rain: () => rain(1),
  drizzle: () => rain(0.45),
  storm: () => combine(rain(1.4), every(7, 14, () => thunder())),
  wind: () => wind(1),
  breeze: () => wind(0.5),
  birds,
  crickets,
  snore,
  chewing,
  fireworks,
  sleighBells,
  splashing,
  spooky,
};

export { firework, splash, thunder };
