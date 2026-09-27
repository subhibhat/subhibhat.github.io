import * as THREE from 'three';
import { frontSurfaceZ, isInside, mirrored, prepare, sampleSurface, unitNorm } from './ellipsoids.js';

// Particle groups — the shader animates each one differently.
export const PART = {
  FUR: 0,
  MASK: 1,
  EYE: 2,
  NOSE: 3,
  TONGUE: 4,
  EAR: 5,
};

export const EYE_CENTER_Y = 0.22;

const FUR_WEIGHT = 0.45;
const DARK_WEIGHT = 1.2;

// The head is a union of ellipsoids; only the outer surface of the union is kept.
// A squarish skull: flat on top, broad at the temples, flat-faced
const HEAD = { center: [0, 0.12, 0], radii: [1.2, 1.02, 1.0], exponent: 2.6, part: PART.FUR, weight: FUR_WEIGHT, count: 8500 };
const TONGUE = { center: [0.02, -0.7, 1.1], radii: [0.16, 0.24, 0.05], rotation: [-0.4, 0, 0], part: PART.TONGUE, weight: 0.6, count: 700, onTop: true };

// Open mouth: the smile is the upper lip, a half-ellipse below it is the lower lip.
export const MOUTH = { halfWidth: 0.3, lipY: -0.5, depth: 0.22, cavityCount: 1200 };
export const upperLipY = (x) => MOUTH.lipY + 0.9 * x * x;
export const lowerLipY = (x) => MOUTH.lipY - MOUTH.depth * Math.sqrt(Math.max(0, 1 - (x / MOUTH.halfWidth) ** 2));

function isInMouth(point) {
  return point.z > 0.9 && Math.abs(point.x) < MOUTH.halfWidth && point.y < upperLipY(point.x) && point.y > lowerLipY(point.x);
}

// Face-on footprint of the tongue, so the dark cavity is not drawn behind it
function isBehindTongue(x, y) {
  return ((x - TONGUE.center[0]) / TONGUE.radii[0]) ** 2 + ((y - TONGUE.center[1]) / TONGUE.radii[1]) ** 2 < 1;
}

const SHAPES = [
  HEAD,
  { center: [0, -0.3, 0.85], radii: [0.62, 0.45, 0.35], part: PART.MASK, weight: 1, count: 3500 },
  // jowls widen the lower face sideways; set back so they don't bulge forward
  ...mirrored({ center: [0.72, -0.34, 0.25], radii: [0.55, 0.48, 0.55], part: PART.FUR, weight: FUR_WEIGHT, count: 900 }),
  // slightly jutting chin under the mouth
  { center: [0, -0.8, 0.7], radii: [0.36, 0.2, 0.3], part: PART.MASK, weight: 1, count: 500 },
  // the fold of skin that rolls over a pug's nose
  { center: [0, 0.04, 1.06], radii: [0.4, 0.1, 0.15], part: PART.MASK, weight: 1, count: 600 },
  { center: [0, -0.1, 1.2], radii: [0.17, 0.1, 0.08], part: PART.NOSE, weight: DARK_WEIGHT, count: 600 },
  ...mirrored({ center: [0.5, EYE_CENTER_Y, 0.95], radii: [0.24, 0.24, 0.24], part: PART.EYE, weight: DARK_WEIGHT, count: 2000 }),
  // tongue resting in the open mouth and hanging out over the lower lip;
  // drawn over the muzzle rather than hidden by it
  TONGUE,
];

// Pugs have darker fur ringing the eyes, part of the black mask
const EYE_PATCH_RADIUS = 0.42;
const EYE_PATCH_WEIGHT = 0.75;

function isInEyePatch(point) {
  return point.z > 0.5 && Math.hypot(Math.abs(point.x) - 0.5, point.y - EYE_CENTER_Y) < EYE_PATCH_RADIUS;
}

// A glint on each eye, drawn as a gap in the particles so it reads in both themes.
const CATCHLIGHTS = mirrored({ center: [0.42, EYE_CENTER_Y + 0.09, 1.15], radii: [0.065, 0.065, 0.08] }).map(prepare);

// Black drop ears: a triangular flap hinged at the top corner of the skull that folds down
// towards the outer corner of the eye. Right ear; the left one is mirrored.
const EAR = {
  hingeFront: [0.4, 0.98, 0.8],
  hingeBack: [1.1, 0.95, 0.3],
  tip: [1.02, 0.2, 0.8],
  count: 2600,
};

// Creases are curves in face-on (x, y) that get projected onto the front of the face.
const arc = (cx, cy, rx, ry, from, to) => (t) => {
  const angle = Math.PI * (from + (to - from) * t);
  return [cx + rx * Math.cos(angle), cy + ry * Math.sin(angle)];
};

const CREASES = [
  // arch over the nose roll
  { curve: arc(0, -0.04, 0.36, 0.2, 0.1, 0.9), count: 700, width: 0.03 },
  // brow folds hugging the top of each eye
  ...[1, -1].flatMap((side) => [
    { curve: arc(side * 0.5, EYE_CENTER_Y, 0.33, 0.3, 0.15, 0.85), count: 350, width: 0.025 },
    { curve: arc(side * 0.46, EYE_CENTER_Y + 0.02, 0.44, 0.44, 0.3, 0.75), count: 300, width: 0.025 },
  ]),
  // the deep crease running up between the eyes
  { curve: (t) => [0.03 * Math.sin(t * Math.PI), 0.3 + t * 0.45], count: 220, width: 0.025 },
  // mouth: philtrum down from the nose, the smile as upper lip, then the lower lip
  { curve: (t) => [0, -0.2 - t * 0.28], count: 150, width: 0.02 },
  { curve: (t) => [(t - 0.5) * 0.84, upperLipY((t - 0.5) * 0.84)], count: 300, width: 0.02 },
  { curve: (t) => [(t * 2 - 1) * MOUTH.halfWidth, lowerLipY((t * 2 - 1) * MOUTH.halfWidth)], count: 260, width: 0.022, underTongue: true },
  // groove down the middle of the tongue
  { curve: (t) => [TONGUE.center[0], -0.68 - t * 0.16], count: 45, width: 0.012, part: PART.TONGUE },
];

// Head directions in unit-sphere space, so points can be draped over (or tested against) the skull.
function headDirection(point) {
  return point
    .clone()
    .sub(new THREE.Vector3(...HEAD.center))
    .divide(new THREE.Vector3(...HEAD.radii))
    .normalize();
}

function onHead(direction, lift) {
  return direction
    .clone()
    .divideScalar(unitNorm(direction, HEAD.exponent) / lift)
    .multiply(new THREE.Vector3(...HEAD.radii))
    .add(new THREE.Vector3(...HEAD.center));
}

function earCorners(side) {
  return [EAR.hingeFront, EAR.hingeBack, EAR.tip].map(([x, y, z]) => headDirection(new THREE.Vector3(x * side, y, z)));
}

// Is this head direction under the (spherical) triangle covered by an ear flap?
function isUnderEar(direction, [a, b, c]) {
  const sa = Math.sign(direction.dot(new THREE.Vector3().crossVectors(a, b)));
  const sb = Math.sign(direction.dot(new THREE.Vector3().crossVectors(b, c)));
  const sc = Math.sign(direction.dot(new THREE.Vector3().crossVectors(c, a)));
  return sa === sb && sb === sc;
}

function sampleEar([a, b, c]) {
  let u = Math.random();
  let v = Math.random();
  if (u + v > 1) [u, v] = [1 - u, 1 - v];
  const direction = a.clone().multiplyScalar(1 - u - v).addScaledVector(b, u).addScaledVector(c, v).normalize();
  // the flap lifts away from the skull towards its free tip, like a folded ear
  const lift = 1.05 + 0.22 * v * v + (Math.random() - 0.5) * 0.03;
  return onHead(direction, lift);
}

export function buildPug() {
  const shapes = SHAPES.map(prepare);
  const ears = [earCorners(1), earCorners(-1)];
  const points = [];

  const keepIfOnSurface = (shape, point) => {
    const hidden = !shape.onTop && shapes.some((other) => other !== shape && isInside(other, point));
    const underEar = shape.source === HEAD && ears.some((ear) => isUnderEar(headDirection(point), ear));
    const inGlint = shape.part === PART.EYE && CATCHLIGHTS.some((glint) => isInside(glint, point));
    const inMouth = shape.source !== TONGUE && isInMouth(point);
    if (hidden || underEar || inGlint || inMouth) return;
    const weight = shape.part === PART.FUR && isInEyePatch(point) ? EYE_PATCH_WEIGHT : shape.weight;
    points.push({ point, part: shape.part, weight });
  };

  for (const shape of shapes) {
    for (let i = 0; i < shape.count; i++) keepIfOnSurface(shape, sampleSurface(shape));
  }

  for (const ear of ears) {
    for (let i = 0; i < EAR.count; i++) points.push({ point: sampleEar(ear), part: PART.EAR, weight: DARK_WEIGHT });
  }

  for (const crease of CREASES) {
    for (let i = 0; i < crease.count; i++) {
      const [x, y] = crease.curve(Math.random());
      const jx = x + (Math.random() - 0.5) * crease.width;
      const jy = y + (Math.random() - 0.5) * crease.width;
      if (crease.underTongue && isBehindTongue(jx, jy)) continue;
      const z = frontSurfaceZ(shapes, jx, jy);
      if (z > -Infinity) {
        points.push({ point: new THREE.Vector3(jx, jy, z + 0.02), part: crease.part ?? PART.MASK, weight: DARK_WEIGHT });
      }
    }
  }

  // the dark inside of the open mouth, set slightly back from the lips
  const faceShapes = shapes.filter((shape) => shape.source !== TONGUE);
  for (let added = 0, tries = 0; added < MOUTH.cavityCount && tries < MOUTH.cavityCount * 20; tries++) {
    const x = (Math.random() * 2 - 1) * MOUTH.halfWidth;
    const y = MOUTH.lipY + 0.05 - Math.random() * (MOUTH.depth + 0.05);
    if (y > upperLipY(x) || y < lowerLipY(x) || isBehindTongue(x, y)) continue;
    points.push({ point: new THREE.Vector3(x, y, frontSurfaceZ(faceShapes, x, y) - 0.05), part: PART.MASK, weight: DARK_WEIGHT });
    added++;
  }

  const count = points.length;
  const positions = new Float32Array(count * 3);
  const parts = new Float32Array(count);
  const weights = new Float32Array(count);

  points.forEach(({ point, part, weight }, i) => {
    point.toArray(positions, i * 3);
    parts[i] = part;
    weights[i] = weight;
  });

  return { count, positions, parts, weights };
}
