import * as THREE from 'three';
import { assignProps, closedEyes, headPose, repose } from './poses.js';
import { alongPolyline, onSphere, pick, random, randomDirection } from './random.js';
import { snowfall } from './weatherPoses.js';

// Khai Tun dressed up for special days. Props borrow fur from the back of his head.

const BIRTH_YEAR = 1994;
const CONFETTI_SPEED = 0.5;
const SPLASH_SPEED = 1.8;

// --- hats ---

// A cone whose axis can bend sideways towards the tip (a floppy Santa or witch hat).
// Points are spread evenly over the surface: more near the wide base.
function coneSurface({ base, radius, height, bend = 0, depth = radius }) {
  return () => {
    const t = 1 - Math.sqrt(Math.random());
    const angle = random(0, Math.PI * 2);
    const r = radius * (1 - t);
    return new THREE.Vector3(base.x + bend * t * t + Math.cos(angle) * r, base.y + height * t, base.z + Math.sin(angle) * r * (depth / radius));
  };
}

const coneTip = ({ base, height, bend = 0 }) => new THREE.Vector3(base.x + bend, base.y + height, base.z);

// A fluffy ring, like the white trim on a Santa hat
function ring({ center, radiusX, radiusZ, tube }) {
  return () => {
    const angle = random(0, Math.PI * 2);
    return new THREE.Vector3(center.x + Math.cos(angle) * radiusX, center.y, center.z + Math.sin(angle) * radiusZ).add(
      randomDirection(new THREE.Vector3()).multiplyScalar(tube * Math.cbrt(Math.random())),
    );
  };
}

function santaHat() {
  const cone = { base: new THREE.Vector3(0, 0.8, 0.05), radius: 1.15, depth: 1.05, height: 0.62, bend: 0.85 };
  return [
    [1500, () => ({ point: coneSurface(cone)(), weight: 1 })],
    [700, () => ({ point: ring({ center: new THREE.Vector3(0, 0.78, 0.05), radiusX: 1.24, radiusZ: 1.14, tube: 0.13 })(), weight: 1.25 })],
    [260, () => ({ point: onSphere(coneTip(cone), 0.13 * Math.cbrt(Math.random())), weight: 1.3 })],
  ];
}

// Striped party hat perched at a jaunty angle
function partyHat() {
  const base = new THREE.Vector3(0.3, 0.95, 0.1);
  const tip = new THREE.Vector3(0.52, 1.48, 0.1);
  const radius = 0.34;
  const axis = tip.clone().sub(base);
  const side = new THREE.Vector3(1, 0, 0).cross(axis).normalize();
  const across = axis.clone().cross(side).normalize();
  const surface = () => {
    const t = 1 - Math.sqrt(Math.random());
    const angle = random(0, Math.PI * 2);
    const r = radius * (1 - t);
    const point = base.clone().addScaledVector(axis, t).addScaledVector(side, Math.cos(angle) * r).addScaledVector(across, Math.sin(angle) * r);
    // stripes: bands around the cone alternate dense and faint
    return { point, weight: Math.floor(t * 6) % 2 ? 1.25 : 0.6 };
  };
  return [
    [900, surface],
    [120, () => ({ point: onSphere(tip, 0.08 * Math.cbrt(Math.random())), weight: 1.4 })],
  ];
}

function witchHat() {
  const cone = { base: new THREE.Vector3(0, 0.84, 0.05), radius: 0.62, height: 0.72, bend: 0.38 };
  const brim = () => {
    const angle = random(0, Math.PI * 2);
    const r = Math.sqrt(random(0.55 ** 2, 1.45 ** 2));
    return { point: new THREE.Vector3(Math.cos(angle) * r, 0.82 + random(-0.015, 0.015), 0.05 + Math.sin(angle) * r * 0.92), weight: 0.85 };
  };
  // tipped towards the viewer so the wide brim reads as a disc rather than a line
  const tip = new THREE.Matrix4()
    .makeTranslation(0, 0.82, 0.05)
    .multiply(new THREE.Matrix4().makeRotationX(0.25))
    .multiply(new THREE.Matrix4().makeTranslation(0, -0.82, -0.05));
  const tipped = (make) => () => {
    const made = make();
    made.point.applyMatrix4(tip);
    return made;
  };
  return [
    [950, tipped(brim)],
    [950, tipped(() => ({ point: coneSurface(cone)(), weight: 1.1 }))],
  ];
}

// --- things around him ---

function confetti(count) {
  const point = () => new THREE.Vector3(random(-2.1, 2.1), random(-1.7, 1.7), random(-0.5, 1.5));
  return [[count, () => ({ point: point(), weight: 1.15, fall: CONFETTI_SPEED })]];
}

// Rays shooting out from a centre, brightest at the tips
function fireworks(bursts, count) {
  const point = () => {
    const { center, radius } = pick(bursts);
    const angle = (Math.floor(Math.random() * 14) / 14) * Math.PI * 2;
    const along = radius * (1 - Math.random() ** 2 * 0.65);
    return new THREE.Vector3(center.x + Math.cos(angle) * along, center.y + Math.sin(angle) * along, center.z);
  };
  return [[count, () => ({ point: point(), weight: 1.35 })]];
}

// A ribbed jack-o'-lantern with a carved face (the carving is a gap in the particles)
function pumpkin(center) {
  const radii = new THREE.Vector3(0.48, 0.36, 0.42);
  const isCarved = (x, y) =>
    // triangle eyes
    [-0.17, 0.17].some((eyeX) => y > 0.02 && y < 0.14 && Math.abs(x - eyeX) < (0.14 - y) * 0.8) ||
    // zigzag grin
    (Math.abs(x) < 0.26 && y < -0.05 && y > -0.16 + 0.04 * Math.abs(Math.sin(x * 24)));
  const shell = () => {
    for (;;) {
      const direction = randomDirection(new THREE.Vector3());
      const ribs = 1 - 0.07 * Math.abs(Math.sin(Math.atan2(direction.z, direction.x) * 5));
      const point = direction.multiply(radii).multiplyScalar(ribs);
      if (point.z > 0.15 && isCarved(point.x, point.y)) continue;
      return { point: point.add(center), weight: 1 };
    }
  };
  const stem = () => ({ point: alongPolyline([[0, 0.34, 0], [0.05, 0.48, 0]], 0.04).add(center), weight: 1.3 });
  return [
    [1400, shell],
    [100, stem],
  ];
}

function bats(positions, count) {
  const point = () => {
    const { x, y, size } = pick(positions);
    // two scalloped wings spreading from the body
    const u = random(-1, 1);
    const wing = y + size * (0.45 * Math.abs(u) - 0.15 * Math.abs(Math.sin(u * 9)));
    return new THREE.Vector3(x + u * size * 1.6, wing, 0.2);
  };
  return [[count, () => ({ point: point(), weight: 1.3 })]];
}

// Songkran: a silver water bowl tipped over his head, pouring a stream that splashes off him
function waterBowlPour() {
  const bowlCenter = new THREE.Vector3(0.05, 1.36, 0.35);
  const tilt = new THREE.Matrix4().makeRotationZ(-0.55).multiply(new THREE.Matrix4().makeRotationX(0.35));
  const bowl = () => {
    // a shallow open dish: the lower half of a squashed sphere, tipped towards his head
    const direction = randomDirection(new THREE.Vector3());
    direction.y = -Math.abs(direction.y);
    const point = new THREE.Vector3(direction.x * 0.46, direction.y * 0.26, direction.z * 0.46).applyMatrix4(tilt).add(bowlCenter);
    return { point, weight: 1.15 };
  };
  const lip = () => {
    const angle = random(0, Math.PI * 2);
    const point = new THREE.Vector3(Math.cos(angle) * 0.46, 0, Math.sin(angle) * 0.46).applyMatrix4(tilt).add(bowlCenter);
    return { point, weight: 1.4 };
  };
  // the stream curls out of the low (right) side of the bowl and lands on top of his head
  const spout = new THREE.Vector3(0.46, 0, 0).applyMatrix4(tilt).add(bowlCenter);
  const landing = new THREE.Vector3(0.62, 1.05, 0.5);
  const stream = () => {
    const t = Math.random();
    const point = spout.clone().lerp(landing, t);
    point.x += 0.12 * Math.sin(t * Math.PI);
    return { point: point.add(randomDirection(new THREE.Vector3()).multiplyScalar(0.06 * Math.random())), weight: 1.35 };
  };
  const splash = () => {
    const angle = random(0.1, Math.PI - 0.1);
    const r = random(0.1, 0.45);
    return { point: new THREE.Vector3(landing.x + Math.cos(angle) * r, landing.y + Math.sin(angle) * r * 0.5, landing.z + random(-0.1, 0.3)), weight: 1.25 };
  };
  const droplet = () => ({ point: new THREE.Vector3(random(-1.6, 1.8), random(-1.7, 1.4), random(0, 1.4)), weight: 0.9, fall: SPLASH_SPEED });
  return [
    [1000, bowl],
    [260, lip],
    [700, stream],
    [500, splash],
    [700, droplet],
  ];
}

// Seven-segment digits, for the candles on the birthday cake
const SEGMENTS = {
  0: 'abcdef',
  1: 'bc',
  2: 'abdeg',
  3: 'abcdg',
  4: 'bcfg',
  5: 'acdfg',
  6: 'acdefg',
  7: 'abc',
  8: 'abcdefg',
  9: 'abcdfg',
};
const SEGMENT_LINES = {
  a: [[0, 1], [1, 1]],
  b: [[1, 1], [1, 0.5]],
  c: [[1, 0.5], [1, 0]],
  d: [[0, 0], [1, 0]],
  e: [[0, 0.5], [0, 0]],
  f: [[0, 1], [0, 0.5]],
  g: [[0, 0.5], [1, 0.5]],
};

function digitsAt(text, origin, { width, height, gap }) {
  const strokes = [...text].flatMap((digit, i) =>
    [...SEGMENTS[digit]].map((segment) =>
      SEGMENT_LINES[segment].map(([x, y]) => [origin.x + i * (width + gap) + x * width, origin.y + y * height, origin.z]),
    ),
  );
  return () => alongPolyline(pick(strokes), 0.018);
}

function birthdayCake(center, age) {
  const radius = 0.42;
  const height = 0.34;
  const side = () => {
    const angle = random(0, Math.PI * 2);
    return new THREE.Vector3(center.x + Math.cos(angle) * radius, center.y + random(0, height), center.z + Math.sin(angle) * radius);
  };
  const top = () => {
    const angle = random(0, Math.PI * 2);
    const r = radius * Math.sqrt(Math.random());
    return new THREE.Vector3(center.x + Math.cos(angle) * r, center.y + height, center.z + Math.sin(angle) * r);
  };
  // wavy icing dripping over the top edge
  const icing = () => {
    const angle = random(0, Math.PI * 2);
    const drip = 0.07 * (0.5 + 0.5 * Math.sin(angle * 9));
    return new THREE.Vector3(center.x + Math.cos(angle) * (radius + 0.01), center.y + height - random(0, drip), center.z + Math.sin(angle) * (radius + 0.01));
  };
  const label = String(age);
  const size = { width: 0.13, height: 0.26, gap: 0.07 };
  const labelWidth = label.length * size.width + (label.length - 1) * size.gap;
  const candles = new THREE.Vector3(center.x - labelWidth / 2, center.y + height + 0.02, center.z + 0.15);
  const flames = [...label].map((_, i) => new THREE.Vector3(candles.x + i * (size.width + size.gap) + size.width / 2, candles.y + size.height + 0.09, candles.z));
  return [
    [650, () => ({ point: side(), weight: 0.8 })],
    [350, () => ({ point: top(), weight: 0.7 })],
    [300, () => ({ point: icing(), weight: 1.3 })],
    [380, () => ({ point: digitsAt(label, candles, size)(), weight: 1.4 })],
    // little teardrop flames: squashed spheres, taller than wide
    [120, () => ({ point: randomDirection(new THREE.Vector3()).multiply(new THREE.Vector3(0.045, 0.072, 0.045)).add(pick(flames)), weight: 1.5 })],
  ];
}

function ageThisYear() {
  const year = Number(new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Bangkok', year: 'numeric' }).format(new Date()));
  return year - BIRTH_YEAR;
}

// --- poses ---

// `motion` and `animation` work as in showcase.js
export const OCCASION_POSES = {
  yearEnd: {
    build: (pug, borrowed) =>
      repose(pug, { head: headPose(0, 0, 0.06), props: assignProps(borrowed, [...santaHat(), ...snowfall(650)]) }),
    motion: { hop: 0.6, chew: 0, shiver: 0 },
    animation: 'pug',
    sound: { cue: 'jingleBells', ambience: 'sleighBells' },
    boops: ['Merry Christmas!', 'สิ้นปีแล้ว!', 'ขอของขวัญหน่อย'],
  },
  newYear: {
    build: (pug, borrowed) =>
      repose(pug, {
        head: headPose(-0.06, 0),
        props: assignProps(borrowed, [
          ...partyHat(),
          ...fireworks(
            [
              { center: new THREE.Vector3(1.75, 0.95, 0), radius: 0.45 },
              { center: new THREE.Vector3(-1.15, 1.2, -0.2), radius: 0.3 },
              { center: new THREE.Vector3(1.95, 0.05, 0), radius: 0.28 },
            ],
            1500,
          ),
          ...confetti(700),
        ]),
      }),
    motion: { hop: 1, chew: 0, shiver: 0 },
    animation: 'pug',
    sound: { cue: 'newYear', ambience: 'fireworks' },
    boops: ['สวัสดีปีใหม่!', 'Happy New Year!', 'ปีนี้ขอขนมเยอะ ๆ'],
  },
  songkran: {
    build: (pug, borrowed) => repose(pug, { head: headPose(-0.04, 0), eyes: closedEyes(-0.1), props: assignProps(borrowed, waterBowlPour()) }),
    motion: { hop: 0.5, chew: 0, shiver: 0 },
    animation: 'pug',
    sound: { cue: 'splash', ambience: 'splashing' },
    boops: ['สาดน้ำ!', 'เย็นสบาย~', 'สุขสันต์วันสงกรานต์'],
  },
  halloween: {
    build: (pug, borrowed) =>
      repose(pug, {
        head: headPose(0, 0, -0.05),
        props: assignProps(borrowed, [
          ...witchHat(),
          ...pumpkin(new THREE.Vector3(1.68, -0.72, 0.4)),
          ...bats([{ x: 1.6, y: 0.95, size: 0.12 }, { x: 2.05, y: 0.45, size: 0.1 }], 300),
        ]),
      }),
    motion: { hop: 0, chew: 0, shiver: 0 },
    animation: 'pug',
    sound: { cue: 'spookyTune', ambience: 'spooky' },
    boops: ['Trick or treat!', 'ขอขนมไม่งั้นแกล้ง', 'บู้!'],
  },
  birthday: {
    build: (pug, borrowed) =>
      repose(pug, {
        head: headPose(-0.04, 0, 0.05),
        props: assignProps(borrowed, [...partyHat(), ...birthdayCake(new THREE.Vector3(1.62, -0.8, 0.5), ageThisYear()), ...confetti(700)]),
      }),
    motion: { hop: 1, chew: 0, shiver: 0 },
    animation: 'pug',
    sound: { cue: 'birthdaySong' },
    boops: ['HBD โอ๊ต!', `${ageThisYear()} แล้วนะ`, 'ขอเค้กชิ้นนึง', 'สุขสันต์วันเกิด!'],
  },
};
