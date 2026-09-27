import { bus, fadeTo, midiToFrequency, noiseBurst, now, tone } from './engine.js';

// Soft, never-repeating lo-fi: a four-chord loop with a pad, bass on 1 and 3,
// sparse pentatonic plucks and a quiet off-beat hi-hat.
const TEMPO = 78;
const BEAT = 60 / TEMPO;
const BAR = BEAT * 4;
const LOOKAHEAD_SECONDS = 0.3;
const SCHEDULER_MS = 60;
const MUSIC_LEVEL = 0.28;
const DUCKED_LEVEL = 0.08;

// Cmaj7 → Am7 → Fmaj7 → G6, as MIDI notes
const CHORDS = [
  [48, 52, 55, 59],
  [45, 48, 52, 55],
  [41, 45, 48, 52],
  [43, 47, 50, 52],
];
const MELODY_NOTES = [72, 74, 76, 79, 81, 84];
const PLUCK_CHANCE = 0.3;

function scheduleBar(start, chord) {
  for (const note of chord) {
    tone({ frequency: midiToFrequency(note), type: 'triangle', start, duration: BAR, gain: 0.04, attack: 0.8, to: 'music', lowpass: 1100 });
  }
  for (const beat of [0, 2]) {
    tone({ frequency: midiToFrequency(chord[0] - 12), start: start + beat * BEAT, duration: BEAT * 1.6, gain: 0.12, attack: 0.02, to: 'music' });
  }
  for (let eighth = 0; eighth < 8; eighth++) {
    const t = start + (eighth * BEAT) / 2;
    if (eighth % 2) noiseBurst({ start: t, duration: 0.04, gain: 0.018, type: 'highpass', frequency: 7000, to: 'music' });
    if (Math.random() < PLUCK_CHANCE) {
      const note = MELODY_NOTES[Math.floor(Math.random() * MELODY_NOTES.length)];
      tone({ frequency: midiToFrequency(note), type: 'triangle', start: t, duration: 0.7, gain: 0.05, attack: 0.01, to: 'music', lowpass: 2600 });
    }
  }
}

// Starts the music; returns a function that stops it
export function startMusic() {
  let bar = 0;
  let nextBarAt = now() + 0.1;
  const timer = setInterval(() => {
    while (nextBarAt < now() + LOOKAHEAD_SECONDS) {
      scheduleBar(nextBarAt, CHORDS[bar % CHORDS.length]);
      nextBarAt += BAR;
      bar++;
    }
  }, SCHEDULER_MS);
  return () => clearInterval(timer);
}

let unduckTimer = 0;

// Turns the music down while a song or big sound effect plays
export function duck(seconds) {
  fadeTo(bus('music').gain, DUCKED_LEVEL, 0.3);
  clearTimeout(unduckTimer);
  unduckTimer = setTimeout(() => fadeTo(bus('music').gain, MUSIC_LEVEL, 1.2), seconds * 1000);
}
