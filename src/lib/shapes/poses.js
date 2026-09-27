import * as THREE from 'three';
import { EYE_CENTER_Y, lowerLipY, MOUTH, PART, upperLipY } from './pug.js';
import { randomDirection, splitCount } from './random.js';

// Khai Tun's day: the same particles as the awake pug, rearranged into other poses.
// Props (the bone, the Zs) borrow fur from the back of his head, where nobody will miss it.

const EYE_X = 0.5;
const EYE_HALF_WIDTH = 0.24;
const EYE_FRONT_Z = 1.17;
const MOUTH_Z = 1.14;
// how far below the lower lip still counts as "the open mouth" (the lip line itself is jittered)
const LOWER_LIP_MARGIN = 0.04;

const BORROWED_FROM_Z = 0;
const PROP_PARTICLES = 2400;
const Z_PARTICLES = 1500;

// Fur particles behind the ears, shuffled — the bone and the Zs use the same ones so one turns into the other.
export function borrowableParticles(pug) {
  const indices = [];
  for (let i = 0; i < pug.count; i++) {
    if (pug.parts[i] === PART.FUR && pug.positions[i * 3 + 2] < BORROWED_FROM_Z) indices.push(i);
  }
  return indices.sort(() => Math.random() - 0.5);
}

export const headPose = (tilt, lift, roll = 0) =>
  new THREE.Matrix4().makeRotationFromEuler(new THREE.Euler(tilt, 0, roll)).premultiply(new THREE.Matrix4().makeTranslation(0, lift, 0));

// Where across the eye (-1 → 1) a particle sits, and which eye it belongs to
function acrossEye(point) {
  const side = Math.sign(point.x) || 1;
  return { side, across: THREE.MathUtils.clamp((point.x - side * EYE_X) / EYE_HALF_WIDTH, -1, 1) };
}

const jitter = (amount) => (Math.random() - 0.5) * amount;

// Closed eyes as arcs: `curve` > 0 bends them into content "U"s (asleep), < 0 into happy "^"s, 0 is a squint
export const closedEyes = (curve) => (point) => {
  const { side, across } = acrossEye(point);
  const bend = curve > 0 ? across * across : 1 - across * across;
  const y = EYE_CENTER_Y - 0.04 + Math.abs(curve) * bend + jitter(0.03);
  return new THREE.Vector3(side * EYE_X + across * EYE_HALF_WIDTH, y, EYE_FRONT_Z);
};

// Scrunched-up "> <" eyes, for when the thunder gets loud
export const scaredEyes = (point) => {
  // `across` runs from the chevron's top end, through its tip (pointing at the nose), to its bottom end
  const { side, across } = acrossEye(point);
  const x = side * (EYE_X + 0.08 - 0.18 * (1 - Math.abs(across)));
  return new THREE.Vector3(x + jitter(0.02), EYE_CENTER_Y + 0.13 * across + jitter(0.02), EYE_FRONT_Z);
};

// The tongue, the dark inside of the mouth and the lower lip, anywhere in the open mouth
function isInOpenMouth(point, part) {
  if (part === PART.TONGUE) return true;
  if (part !== PART.MASK || point.z < 0.9 || Math.abs(point.x) > MOUTH.halfWidth) return false;
  return point.y < upperLipY(point.x) + 0.02 && point.y > lowerLipY(point.x) - LOWER_LIP_MARGIN;
}

// Closing the mouth folds all of that onto the smile line
function closedMouth(point) {
  const x = THREE.MathUtils.clamp(point.x, -MOUTH.halfWidth, MOUTH.halfWidth);
  return new THREE.Vector3(x, upperLipY(x) + (Math.random() - 0.5) * 0.025, MOUTH_Z);
}

// Rearranges the awake pug: moves the head, restyles the eyes (`eyes` maps an eye particle to its
// new spot; leave it out to keep them open), optionally closes the mouth, and places the props.
// A prop particle can `fall` (units per second) to make rain or snow.
export function repose(pug, { head, eyes, closeMouth = false, props = new Map() }) {
  const positions = pug.positions.slice();
  const weights = pug.weights.slice();
  const falls = new Float32Array(pug.count);
  const point = new THREE.Vector3();

  for (let i = 0; i < pug.count; i++) {
    if (props.has(i)) continue;
    point.fromArray(positions, i * 3);
    if (eyes && pug.parts[i] === PART.EYE) point.copy(eyes(point));
    if (closeMouth && isInOpenMouth(point, pug.parts[i])) point.copy(closedMouth(point));
    point.applyMatrix4(head).toArray(positions, i * 3);
  }

  for (const [i, { point: propPoint, weight, fall = 0 }] of props) {
    propPoint.toArray(positions, i * 3);
    weights[i] = weight;
    falls[i] = fall;
  }

  return { positions, weights, falls };
}

// Hands out borrowed particles to prop generators in order: [[count, makePoint], ...]
export function assignProps(borrowed, generators) {
  const props = new Map();
  let next = 0;
  for (const [count, makePoint] of generators) {
    for (let i = 0; i < count && next < borrowed.length; i++) props.set(borrowed[next++], makePoint());
  }
  return props;
}

// --- Eating: happily chewing a bone, eyes squeezed shut, mouth closed around it ---

// head tipped a little to one side, as dogs do with a treat
const EATING_HEAD = headPose(0.06, 0, 0.1);
const BONE = { y: -0.56, z: 1.3, halfLength: 0.66, shaftRadius: 0.1, knobRadius: 0.17, knobSpread: 0.13, weight: 1.4 };

function bonePoints(count) {
  const knobs = [-1, 1].flatMap((end) =>
    [-1, 1].map((side) => new THREE.Vector3(end * (BONE.halfLength + 0.08), BONE.y + side * BONE.knobSpread, BONE.z)),
  );
  const [shaftCount, knobCount] = splitCount(count, [55, 45]);
  const shaft = () => {
    const x = (Math.random() * 2 - 1) * BONE.halfLength;
    const angle = Math.random() * Math.PI * 2;
    return { point: new THREE.Vector3(x, BONE.y + Math.cos(angle) * BONE.shaftRadius, BONE.z + Math.sin(angle) * BONE.shaftRadius), weight: BONE.weight };
  };
  const knob = () => {
    const center = knobs[Math.floor(Math.random() * knobs.length)];
    return { point: randomDirection(new THREE.Vector3()).multiplyScalar(BONE.knobRadius).add(center), weight: BONE.weight };
  };
  return [...Array.from({ length: shaftCount }, shaft), ...Array.from({ length: knobCount }, knob)];
}

export function buildEatingPug(pug, borrowed) {
  const bone = bonePoints(PROP_PARTICLES);
  const props = new Map(borrowed.slice(0, PROP_PARTICLES).map((index, i) => [index, bone[i]]));
  return repose(pug, { head: EATING_HEAD, eyes: closedEyes(-0.1), closeMouth: true, props });
}

// --- Sleeping: eyes shut, mouth closed, head nodding, "Z z z" drifting up ---

const SLEEPING_HEAD = headPose(0.18, -0.1);
const Z_TUBE = 0.035;
// drifting up and away beside his head, getting bigger
const Z_LETTERS = [
  { x: 1.2, y: 0.2, size: 0.08 },
  { x: 1.45, y: 0.5, size: 0.11 },
  { x: 1.76, y: 0.84, size: 0.14 },
];

function zLetterPoint() {
  const { x, y, size } = Z_LETTERS[Math.floor(Math.random() * Z_LETTERS.length)];
  // top bar, diagonal, bottom bar
  const corners = [
    [-size, size],
    [size, size],
    [-size, -size],
    [size, -size],
  ];
  const segment = Math.floor(Math.random() * 3);
  const t = Math.random();
  const [x1, y1] = corners[segment];
  const [x2, y2] = corners[segment + 1];
  const offset = randomDirection(new THREE.Vector3()).multiplyScalar(Z_TUBE * Math.random());
  return { point: new THREE.Vector3(x + x1 + (x2 - x1) * t, y + y1 + (y2 - y1) * t, 0.3).add(offset), weight: 1 };
}

export function buildSleepingPug(pug, borrowed) {
  const props = new Map(borrowed.slice(0, Z_PARTICLES).map((index) => [index, zLetterPoint()]));
  return repose(pug, { head: SLEEPING_HEAD, eyes: closedEyes(0.1), closeMouth: true, props });
}
