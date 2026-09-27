// Normalised Gaussian samples are uniform on the unit sphere
export function randomDirection(target) {
  const gaussian = () => Math.sqrt(-2 * Math.log(1 - Math.random())) * Math.cos(2 * Math.PI * Math.random());
  return target.set(gaussian(), gaussian(), gaussian()).normalize();
}

export function packShape(points) {
  const positions = new Float32Array(points.length * 3);
  const weights = new Float32Array(points.length);
  points.forEach(({ point, weight }, i) => {
    point.toArray(positions, i * 3);
    weights[i] = weight;
  });
  return { positions, weights };
}

// Split `total` particles across groups by their share, making sure the counts add up exactly.
export function splitCount(total, shares) {
  const sum = shares.reduce((a, b) => a + b, 0);
  const counts = shares.map((share) => Math.floor((total * share) / sum));
  counts[0] += total - counts.reduce((a, b) => a + b, 0);
  return counts;
}
