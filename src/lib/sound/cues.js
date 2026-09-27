import { firework, splash, thunder } from './ambience.js';
import { melody, midiToFrequency, noiseBurst, now, random, tone } from './engine.js';

// One-off sounds played as a pose begins. Each returns roughly how long it lasts (seconds),
// so long ones can turn the music down while they play.

// Happy Birthday (public domain), in C
const HAPPY_BIRTHDAY = [
  [67, 0.75], [67, 0.25], [69, 1], [67, 1], [72, 1], [71, 2],
  [67, 0.75], [67, 0.25], [69, 1], [67, 1], [74, 1], [72, 2],
  [67, 0.75], [67, 0.25], [79, 1], [76, 1], [72, 1], [71, 1], [69, 2],
  [77, 0.75], [77, 0.25], [76, 1], [72, 1], [74, 1], [72, 2],
];

// Jingle Bells chorus (public domain), first line
const JINGLE_BELLS = [
  [76, 1], [76, 1], [76, 2],
  [76, 1], [76, 1], [76, 2],
  [76, 1], [79, 1], [72, 1.5], [74, 0.5], [76, 4],
];

// A wobbly theremin line for Halloween
const SPOOKY_TUNE = [
  [69, 1], [72, 1], [71, 1], [68, 2], [64, 3],
];

function yip(start) {
  tone({ frequency: 650, glideTo: 1150, start, duration: 0.12, gain: 0.12, type: 'triangle' });
}

function crunch(start) {
  noiseBurst({ start, type: 'bandpass', frequency: random(1400, 2400), q: 2, duration: 0.08, gain: 0.18 });
}

function partyHorn(start) {
  tone({ frequency: 440, glideTo: 540, start, duration: 0.6, gain: 0.07, type: 'sawtooth', lowpass: 1800 });
  tone({ frequency: 554, glideTo: 660, start: start + 0.05, duration: 0.55, gain: 0.05, type: 'sawtooth', lowpass: 1800 });
}

export const CUES = {
  // a quick "boop!" when someone clicks him
  boop: () => {
    const pitch = random(620, 820);
    tone({ frequency: pitch, glideTo: pitch * 1.6, duration: 0.12, gain: 0.14 });
    tone({ frequency: pitch * 2, glideTo: pitch * 3, duration: 0.08, gain: 0.03, type: 'triangle' });
    return 0.15;
  },
  yip: () => {
    yip(now());
    yip(now() + 0.17);
    return 0.35;
  },
  munch: () => {
    crunch(now());
    crunch(now() + 0.18);
    crunch(now() + 0.34);
    return 0.45;
  },
  yawn: () => {
    tone({ frequency: 520, glideTo: 210, duration: 1.2, gain: 0.09, attack: 0.15, vibrato: 4 });
    return 1.2;
  },
  thunder: () => {
    thunder('sfx');
    return 2.8;
  },
  splash: () => {
    splash('sfx', 1.6);
    return 0.6;
  },
  newYear: () => {
    partyHorn(now());
    [0.5, 1.1, 1.6].forEach((delay) => setTimeout(() => firework('sfx'), delay * 1000));
    return 2.6;
  },
  birthdaySong: () => melody(HAPPY_BIRTHDAY, { tempo: 112, type: 'triangle', gain: 0.13 }),
  jingleBells: () => melody(JINGLE_BELLS, { tempo: 170, type: 'sine', gain: 0.14, lowpass: 5000 }),
  spookyTune: () => melody(SPOOKY_TUNE, { tempo: 72, type: 'sine', gain: 0.1, vibrato: 8, legato: 1 }),
  brr: () => {
    tone({ frequency: midiToFrequency(62), duration: 0.5, gain: 0.08, type: 'triangle', vibrato: 30 });
    return 0.5;
  },
};
