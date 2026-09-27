import * as THREE from 'three';
import { randomDirection } from './random.js';

// Shared helpers for shapes built out of (super)ellipsoids.

export function mirrored(shape) {
  const [x, y, z] = shape.center;
  const [rx, ry, rz] = shape.rotation ?? [0, 0, 0];
  return [
    { ...shape, center: [x, y, z], rotation: [rx, ry, rz] },
    { ...shape, center: [-x, y, z], rotation: [rx, -ry, -rz] },
  ];
}

export function prepare(shape) {
  const matrix = new THREE.Matrix4().compose(
    new THREE.Vector3(...shape.center),
    new THREE.Quaternion().setFromEuler(new THREE.Euler(...(shape.rotation ?? [0, 0, 0]))),
    new THREE.Vector3(...shape.radii),
  );
  return { ...shape, source: shape, matrix, inverse: matrix.clone().invert() };
}

// Shapes are superellipsoids: exponent 2 is a plain ellipsoid, higher values square it off.
export function unitNorm(v, exponent = 2) {
  return (Math.abs(v.x) ** exponent + Math.abs(v.y) ** exponent + Math.abs(v.z) ** exponent) ** (1 / exponent);
}

export function isInside(shape, point) {
  return unitNorm(point.clone().applyMatrix4(shape.inverse), shape.exponent) < 0.99;
}


export function sampleSurface(shape) {
  const direction = randomDirection(new THREE.Vector3());
  return direction.divideScalar(unitNorm(direction, shape.exponent)).applyMatrix4(shape.matrix);
}

const RAY_START_Z = 2; // just in front of every shape
const RAY_STEP = 0.01;
const RAY_BISECTIONS = 10;

// Distance along a -z ray from `origin` to the shape's surface, or null on a miss.
function rayHit(shape, origin) {
  const o = origin.clone().applyMatrix4(shape.inverse);
  const d = origin.clone().add(new THREE.Vector3(0, 0, -1)).applyMatrix4(shape.inverse).sub(o);

  if ((shape.exponent ?? 2) === 2) {
    const a = d.dot(d);
    const b = 2 * o.dot(d);
    const c = o.dot(o) - 1;
    const discriminant = b * b - 4 * a * c;
    return discriminant < 0 ? null : (-b - Math.sqrt(discriminant)) / (2 * a);
  }

  // no closed form for superellipsoids: march until inside, then bisect
  const isInsideAt = (t) => unitNorm(o.clone().addScaledVector(d, t), shape.exponent) < 1;
  for (let t = 0; t < RAY_START_Z * 2; t += RAY_STEP) {
    if (!isInsideAt(t)) continue;
    let [low, high] = [t - RAY_STEP, t];
    for (let i = 0; i < RAY_BISECTIONS; i++) {
      const mid = (low + high) / 2;
      [low, high] = isInsideAt(mid) ? [low, mid] : [mid, high];
    }
    return high;
  }
  return null;
}

// Z of the front-most surface at (x, y), found by casting a ray from the camera side.
export function frontSurfaceZ(shapes, x, y) {
  const origin = new THREE.Vector3(x, y, RAY_START_Z);
  let best = -Infinity;
  for (const shape of shapes) {
    const t = rayHit(shape, origin);
    if (t !== null) best = Math.max(best, RAY_START_Z - t);
  }
  return best;
}
