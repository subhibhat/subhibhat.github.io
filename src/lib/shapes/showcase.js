import { borrowableParticles, buildEatingPug, buildSleepingPug } from './poses.js';
import { buildPug } from './pug.js';
import { OCCASION_POSES } from './occasionPoses.js';
import { weatherPoseFor } from './weatherPoses.js';

// A day in the life of Khai Tun, looping forever: dressed up if it's a special day, then he checks
// the weather, plays, eats, sleeps, then wakes up and does it all again.
//
// `enter` is how the particles arrive from the previous step: how long it takes and how far
// they swing out on the way (0 = slide straight there, 1 = burst apart).
// `motion` is how the whole pug moves while in that pose: `hop` bounces, `chew` bobs the head,
// `shiver` trembles. `animation: 'pug'` (awake, mouth open) adds blinking, ear flops and panting.
// `sound` is { ambience, cue } from sound/ambience.js and sound/cues.js; `boops` are what each click says.
// The special-day and weather steps take their pose, motion and boops from occasionPoses.js and
// weatherPoses.js once today's date and weather are known.
export const SHOWCASE = [
  {
    name: 'special day',
    occasion: true,
    enter: { seconds: 1.8, swing: 0.45 },
    holdSeconds: 8,
  },
  {
    name: 'weather',
    weather: true,
    enter: { seconds: 1.8, swing: 0.3 },
    holdSeconds: 7,
  },
  {
    name: 'playful',
    build: (pug) => pug,
    enter: { seconds: 1.4, swing: 0.35 },
    holdSeconds: 8,
    motion: { hop: 1, chew: 0, shiver: 0 },
    animation: 'pug',
    sound: { cue: 'yip' },
    boops: ['ไข่ตุ๋น!', 'ปั๊กกันดุ่น', 'กันดุ่ย', 'ดุ่ยศักดิ์'],
  },
  {
    name: 'eating',
    build: buildEatingPug,
    enter: { seconds: 1.6, swing: 0.1 },
    holdSeconds: 6,
    motion: { hop: 0, chew: 1, shiver: 0 },
    animation: 'still',
    sound: { cue: 'munch', ambience: 'chewing' },
    boops: ['งั่ม ๆ', 'อร่อย!', 'ขออีกชาม', 'ห้ามแย่ง'],
  },
  {
    name: 'sleeping',
    build: buildSleepingPug,
    enter: { seconds: 2, swing: 0.08 },
    holdSeconds: 6,
    motion: { hop: 0, chew: 0, shiver: 0 },
    animation: 'still',
    sound: { cue: 'yawn', ambience: 'snore' },
    boops: ['คร่อก…', 'ฝันถึงขนม', 'อย่าเพิ่งปลุก'],
  },
];

export const OCCASION_INDEX = SHOWCASE.findIndex((step) => step.occasion);
export const WEATHER_INDEX = SHOWCASE.findIndex((step) => step.weather);
export const PUG_INDEX = SHOWCASE.findIndex((step) => step.name === 'playful');

const withFalls = (shape, count) => ({ falls: new Float32Array(count), ...shape });

// Builds every step's particle layout. They all share the pug's particles so they can morph into
// each other. Until they're known, the special-day and weather steps just look like the playful pug.
export function createShowcase() {
  const pug = buildPug();
  const borrowed = borrowableParticles(pug);
  const build = (step) => withFalls(step.build(pug, borrowed), pug.count);

  const steps = SHOWCASE.map((step) => (step.weather || step.occasion ? { ...SHOWCASE[PUG_INDEX], ...step } : step));
  const shapes = steps.map(build);

  const swapIn = (index, pose, extra) => {
    steps[index] = { ...SHOWCASE[PUG_INDEX], ...SHOWCASE[index], ...pose, ...extra };
    shapes[index] = build(steps[index]);
  };

  return {
    count: pug.count,
    parts: pug.parts,
    steps,
    shapes,
    // swaps in the pose for this weather condition
    setWeather(condition) {
      swapIn(WEATHER_INDEX, weatherPoseFor(condition), { condition });
    },
    // swaps in today's special-day pose (null on ordinary days, when the step is skipped)
    setOccasion(key) {
      swapIn(OCCASION_INDEX, key ? OCCASION_POSES[key] : {}, { key });
    },
  };
}
