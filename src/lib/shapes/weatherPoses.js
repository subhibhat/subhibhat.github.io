import * as THREE from 'three';
import { assignProps, closedEyes, headPose, repose, scaredEyes } from './poses.js';
import { alongPolyline, onSphere, pick, random, randomDirection } from './random.js';

// Khai Tun reacting to the weather wherever Oat is today. Props borrow fur from the back of his head.

const RAIN_SPEED = 2.4;
const DRIZZLE_SPEED = 1.3;
const STORM_SPEED = 3.4;
const SNOW_SPEED = 0.35;

// --- props ---

function sunglasses() {
  const lens = (x) => {
    // squarish lens: superellipse filled edge to edge
    let u, v;
    do {
      u = random(-1, 1);
      v = random(-1, 1);
    } while (u ** 4 + v ** 4 > 1);
    return new THREE.Vector3(x + u * 0.3, 0.24 + v * 0.2, 1.26);
  };
  const frame = (x) => {
    const angle = random(0, Math.PI * 2);
    const c = Math.cos(angle);
    const s = Math.sin(angle);
    const r = 1 / (c ** 4 + s ** 4) ** 0.25;
    return new THREE.Vector3(x + c * r * 0.31, 0.24 + s * r * 0.21, 1.27);
  };
  return [
    [1300, () => ({ point: lens(pick([-0.5, 0.5])), weight: 1.3 })],
    [320, () => ({ point: frame(pick([-0.5, 0.5])), weight: 1.6 })],
    [90, () => ({ point: alongPolyline([[-0.2, 0.3, 1.27], [0.2, 0.3, 1.27]], 0.02), weight: 1.6 })],
    [300, () => ({ point: alongPolyline(pick([[[0.8, 0.28, 1.15], [1.14, 0.36, 0.35]], [[-0.8, 0.28, 1.15], [-1.14, 0.36, 0.35]]]), 0.02), weight: 1.2 })],
  ];
}

function sun(center, count) {
  const rays = Array.from({ length: 8 }, (_, i) => (i / 8) * Math.PI * 2);
  const ray = () => {
    const angle = pick(rays);
    const r = random(0.3, 0.42);
    return new THREE.Vector3(center.x + Math.cos(angle) * r, center.y + Math.sin(angle) * r, center.z);
  };
  return [
    [Math.round(count * 0.6), () => ({ point: onSphere(center, 0.2), weight: 1.2 })],
    [Math.round(count * 0.4), () => ({ point: ray(), weight: 1.2 })],
  ];
}

function crescentMoon(center, count) {
  const cut = new THREE.Vector3(0.13, 0.08, 0);
  const point = () => {
    let p;
    do {
      p = new THREE.Vector3(random(-0.3, 0.3), random(-0.3, 0.3), random(-0.04, 0.04));
    } while (p.x ** 2 + p.y ** 2 > 0.09 || (p.x - cut.x) ** 2 + (p.y - cut.y) ** 2 < 0.068);
    return p.add(center);
  };
  return [[count, () => ({ point: point(), weight: 1.3 })]];
}

// four-pointed sparkles
function stars(positions, count) {
  const point = () => {
    const [x, y, size] = pick(positions);
    const horizontal = Math.random() < 0.5;
    const t = random(-1, 1) * size * (1 - Math.abs(random(-1, 1)) * 0.3);
    return new THREE.Vector3(x + (horizontal ? t : 0), y + (horizontal ? 0 : t), 0);
  };
  return [[count, () => ({ point: point(), weight: 1.4 })]];
}

function cloud(center, scale, count) {
  const puffs = [
    [-0.36, 0, 0.28],
    [0, 0.12, 0.36],
    [0.38, 0, 0.28],
  ].map(([x, y, r]) => ({ center: new THREE.Vector3(x, y, 0).multiplyScalar(scale).add(center), radius: r * scale }));
  const flatBottom = center.y - 0.12 * scale;
  const point = () => {
    // outside of the union of puffs, with a flat base
    for (;;) {
      const puff = pick(puffs);
      const p = onSphere(puff.center, puff.radius);
      if (p.y < flatBottom) p.y = flatBottom;
      if (!puffs.some((other) => other !== puff && p.distanceTo(other.center) < other.radius * 0.98)) return p;
    }
  };
  return [[count, () => ({ point: point(), weight: 0.95 })]];
}

// A little umbrella worn as a hat: scalloped dome, ribs and a tip
function umbrellaHat() {
  const apex = new THREE.Vector3(0, 1.42, 0.1);
  const canopy = () => {
    const direction = randomDirection(new THREE.Vector3());
    direction.y = Math.abs(direction.y);
    const scallop = 0.06 * Math.abs(Math.sin(Math.atan2(direction.z, direction.x) * 4)) * (1 - direction.y);
    return new THREE.Vector3(direction.x * 1.18, 1.06 + direction.y * 0.36 - scallop, 0.1 + direction.z * 1.18);
  };
  const rib = () => {
    const angle = (Math.floor(Math.random() * 8) / 8) * Math.PI * 2;
    const t = Math.random();
    const x = Math.cos(angle) * 1.18 * Math.sin((t * Math.PI) / 2);
    const z = Math.sin(angle) * 1.18 * Math.sin((t * Math.PI) / 2);
    return new THREE.Vector3(x, 1.06 + 0.36 * Math.cos((t * Math.PI) / 2), 0.1 + z);
  };
  return [
    [1300, () => ({ point: canopy(), weight: 0.95 })],
    [280, () => ({ point: rib(), weight: 1.3 })],
    [60, () => ({ point: onSphere(apex, 0.05), weight: 1.5 })],
  ];
}

// Streaks of rain around (not under) the umbrella; each streak is a few particles falling together
function rain({ streaks, length, speed }) {
  const particlesPerStreak = 5;
  const heads = Array.from({ length: streaks }, () => {
    const side = pick([-1, 1]);
    return new THREE.Vector3(side * random(1.25, 2.1), random(-1.7, 1.7), random(-0.4, 1.3));
  });
  let n = 0;
  const point = () => {
    const head = heads[Math.floor(n / particlesPerStreak) % heads.length];
    const along = (n++ % particlesPerStreak) / (particlesPerStreak - 1);
    return { point: head.clone().add(new THREE.Vector3(0, along * length, 0)), weight: 0.85, fall: speed };
  };
  return [[streaks * particlesPerStreak, point]];
}

function lightningBolt(count) {
  const bolt = [
    [1.72, 1.3, 0.3],
    [1.52, 0.85, 0.3],
    [1.8, 0.78, 0.3],
    [1.55, 0.2, 0.3],
  ];
  return [[count, () => ({ point: alongPolyline(bolt, 0.04), weight: 1.6 })]];
}

function fogBands(count) {
  const bands = [-0.7, -0.15, 0.45, 1.0];
  const point = () => {
    const x = random(-2, 2.1);
    const y = pick(bands) + 0.07 * Math.sin(x * 2.6) + random(-0.05, 0.05);
    return new THREE.Vector3(x, y, random(1.2, 1.6));
  };
  return [[count, () => ({ point: point(), weight: 0.35 })]];
}

export function snowfall(count) {
  const point = () => new THREE.Vector3(random(-2.1, 2.1), random(-1.7, 1.7), random(-0.5, 1.5));
  return [[count, () => ({ point: point(), weight: 1.1, fall: SNOW_SPEED })]];
}

function scarf(count) {
  const ring = () => {
    const angle = random(0, Math.PI * 2);
    const tube = randomDirection(new THREE.Vector3()).multiplyScalar(0.1);
    return new THREE.Vector3(Math.cos(angle) * 0.82, -0.98, 0.25 + Math.sin(angle) * 0.7).add(tube);
  };
  const tail = () => alongPolyline([[0.45, -1.0, 0.95], [0.6, -1.45, 1.05]], 0.08);
  return [
    [Math.round(count * 0.8), () => ({ point: ring(), weight: 1 })],
    [Math.round(count * 0.2), () => ({ point: tail(), weight: 1 })],
  ];
}

// Knitted beanie: ribbed dome over the top of the head, a folded brim and a pom-pom
function beanie(count) {
  const crown = () => {
    const direction = randomDirection(new THREE.Vector3());
    direction.y = 0.12 + Math.abs(direction.y) * 0.88;
    direction.normalize();
    const point = new THREE.Vector3(direction.x * 1.22, 0.66 + direction.y * 0.68, 0.05 + direction.z * 1.12);
    // ribs: alternating dense and faint stripes running up the hat
    const rib = Math.sin(Math.atan2(point.z, point.x) * 26) > 0;
    return { point, weight: rib ? 1.1 : 0.55 };
  };
  const brim = () => {
    const angle = random(0, Math.PI * 2);
    const tube = randomDirection(new THREE.Vector3()).multiplyScalar(0.08);
    return { point: new THREE.Vector3(Math.cos(angle) * 1.27, 0.72, 0.05 + Math.sin(angle) * 1.16).add(tube), weight: 1.2 };
  };
  const pomPom = () => ({ point: onSphere(new THREE.Vector3(0, 1.44, 0.05), 0.13 * Math.cbrt(Math.random())), weight: 1.3 });
  return [
    [Math.round(count * 0.66), crown],
    [Math.round(count * 0.24), brim],
    [Math.round(count * 0.1), pomPom],
  ];
}

// Foggy breath puffing out in front of his mouth
function breathPuffs(count) {
  return [
    ...cloud(new THREE.Vector3(0.62, -0.62, 1.45), 0.3, Math.round(count * 0.6)),
    ...cloud(new THREE.Vector3(0.95, -0.42, 1.45), 0.2, Math.round(count * 0.4)),
  ];
}

// --- poses ---

const LOOKING_UP = headPose(-0.16, 0);
const LOOKING_UP_TILTED = headPose(-0.14, 0, -0.08);
const UNDER_THE_WEATHER = headPose(0.06, -0.05);
const LEVEL = headPose(0, 0);

// `motion` and `animation` work as in showcase.js; `shiver` makes him tremble
export const WEATHER_POSES = {
  sunny: {
    build: (pug, borrowed) =>
      repose(pug, { head: headPose(-0.05, 0), props: assignProps(borrowed, [...sunglasses(), ...sun(new THREE.Vector3(1.75, 0.95, 0), 450)]) }),
    motion: { hop: 0.3, chew: 0, shiver: 0 },
    animation: 'pug',
    sound: { ambience: 'birds' },
    boops: ['ร้อนจัง', 'ขอแอร์หน่อย', 'เท่ป่ะล่ะ'],
  },
  night: {
    build: (pug, borrowed) =>
      repose(pug, {
        head: LOOKING_UP,
        props: assignProps(borrowed, [
          ...crescentMoon(new THREE.Vector3(1.72, 0.95, 0), 900),
          ...stars([[-1.15, 1.3, 0.07], [-0.4, 1.45, 0.06], [0.45, 1.42, 0.07], [2.05, 0.35, 0.06], [1.2, 1.3, 0.05], [2.1, 1.25, 0.05]], 500),
        ]),
      }),
    motion: { hop: 0, chew: 0, shiver: 0 },
    animation: 'pug',
    sound: { ambience: 'crickets' },
    boops: ['ดึกแล้วนะ', 'ดาวสวยจัง', 'ไม่ง่วงเลย'],
  },
  partly: {
    build: (pug, borrowed) =>
      repose(pug, {
        head: LOOKING_UP_TILTED,
        props: assignProps(borrowed, [...sun(new THREE.Vector3(1.4, 1.15, -0.2), 400), ...cloud(new THREE.Vector3(1.7, 0.92, 0.1), 0.8, 1400)]),
      }),
    motion: { hop: 0.15, chew: 0, shiver: 0 },
    animation: 'pug',
    sound: { ambience: 'birds' },
    boops: ['แดดบ้างเมฆบ้าง', 'เมฆเหมือนขนม', 'ร่ม ๆ ดี'],
  },
  cloudy: {
    build: (pug, borrowed) =>
      repose(pug, { head: LOOKING_UP_TILTED, props: assignProps(borrowed, cloud(new THREE.Vector3(1.6, 0.95, 0.1), 0.85, 1800)) }),
    motion: { hop: 0, chew: 0, shiver: 0 },
    animation: 'pug',
    sound: { ambience: 'breeze' },
    boops: ['ฟ้าครึ้ม ๆ', 'ฝนจะตกไหมนะ', 'เมฆเหมือนขนม'],
  },
  drizzle: {
    build: (pug, borrowed) =>
      repose(pug, {
        head: UNDER_THE_WEATHER,
        closeMouth: true,
        props: assignProps(borrowed, [...umbrellaHat(), ...rain({ streaks: 160, length: 0.1, speed: DRIZZLE_SPEED })]),
      }),
    motion: { hop: 0, chew: 0, shiver: 0 },
    animation: 'still',
    sound: { ambience: 'drizzle' },
    boops: ['ฝนปรอย ๆ', 'หมวกร่มเท่ป่ะ', 'ไม่อยากเปียก'],
  },
  rain: {
    build: (pug, borrowed) =>
      repose(pug, {
        head: UNDER_THE_WEATHER,
        closeMouth: true,
        props: assignProps(borrowed, [...umbrellaHat(), ...rain({ streaks: 280, length: 0.2, speed: RAIN_SPEED })]),
      }),
    motion: { hop: 0, chew: 0, shiver: 0 },
    animation: 'still',
    sound: { ambience: 'rain' },
    boops: ['ฝนตกแล้ว', 'ไม่อยากเปียก', 'หมวกร่มเท่ป่ะ'],
  },
  storm: {
    build: (pug, borrowed) =>
      repose(pug, {
        head: UNDER_THE_WEATHER,
        eyes: scaredEyes,
        closeMouth: true,
        props: assignProps(borrowed, [...umbrellaHat(), ...lightningBolt(350), ...rain({ streaks: 300, length: 0.26, speed: STORM_SPEED })]),
      }),
    motion: { hop: 0, chew: 0, shiver: 1 },
    animation: 'still',
    sound: { cue: 'thunder', ambience: 'storm' },
    boops: ['กลัวฟ้าร้อง', 'ตัวสั่นแล้ว', 'อยากกลับบ้าน'],
  },
  fog: {
    build: (pug, borrowed) => repose(pug, { head: LEVEL, eyes: closedEyes(0), props: assignProps(borrowed, fogBands(2400)) }),
    motion: { hop: 0, chew: 0, shiver: 0 },
    animation: 'still',
    sound: { ambience: 'wind' },
    boops: ['มองไม่เห็นเลย', 'หมอกลงแล้ว', 'ใครอยู่ตรงนั้น?'],
  },
  cold: {
    build: (pug, borrowed) =>
      repose(pug, {
        head: headPose(0.04, -0.04),
        closeMouth: true,
        props: assignProps(borrowed, [...beanie(2000), ...scarf(1000), ...breathPuffs(450)]),
      }),
    motion: { hop: 0, chew: 0, shiver: 0.5 },
    animation: 'still',
    sound: { cue: 'brr', ambience: 'wind' },
    boops: ['หนาวแล้วจ้า', 'หมวกไหมพรมอุ่นมาก', 'ขอผ้าห่มหน่อย'],
  },
  snow: {
    build: (pug, borrowed) =>
      repose(pug, {
        head: LEVEL,
        eyes: closedEyes(0.06),
        closeMouth: true,
        props: assignProps(borrowed, [...beanie(1700), ...scarf(900), ...snowfall(800)]),
      }),
    motion: { hop: 0, chew: 0, shiver: 0.6 },
    animation: 'still',
    sound: { cue: 'brr', ambience: 'wind' },
    boops: ['หนาวววว', 'หิมะ?! ในไทย?', 'ขอผ้าห่มหน่อย'],
  },
};

const POSE_FOR_CONDITION = {
  clear: 'sunny',
  clearNight: 'night',
  partly: 'partly',
  partlyNight: 'night',
  cloudy: 'cloudy',
  fog: 'fog',
  drizzle: 'drizzle',
  rain: 'rain',
  storm: 'storm',
  cold: 'cold',
  snow: 'snow',
};

export const weatherPoseFor = (condition) => WEATHER_POSES[POSE_FOR_CONDITION[condition]];
