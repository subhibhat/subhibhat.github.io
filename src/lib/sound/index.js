import { AMBIENCES } from './ambience.js';
import { CUES } from './cues.js';
import { startAudio, stopAudio } from './engine.js';
import { duck, startMusic } from './music.js';

// Sound is on by default, but browsers only allow audio after the visitor interacts with the page,
// so it starts at their first click, tap or key press — unless they've switched it off before.
// Poses describe their sound as { ambience, cue } — see AMBIENCES and CUES.

const STORAGE_KEY = 'sound';
// cues longer than this turn the music down while they play
const DUCK_AFTER_SECONDS = 1.5;

let enabled = false;
let scene = null;
let stopAmbience = null;
let stopMusic = null;
const listeners = new Set();

function remember(on) {
  try {
    localStorage.setItem(STORAGE_KEY, on ? 'on' : 'off');
  } catch {}
}

function wantsSound() {
  try {
    return localStorage.getItem(STORAGE_KEY) !== 'off';
  } catch {
    return true;
  }
}

function play(next) {
  stopAmbience?.();
  stopAmbience = next?.ambience ? AMBIENCES[next.ambience]() : null;
  if (next?.cue) {
    const seconds = CUES[next.cue]();
    if (seconds > DUCK_AFTER_SECONDS) duck(seconds);
  }
}

// Call from a click or key press
export function setSound(on) {
  if (on === enabled) return;
  enabled = on;
  remember(on);
  if (on) {
    startAudio();
    stopMusic = startMusic();
    play(scene);
  } else {
    stopAmbience?.();
    stopMusic?.();
    stopAmbience = stopMusic = null;
    stopAudio();
  }
  listeners.forEach((listener) => listener(enabled));
}

// Calls `listener` with true/false now and whenever sound is switched on or off
export function onSound(listener) {
  listeners.add(listener);
  listener(enabled);
  return () => listeners.delete(listener);
}

// Turns sound on at the visitor's first click, tap or key press, unless they switched it off last time
export function restoreSound() {
  if (!wantsSound()) return () => {};
  const resume = () => {
    setSound(true);
    stop();
  };
  const stop = () => {
    window.removeEventListener('pointerdown', resume);
    window.removeEventListener('keydown', resume);
  };
  window.addEventListener('pointerdown', resume);
  window.addEventListener('keydown', resume);
  return stop;
}

// The scene tells us what the current pose sounds like
export function setSoundScene(next) {
  scene = next ?? null;
  if (enabled) play(scene);
}

export function playBoop() {
  if (enabled) CUES.boop();
}
