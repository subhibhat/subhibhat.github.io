import * as THREE from 'three';

// Normalised Gaussian samples are uniform on the unit sphere
export function randomDirection(target) {
  const gaussian = () => Math.sqrt(-2 * Math.log(1 - Math.random())) * Math.cos(2 * Math.PI * Math.random());
  return target.set(gaussian(), gaussian(), gaussian()).normalize();
}

// Split `total` particles across groups by their share, making sure the counts add up exactly.
export function splitCount(total, shares) {
  const sum = shares.reduce((a, b) => a + b, 0);
  const counts = shares.map((share) => Math.floor((total * share) / sum));
  counts[0] += total - counts.reduce((a, b) => a + b, 0);
  return counts;
}

export const random = (min, max) => min + Math.random() * (max - min);
export const pick = (items) => items[Math.floor(Math.random() * items.length)];

// A point somewhere inside a thin tube along a polyline of [x, y, z] points
export function alongPolyline(points, radius) {
  const segment = Math.floor(Math.random() * (points.length - 1));
  const start = new THREE.Vector3(...points[segment]);
  const end = new THREE.Vector3(...points[segment + 1]);
  return start.lerp(end, Math.random()).add(randomDirection(new THREE.Vector3()).multiplyScalar(radius * Math.random()));
}

export const onSphere = (center, radius) => randomDirection(new THREE.Vector3()).multiplyScalar(radius).add(center);
