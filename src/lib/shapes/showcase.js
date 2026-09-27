import { borrowableParticles, buildEatingPug, buildSleepingPug } from './poses.js';
import { buildPug } from './pug.js';
import { weatherPoseFor } from './weatherPoses.js';

// A day in the life of Khai Tun, looping forever: he checks the weather, plays, eats, sleeps,
// then wakes up and does it all again.
//
// `enter` is how the particles arrive from the previous step: how long it takes and how far
// they swing out on the way (0 = slide straight there, 1 = burst apart).
// `motion` is how the whole pug moves while in that pose: `hop` bounces, `chew` bobs the head,
// `shiver` trembles. `animation: 'pug'` (awake, mouth open) adds blinking, ear flops and panting.
// `boops` are what each click says.
// The weather step's pose, motion and boops come from weatherPoses.js once the weather is known.
export const SHOWCASE = [
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
    boops: ['ไข่ตุ๋น!', 'ปั๊กกันดุ่น', 'กันดุ่ย', 'ดุ่ยศักดิ์'],
  },
  {
    name: 'eating',
    build: buildEatingPug,
    enter: { seconds: 1.6, swing: 0.1 },
    holdSeconds: 6,
    motion: { hop: 0, chew: 1, shiver: 0 },
    animation: 'still',
    boops: ['งั่ม ๆ', 'อร่อย!', 'ขออีกชาม', 'ห้ามแย่ง'],
  },
  {
    name: 'sleeping',
    build: buildSleepingPug,
    enter: { seconds: 2, swing: 0.08 },
    holdSeconds: 6,
    motion: { hop: 0, chew: 0, shiver: 0 },
    animation: 'still',
    boops: ['คร่อก…', 'ฝันถึงขนม', 'อย่าเพิ่งปลุก'],
  },
];

export const WEATHER_INDEX = SHOWCASE.findIndex((step) => step.weather);
export const PUG_INDEX = SHOWCASE.findIndex((step) => step.name === 'playful');

const withFalls = (shape, count) => ({ falls: new Float32Array(count), ...shape });

// Builds every step's particle layout. They all share the pug's particles so they can morph into
// each other. Until the weather is known the weather step just looks like the playful pug.
export function createShowcase() {
  const pug = buildPug();
  const borrowed = borrowableParticles(pug);
  const build = (step) => withFalls(step.build(pug, borrowed), pug.count);

  const steps = SHOWCASE.map((step) => (step.weather ? { ...SHOWCASE[PUG_INDEX], ...step } : step));
  const shapes = steps.map(build);

  return {
    count: pug.count,
    parts: pug.parts,
    steps,
    shapes,
    // swaps in the pose for this weather condition
    setWeather(condition) {
      const pose = weatherPoseFor(condition);
      steps[WEATHER_INDEX] = { ...SHOWCASE[WEATHER_INDEX], ...pose, condition };
      shapes[WEATHER_INDEX] = build(steps[WEATHER_INDEX]);
    },
  };
}
