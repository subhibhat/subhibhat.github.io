import { AMBIENCES } from './ambience.js';
import { CUES } from './cues.js';
import { startAudio, stopAudio } from './engine.js';
import { duck, startMusic } from './music.js';

// Sound is off until the visitor switches it on with the toggle. Once they have, we remember it,
// and on later visits it comes back at their first click, tap or key press (browsers only allow
// audio after the visitor interacts with the page). Poses describe their sound as { ambience, cue }
// — see AMBIENCES and CUES.

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

// True only on a device where the visitor switched sound on before
function wantsSound() {
  try {
    return localStorage.getItem(STORAGE_KEY) === 'on';
  } catch {
    return false;
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

// On a device where sound was switched on before, turns it back on at the visitor's first click,
// tap or key press. Interactions with the toggle itself are left to the toggle (its click handler
// runs after pointerdown/keydown, so acting on both would switch sound on and straight off again).
export function restoreSound() {
  if (!wantsSound()) return () => {};
  const resume = (event) => {
    stop();
    if (event.target instanceof Element && event.target.closest('[data-sound-toggle]')) return;
    setSound(true);
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
