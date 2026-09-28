<script>
  import { onMount } from 'svelte';
  import * as THREE from 'three';
  import { EYE_CENTER_Y, PART } from './shapes/pug.js';
  import { onOccasion } from './occasions.js';
  import { createShowcase, OCCASION_INDEX, PUG_INDEX, WEATHER_INDEX } from './shapes/showcase.js';
  import { playBoop, setSoundScene } from './sound/index.js';
  import { onWeather } from './weather.js';

  // `stage()` returns { top, bottom } in pixels: the free space he should fit into on portrait screens
  let { stage = null } = $props();

  let canvas;
  let bubbles = $state([]);

  const BUBBLE_MS = 1400;
  const BLINK_SECONDS = 0.18;
  const BOOP_DECAY = 0.9;
  const HOP_HEIGHT = 0.09;
  const HOP_SPEED = 9;
  const CHEW_ANGLE = 0.05;
  const CHEW_SPEED = 10;
  const SHIVER_AMOUNT = 0.014;
  const SHIVER_SPEED = 47;
  // falling rain/snow wraps within this band (pug-local units)
  const FALL_TOP = 1.7;
  const FALL_HEIGHT = 3.4;
  // portrait layout: how much room (pug-local units) he and his hats/props need, and breathing space in px
  const SHAPE_RADIUS = 1.55;
  const SHAPE_HALF_WIDTH = 1.4;
  const STAGE_PADDING = 16;
  const LANDSCAPE_ASPECT = 1.2;
  const HIT_CENTER = new THREE.Vector3(0, 0, 0.3);
  const HIT_EDGE = new THREE.Vector3(1.3, 0, 0.3);

  const vertexShader = /* glsl */ `
    uniform float uTime;
    uniform float uPixelRatio;
    uniform float uProgress;
    uniform float uSwing;
    uniform float uBlink;
    uniform float uBoop;
    uniform float uFromPug;
    uniform float uToPug;
    attribute vec3 aFrom;
    attribute vec3 aTo;
    attribute float aWeightFrom;
    attribute float aWeightTo;
    attribute float aFallFrom;
    attribute float aFallTo;
    attribute float aPart;
    attribute float aSeed;
    varying float vAlpha;

    // Ashima 3D simplex noise
    vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
    vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
    vec4 permute(vec4 x) { return mod289(((x * 34.0) + 1.0) * x); }
    vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }
    float snoise(vec3 v) {
      const vec2 C = vec2(1.0 / 6.0, 1.0 / 3.0);
      const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
      vec3 i = floor(v + dot(v, C.yyy));
      vec3 x0 = v - i + dot(i, C.xxx);
      vec3 g = step(x0.yzx, x0.xyz);
      vec3 l = 1.0 - g;
      vec3 i1 = min(g.xyz, l.zxy);
      vec3 i2 = max(g.xyz, l.zxy);
      vec3 x1 = x0 - i1 + C.xxx;
      vec3 x2 = x0 - i2 + C.yyy;
      vec3 x3 = x0 - D.yyy;
      i = mod289(i);
      vec4 p = permute(permute(permute(
        i.z + vec4(0.0, i1.z, i2.z, 1.0))
        + i.y + vec4(0.0, i1.y, i2.y, 1.0))
        + i.x + vec4(0.0, i1.x, i2.x, 1.0));
      float n_ = 0.142857142857;
      vec3 ns = n_ * D.wyz - D.xzx;
      vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
      vec4 x_ = floor(j * ns.z);
      vec4 y_ = floor(j - 7.0 * x_);
      vec4 x = x_ * ns.x + ns.yyyy;
      vec4 y = y_ * ns.x + ns.yyyy;
      vec4 h = 1.0 - abs(x) - abs(y);
      vec4 b0 = vec4(x.xy, y.xy);
      vec4 b1 = vec4(x.zw, y.zw);
      vec4 s0 = floor(b0) * 2.0 + 1.0;
      vec4 s1 = floor(b1) * 2.0 + 1.0;
      vec4 sh = -step(h, vec4(0.0));
      vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
      vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;
      vec3 p0 = vec3(a0.xy, h.x);
      vec3 p1 = vec3(a0.zw, h.y);
      vec3 p2 = vec3(a1.xy, h.z);
      vec3 p3 = vec3(a1.zw, h.w);
      vec4 norm = taylorInvSqrt(vec4(dot(p0, p0), dot(p1, p1), dot(p2, p2), dot(p3, p3)));
      p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
      vec4 m = max(0.6 - vec4(dot(x0, x0), dot(x1, x1), dot(x2, x2), dot(x3, x3)), 0.0);
      m = m * m;
      return 42.0 * dot(m * m, vec4(dot(p0, x0), dot(p1, x1), dot(p2, x2), dot(p3, x3)));
    }

    bool isPart(float part) { return abs(aPart - part) < 0.5; }

    // Khai Tun blinks, flops his ears and pants
    vec3 animatePug(vec3 p) {
      if (isPart(${PART.EYE.toFixed(1)})) {
        p.y = ${EYE_CENTER_Y.toFixed(2)} + (p.y - ${EYE_CENTER_Y.toFixed(2)}) * mix(0.06, 1.0, uBlink);
      }
      if (isPart(${PART.EAR.toFixed(1)})) {
        // the lower the particle on the flap, the further it swings from the hinge
        float reach = max(0.0, 0.95 - p.y);
        float flop = sin(uTime * 2.2 + sign(p.x));
        p.y += flop * 0.05 * reach;
        p.x += sign(p.x) * flop * 0.03 * reach;
      }
      if (isPart(${PART.TONGUE.toFixed(1)})) {
        float drop = max(0.0, -0.6 - p.y);
        float pant = 0.5 + 0.5 * sin(uTime * 7.0);
        p.y -= pant * drop * 0.25;
        p.z += pant * drop * 0.1;
      }
      return p;
    }

    // rain and snow fall at \`fall\` units a second and wrap back to the top
    vec3 animateFalling(vec3 p, float fall) {
      p.y = ${FALL_TOP.toFixed(1)} - mod(${FALL_TOP.toFixed(1)} - p.y + uTime * fall, ${FALL_HEIGHT.toFixed(1)});
      // snowflakes drift from side to side as they fall
      if (fall < 1.0) p.x += sin(uTime * 1.3 + aSeed * 6.2831 + p.y * 2.0) * 0.06;
      return p;
    }

    vec3 animate(vec3 p, float isPug, float fall) {
      if (fall > 0.0) return animateFalling(p, fall);
      if (isPug > 0.5) p = animatePug(p);
      // breathing + a little fuzz so every shape feels soft
      p *= 1.0 + sin(uTime * 1.6) * 0.012;
      return p + normalize(p + 1e-4) * snoise(p * 2.2 + uTime * 0.3) * 0.02;
    }

    void main() {
      float local = smoothstep(0.0, 1.0, clamp(uProgress * 1.6 - aSeed * 0.6, 0.0, 1.0));
      vec3 displaced = mix(animate(aFrom, uFromPug, aFallFrom), animate(aTo, uToPug, aFallTo), local);
      vec3 outward = normalize(displaced + 1e-4);

      // particles swing outwards mid-flight (a lot when hatching), then settle into the new shape
      displaced += outward * sin(local * 3.14159) * uSwing * (0.4 + 0.8 * aSeed);
      // a boop scatters them, then they spring back
      displaced += outward * uBoop * (0.25 + 0.6 * aSeed) * (1.0 + snoise(displaced * 3.0));

      vec4 mvPosition = modelViewMatrix * vec4(displaced, 1.0);
      gl_Position = projectionMatrix * mvPosition;

      float weight = mix(aWeightFrom, aWeightTo, local);
      float size = mix(1.3, 2.6, aSeed) * (0.7 + 0.6 * weight);
      gl_PointSize = size * uPixelRatio * (4.0 / -mvPosition.z);

      float depthFade = smoothstep(-2.4, 1.4, mvPosition.z + 5.0);
      vAlpha = depthFade * (0.45 + 0.55 * aSeed) * (0.3 + 0.7 * weight);
    }
  `;

  const fragmentShader = /* glsl */ `
    uniform vec3 uColor;
    varying float vAlpha;

    void main() {
      float d = length(gl_PointCoord - 0.5);
      if (d > 0.5) discard;
      float soft = smoothstep(0.5, 0.0, d);
      gl_FragColor = vec4(uColor, soft * min(vAlpha, 1.0));
    }
  `;

  function readForegroundColor() {
    const value = getComputedStyle(document.documentElement).getPropertyValue('--fg').trim();
    return new THREE.Color(value || '#f2f2f0');
  }

  function nextBlinkDelay() {
    return 2.5 + Math.random() * 3;
  }

  // 1 = eyes open, 0 = closed; a quick sine dip per blink
  function blinkAmount(elapsed, blinkAt) {
    const phase = (elapsed - blinkAt) / BLINK_SECONDS;
    return phase > 0 && phase < 1 ? 1 - Math.sin(phase * Math.PI) : 1;
  }

  onMount(() => {
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 100);
    camera.position.set(0, 0, 5);

    const showcase = createShowcase();
    const { count, parts, steps, shapes } = showcase;
    const seeds = Float32Array.from({ length: count }, Math.random);

    const fromPositions = new THREE.BufferAttribute(new Float32Array(count * 3), 3);
    const toPositions = new THREE.BufferAttribute(new Float32Array(count * 3), 3);
    const fromWeights = new THREE.BufferAttribute(new Float32Array(count), 1);
    const toWeights = new THREE.BufferAttribute(new Float32Array(count), 1);
    const fromFalls = new THREE.BufferAttribute(new Float32Array(count), 1);
    const toFalls = new THREE.BufferAttribute(new Float32Array(count), 1);

    const geometry = new THREE.BufferGeometry();
    // `position` is only used for bounds; the shader reads aFrom/aTo
    geometry.setAttribute('position', fromPositions);
    geometry.setAttribute('aFrom', fromPositions);
    geometry.setAttribute('aTo', toPositions);
    geometry.setAttribute('aWeightFrom', fromWeights);
    geometry.setAttribute('aWeightTo', toWeights);
    geometry.setAttribute('aFallFrom', fromFalls);
    geometry.setAttribute('aFallTo', toFalls);
    geometry.setAttribute('aPart', new THREE.BufferAttribute(parts, 1));
    geometry.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 1));

    const uniforms = {
      uTime: { value: 0 },
      uPixelRatio: { value: renderer.getPixelRatio() },
      uProgress: { value: 0 },
      uBlink: { value: 1 },
      uBoop: { value: 0 },
      uSwing: { value: 0 },
      uFromPug: { value: 0 },
      uToPug: { value: 0 },
      uColor: { value: readForegroundColor() },
    };

    const material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms,
      transparent: true,
      depthWrite: false,
    });

    const points = new THREE.Points(geometry, material);
    points.frustumCulled = false;
    scene.add(points);

    // App toggles `data-theme` on <html>; follow it so particles match the text color
    const themeObserver = new MutationObserver(() => {
      uniforms.uColor.value = readForegroundColor();
    });

    const isPug = (step) => (step.animation === 'pug' ? 1 : 0);

    // `fromStep` is a snapshot, so a step can be rebuilt (new weather) while it is on screen
    let fromStep = steps[PUG_INDEX];
    let toIndex = 0;
    let transitionStart = 0;
    let weatherKnown = false;
    let occasionToday = null;

    function morphTo(nextIndex, elapsed, leaving = steps[toIndex]) {
      fromStep = leaving;
      toIndex = nextIndex;
      transitionStart = elapsed;

      // the new move starts from wherever the last one was headed
      fromPositions.array.set(toPositions.array);
      fromWeights.array.set(toWeights.array);
      fromFalls.array.set(toFalls.array);
      toPositions.array.set(shapes[toIndex].positions);
      toWeights.array.set(shapes[toIndex].weights);
      toFalls.array.set(shapes[toIndex].falls);
      for (const attribute of [fromPositions, toPositions, fromWeights, toWeights, fromFalls, toFalls]) attribute.needsUpdate = true;

      uniforms.uFromPug.value = isPug(fromStep);
      uniforms.uToPug.value = isPug(steps[toIndex]);
      uniforms.uSwing.value = steps[toIndex].enter.swing;
      setSoundScene(steps[toIndex].sound);
    }

    // the special-day step only plays on special days, and the weather step once we know the weather
    function nextStep(index) {
      const next = (index + 1) % steps.length;
      const skip = (next === OCCASION_INDEX && !occasionToday) || (next === WEATHER_INDEX && !weatherKnown);
      return skip ? nextStep(next) : next;
    }

    const now = () => (performance.now() - start) / 1000;

    function onOccasionChange({ key, preview }) {
      if (reducedMotion.matches) return;
      const leaving = steps[toIndex];
      occasionToday = key;
      showcase.setOccasion(key);
      // previews show straight away; turning the preview off moves on if it was showing
      if (key && (preview || toIndex === OCCASION_INDEX)) morphTo(OCCASION_INDEX, now(), leaving);
      else if (!key && toIndex === OCCASION_INDEX) morphTo(nextStep(OCCASION_INDEX), now(), leaving);
    }

    function onWeatherChange(weather) {
      // the visitor switched weather off: skip the weather step from now on
      if (!weather) {
        weatherKnown = false;
        return;
      }
      const { condition, preview } = weather;
      if (reducedMotion.matches) return;
      const firstReading = !weatherKnown;
      const leaving = steps[toIndex];
      weatherKnown = true;
      showcase.setWeather(condition);
      // show it straight away when previewing, or if the page just opened on the weather step
      if (preview || (firstReading && toIndex === WEATHER_INDEX)) morphTo(WEATHER_INDEX, now(), leaving);
    }

    const pointer = new THREE.Vector2();
    const smoothPointer = new THREE.Vector2();

    function onPointerMove(event) {
      pointer.set((event.clientX / window.innerWidth) * 2 - 1, -(event.clientY / window.innerHeight) * 2 + 1);
    }

    function toScreen(localPoint) {
      const projected = points.localToWorld(localPoint.clone()).project(camera);
      return { x: ((projected.x + 1) / 2) * window.innerWidth, y: ((1 - projected.y) / 2) * window.innerHeight };
    }

    const boopCounts = new Map();
    let bubbleId = 0;

    function onBoop(event) {
      const center = toScreen(HIT_CENTER);
      const edge = toScreen(HIT_EDGE);
      const radius = Math.hypot(edge.x - center.x, edge.y - center.y);
      if (Math.hypot(event.clientX - center.x, event.clientY - center.y) > radius) return;

      uniforms.uBoop.value = 1;
      playBoop();
      const { boops } = uniforms.uProgress.value < 0.5 ? fromStep : steps[toIndex];
      const said = boopCounts.get(boops) ?? 0;
      boopCounts.set(boops, said + 1);
      const bubble = { id: bubbleId++, x: event.clientX, y: event.clientY, text: boops[said % boops.length] };
      bubbles = [...bubbles, bubble];
      setTimeout(() => (bubbles = bubbles.filter((other) => other.id !== bubble.id)), BUBBLE_MS);
    }

    function resize() {
      const { innerWidth: width, innerHeight: height } = window;
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      const aspect = width / height;

      // wide or landscape screens: Khai Tun sits to the right of the text
      if (width > 900 || aspect > LANDSCAPE_ASPECT) {
        baseX = Math.min(1.1 * aspect * 0.5, 1.6);
        baseY = 0;
        points.scale.setScalar(1.05 * Math.max(0.6, Math.min(1, aspect / 1.4)));
        return;
      }

      // portrait: fit him into the free space between the header and the text below
      const area = stage?.() ?? { top: height * 0.08, bottom: height * 0.5 };
      const top = area.top + STAGE_PADDING;
      const bottom = area.bottom - STAGE_PADDING;
      const halfHeight = camera.position.z * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
      const worldPerPixel = (2 * halfHeight) / height;
      const radius = Math.min((bottom - top) / 2 / SHAPE_RADIUS, (width / 2 - STAGE_PADDING) / SHAPE_HALF_WIDTH) * worldPerPixel;
      baseX = 0;
      baseY = halfHeight - ((top + bottom) / 2) * worldPerPixel;
      points.scale.setScalar(Math.min(radius, 1.05));
    }

    const start = performance.now();
    let baseX = 0;
    let baseY = 0;
    let previous = 0;
    let blinkAt = nextBlinkDelay();
    let frame = 0;

    function render() {
      const elapsed = (performance.now() - start) / 1000;
      const delta = elapsed - previous;
      previous = elapsed;
      const speed = reducedMotion.matches ? 0.15 : 1;

      // play each step of the story, hold it, then move on; with reduced motion Khai Tun just stays put
      const { enter, holdSeconds } = steps[toIndex];
      if (!reducedMotion.matches && elapsed - transitionStart > enter.seconds + holdSeconds) {
        morphTo(nextStep(toIndex), elapsed);
      }
      const progress = reducedMotion.matches ? 1 : Math.min(1, (elapsed - transitionStart) / steps[toIndex].enter.seconds);
      uniforms.uProgress.value = progress;

      if (elapsed > blinkAt + BLINK_SECONDS) {
        // now and then, a double blink
        blinkAt = elapsed + (Math.random() < 0.2 ? 0.12 : nextBlinkDelay());
      }

      smoothPointer.lerp(pointer, 0.05);
      uniforms.uTime.value = elapsed * speed;
      uniforms.uBlink.value = blinkAmount(elapsed, blinkAt);
      uniforms.uBoop.value *= Math.pow(1 - BOOP_DECAY, delta);

      // blend each pose's body motion in as the particles arrive
      const motion = (key) => THREE.MathUtils.lerp(fromStep.motion[key], steps[toIndex].motion[key], progress);
      // happy hops come in little bursts rather than nonstop
      const hopBurst = THREE.MathUtils.smoothstep(Math.sin(elapsed * 0.9), 0.2, 0.7);
      const hop = Math.abs(Math.sin(elapsed * HOP_SPEED * speed)) * HOP_HEIGHT * hopBurst * motion('hop');
      const chew = Math.sin(elapsed * CHEW_SPEED * speed) * CHEW_ANGLE * motion('chew');
      const shiver = Math.sin(elapsed * SHIVER_SPEED * speed) * SHIVER_AMOUNT * motion('shiver');

      // the pug turns to look at the cursor, with a slow curious tilt
      points.position.x = baseX + shiver;
      points.position.y = baseY + hop;
      points.rotation.y = smoothPointer.x * 0.6 + Math.sin(elapsed * 0.4 * speed) * 0.08;
      points.rotation.x = -smoothPointer.y * 0.35 + chew;
      points.rotation.z = Math.sin(elapsed * 0.5 * speed) * 0.05 - smoothPointer.x * 0.08;

      renderer.render(scene, camera);
      frame = requestAnimationFrame(render);
    }

    // the day starts with Khai Tun dressed up for a special day, or else checking the weather (he
    // looks like his playful self until it loads); with reduced motion he just sits there.
    // (morphTo shifts `toIndex` into `fromStep`.)
    toIndex = PUG_INDEX;
    const stopOccasion = onOccasion(onOccasionChange);
    toIndex = reducedMotion.matches ? PUG_INDEX : occasionToday ? OCCASION_INDEX : WEATHER_INDEX;
    morphTo(toIndex, 0);
    const stopWeather = onWeather(onWeatherChange);

    resize();
    // measure again once the page around us has mounted, and when the web fonts change the text height
    requestAnimationFrame(resize);
    document.fonts?.ready.then(resize);
    render();
    window.addEventListener('resize', resize);
    window.addEventListener('pointermove', onPointerMove);
    canvas.addEventListener('pointerdown', onBoop);
    themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

    return () => {
      cancelAnimationFrame(frame);
      stopWeather();
      stopOccasion();
      window.removeEventListener('resize', resize);
      window.removeEventListener('pointermove', onPointerMove);
      canvas.removeEventListener('pointerdown', onBoop);
      themeObserver.disconnect();
      geometry.dispose();
      material.dispose();
      renderer.dispose();
    };
  });
</script>

<canvas bind:this={canvas} aria-hidden="true"></canvas>

{#each bubbles as bubble (bubble.id)}
  <p class="bubble" style:left="{bubble.x}px" style:top="{bubble.y}px" aria-live="polite">{bubble.text}</p>
{/each}

<style>
  canvas {
    position: fixed;
    inset: 0;
    width: 100vw;
    height: 100vh;
    height: 100dvh;
    display: block;
  }

  .bubble {
    position: fixed;
    z-index: 2;
    pointer-events: none;
    white-space: nowrap;
    padding: 6px 12px;
    border-radius: 999px;
    background: var(--fg);
    color: var(--bg);
    font-family: var(--sans);
    font-size: 14px;
    animation: pop 1.4s cubic-bezier(0.2, 0.7, 0.1, 1) forwards;
  }

  @keyframes pop {
    0% {
      opacity: 0;
      transform: translate(-50%, -60%) scale(0.6);
    }
    15% {
      opacity: 1;
      transform: translate(-50%, -140%) scale(1.05);
    }
    70% {
      opacity: 1;
      transform: translate(-50%, -170%) scale(1);
    }
    100% {
      opacity: 0;
      transform: translate(-50%, -220%) scale(0.95);
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .bubble {
      animation-duration: 0.01s;
      animation-fill-mode: none;
      transform: translate(-50%, -150%);
    }
  }
</style>
