<script>
  import { onMount } from 'svelte';
  import * as THREE from 'three';

  let canvas;

  const PARTICLE_COUNT = 9000;
  const SPHERE_RADIUS = 1.6;

  const vertexShader = /* glsl */ `
    uniform float uTime;
    uniform float uPixelRatio;
    uniform vec2 uPointer;
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

    void main() {
      vec3 dir = normalize(position);
      float n = snoise(dir * 1.4 + vec3(uTime * 0.12, uPointer * 0.6));
      float wave = sin(dir.y * 6.0 + uTime * 0.8 + aSeed * 6.2831) * 0.02;
      vec3 displaced = position + dir * (n * 0.28 + wave);

      vec4 mvPosition = modelViewMatrix * vec4(displaced, 1.0);
      gl_Position = projectionMatrix * mvPosition;

      float size = mix(1.2, 2.6, aSeed) * (0.8 + n * 0.5);
      gl_PointSize = size * uPixelRatio * (4.0 / -mvPosition.z);

      // fade the back of the sphere for depth
      vAlpha = smoothstep(-2.2, 1.4, mvPosition.z + 5.0) * (0.5 + 0.5 * aSeed);
    }
  `;

  const fragmentShader = /* glsl */ `
    uniform vec3 uColor;
    varying float vAlpha;

    void main() {
      float d = length(gl_PointCoord - 0.5);
      if (d > 0.5) discard;
      float soft = smoothstep(0.5, 0.0, d);
      gl_FragColor = vec4(uColor, soft * vAlpha);
    }
  `;

  function fibonacciSphere(count, radius) {
    const positions = new Float32Array(count * 3);
    const seeds = new Float32Array(count);
    const goldenAngle = Math.PI * (3 - Math.sqrt(5));
    for (let i = 0; i < count; i++) {
      const y = 1 - (i / (count - 1)) * 2;
      const ring = Math.sqrt(1 - y * y);
      const theta = goldenAngle * i;
      positions[i * 3] = Math.cos(theta) * ring * radius;
      positions[i * 3 + 1] = y * radius;
      positions[i * 3 + 2] = Math.sin(theta) * ring * radius;
      seeds[i] = Math.random();
    }
    return { positions, seeds };
  }

  function readForegroundColor() {
    const value = getComputedStyle(document.documentElement).getPropertyValue('--fg').trim();
    return new THREE.Color(value || '#f2f2f0');
  }

  onMount(() => {
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    // App toggles `data-theme` on <html>; follow it so particles match the text color
    const themeObserver = new MutationObserver(() => {
      uniforms.uColor.value = readForegroundColor();
    });

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 100);
    camera.position.set(0, 0, 5);

    const { positions, seeds } = fibonacciSphere(PARTICLE_COUNT, SPHERE_RADIUS);
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 1));

    const uniforms = {
      uTime: { value: 0 },
      uPixelRatio: { value: renderer.getPixelRatio() },
      uPointer: { value: new THREE.Vector2() },
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
    scene.add(points);

    const pointer = new THREE.Vector2();
    const smoothPointer = new THREE.Vector2();

    function onPointerMove(event) {
      pointer.set((event.clientX / window.innerWidth) * 2 - 1, -(event.clientY / window.innerHeight) * 2 + 1);
    }

    function resize() {
      const { innerWidth: width, innerHeight: height } = window;
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      // shift the sphere right on wide screens so it sits beside the text
      const aspect = width / height;
      const wide = width > 900;
      // shrink on narrow or short viewports so the sphere never crops
      const fit = Math.max(0.6, Math.min(1, aspect / (wide ? 1.4 : 0.9)));
      points.position.x = wide ? Math.min(1.1 * aspect * 0.5, 1.6) : 0;
      points.position.y = wide ? 0 : 0.45;
      points.scale.setScalar((wide ? 0.9 : 0.75) * fit);
      camera.updateProjectionMatrix();
    }

    const start = performance.now();
    let frame = 0;

    function render() {
      const elapsed = (performance.now() - start) / 1000;
      const speed = reducedMotion.matches ? 0.15 : 1;
      smoothPointer.lerp(pointer, 0.04);

      uniforms.uTime.value = elapsed * speed;
      uniforms.uPointer.value.copy(smoothPointer);
      points.rotation.y = elapsed * 0.06 * speed + smoothPointer.x * 0.35;
      points.rotation.x = -smoothPointer.y * 0.25;

      renderer.render(scene, camera);
      frame = requestAnimationFrame(render);
    }

    resize();
    render();
    window.addEventListener('resize', resize);
    window.addEventListener('pointermove', onPointerMove);
    themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('resize', resize);
      window.removeEventListener('pointermove', onPointerMove);
      themeObserver.disconnect();
      geometry.dispose();
      material.dispose();
      renderer.dispose();
    };
  });
</script>

<canvas bind:this={canvas} aria-hidden="true"></canvas>

<style>
  canvas {
    position: fixed;
    inset: 0;
    width: 100vw;
    height: 100vh;
    height: 100dvh;
    display: block;
  }
</style>
