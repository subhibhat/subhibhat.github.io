// A tiny Web Audio synth: every sound on the page is generated here, no audio files.

const BUS_LEVELS = { music: 0.28, ambience: 0.45, sfx: 0.7 };
const FADE_IN_SECONDS = 0.8;
const FADE_OUT_SECONDS = 0.4;

let context = null;
let master = null;
let buses = {};
let noise = null;
let suspendTimer = 0;

export const now = () => context.currentTime;
export const bus = (name) => buses[name];
export const midiToFrequency = (note) => 440 * 2 ** ((note - 69) / 12);
export const random = (min, max) => min + Math.random() * (max - min);

export function fadeTo(param, value, seconds) {
  const t = context.currentTime;
  param.cancelScheduledValues(t);
  param.setValueAtTime(param.value, t);
  param.linearRampToValueAtTime(value, t + seconds);
}

function whiteNoise(seconds = 2) {
  const buffer = context.createBuffer(1, context.sampleRate * seconds, context.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  return buffer;
}

// Must be called from a click or key press — browsers only allow audio after one
export function startAudio() {
  if (!context) {
    context = new AudioContext();
    const limiter = context.createDynamicsCompressor();
    limiter.threshold.value = -12;
    limiter.ratio.value = 8;
    limiter.connect(context.destination);
    master = context.createGain();
    master.gain.value = 0;
    master.connect(limiter);
    buses = Object.fromEntries(
      Object.entries(BUS_LEVELS).map(([name, level]) => {
        const gain = context.createGain();
        gain.gain.value = level;
        gain.connect(master);
        return [name, gain];
      }),
    );
    noise = whiteNoise();
  }
  clearTimeout(suspendTimer);
  context.resume();
  fadeTo(master.gain, 1, FADE_IN_SECONDS);
}

export function stopAudio() {
  if (!context) return;
  fadeTo(master.gain, 0, FADE_OUT_SECONDS);
  suspendTimer = setTimeout(() => context.suspend(), FADE_OUT_SECONDS * 1000 + 100);
}

// Attack/decay envelope from silence to `gain` and back
function envelope(start, attack, duration, gain) {
  const node = context.createGain();
  node.gain.setValueAtTime(0.0001, start);
  node.gain.exponentialRampToValueAtTime(gain, start + attack);
  node.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  return node;
}

function filterNode(type, frequency, q = 0.7) {
  const filter = context.createBiquadFilter();
  filter.type = type;
  filter.frequency.value = frequency;
  filter.Q.value = q;
  return filter;
}

// One note. `glideTo` sweeps the pitch; `vibrato` wobbles it (Hz of wobble depth).
export function tone({ frequency, type = 'sine', start = now(), duration = 0.3, gain = 0.2, attack = 0.01, to = 'sfx', glideTo, lowpass, vibrato }) {
  const oscillator = context.createOscillator();
  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, start);
  if (glideTo) oscillator.frequency.exponentialRampToValueAtTime(glideTo, start + duration);
  if (vibrato) {
    const lfo = context.createOscillator();
    const depth = context.createGain();
    lfo.frequency.value = 5.5;
    depth.gain.value = vibrato;
    lfo.connect(depth).connect(oscillator.frequency);
    lfo.start(start);
    lfo.stop(start + duration + 0.05);
  }
  const amp = envelope(start, attack, duration, gain);
  oscillator.connect(amp);
  (lowpass ? amp.connect(filterNode('lowpass', lowpass)) : amp).connect(buses[to]);
  oscillator.start(start);
  oscillator.stop(start + duration + 0.05);
}

// A short burst of filtered noise: raindrops, crunches, splashes, thunder
export function noiseBurst({ start = now(), duration = 0.2, gain = 0.2, type = 'bandpass', frequency = 1000, q = 1, attack = 0.005, to = 'sfx' }) {
  const source = context.createBufferSource();
  source.buffer = noise;
  source.loop = true;
  const amp = envelope(start, attack, duration, gain);
  source.connect(filterNode(type, frequency, q)).connect(amp).connect(buses[to]);
  source.start(start, Math.random() * 1.5);
  source.stop(start + duration + 0.05);
}

// Continuous filtered noise (rain hiss, wind, snoring) that fades in, and out when stopped.
// `wobble` slowly swells the volume: { rate (Hz), depth (0–1 of gain) }.
export function noiseLoop({ type = 'lowpass', frequency = 1000, q = 0.7, gain = 0.2, wobble, to = 'ambience' }) {
  const source = context.createBufferSource();
  source.buffer = noise;
  source.loop = true;
  const amp = context.createGain();
  amp.gain.value = 0;
  source.connect(filterNode(type, frequency, q)).connect(amp).connect(buses[to]);
  source.start();
  fadeTo(amp.gain, gain, 1.5);

  let lfo = null;
  if (wobble) {
    lfo = context.createOscillator();
    const depth = context.createGain();
    lfo.frequency.value = wobble.rate;
    depth.gain.value = gain * wobble.depth;
    lfo.connect(depth).connect(amp.gain);
    lfo.start();
  }

  return () => {
    fadeTo(amp.gain, 0, 1);
    source.stop(now() + 1.1);
    lfo?.stop(now() + 1.1);
  };
}

// Calls `callback` again and again at random intervals; returns a function that stops it
export function every(minSeconds, maxSeconds, callback) {
  let timer = 0;
  const next = () => {
    timer = setTimeout(() => {
      callback();
      next();
    }, random(minSeconds, maxSeconds) * 1000);
  };
  next();
  return () => clearTimeout(timer);
}

// Plays [midiNote, beats] pairs one after another; returns how long it lasts in seconds
export function melody(notes, { tempo = 120, type = 'triangle', gain = 0.12, to = 'sfx', lowpass = 3000, vibrato, legato = 0.9 } = {}) {
  const beat = 60 / tempo;
  let t = now() + 0.05;
  for (const [note, beats] of notes) {
    if (note !== null) tone({ frequency: midiToFrequency(note), type, start: t, duration: beats * beat * legato, gain, attack: 0.02, to, lowpass, vibrato });
    t += beats * beat;
  }
  return t - now();
}
