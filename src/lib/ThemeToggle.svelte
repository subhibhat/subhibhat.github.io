<script>
  import { rememberPreference } from './consent.js';

  const THEME_COLORS = { dark: '#0b0b0c', light: '#f4f3ef' };
  const REVEAL_DURATION_MS = 750;

  let theme = $state(document.documentElement.dataset.theme === 'light' ? 'light' : 'dark');
  let button;

  function applyTheme(next) {
    theme = next;
    document.documentElement.dataset.theme = next;
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', THEME_COLORS[next]);
    rememberPreference('theme', next);
  }

  function toggle() {
    const next = theme === 'dark' ? 'light' : 'dark';
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (!document.startViewTransition || reducedMotion) {
      applyTheme(next);
      return;
    }

    const { left, top, width, height } = button.getBoundingClientRect();
    const x = left + width / 2;
    const y = top + height / 2;
    const radius = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));

    const transition = document.startViewTransition(() => applyTheme(next));
    transition.ready.then(() => {
      document.documentElement.animate(
        { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${radius}px at ${x}px ${y}px)`] },
        {
          duration: REVEAL_DURATION_MS,
          easing: 'cubic-bezier(0.76, 0, 0.24, 1)',
          pseudoElement: '::view-transition-new(root)',
        },
      );
    });
  }
</script>

<button
  bind:this={button}
  class="toggle"
  class:light={theme === 'light'}
  onclick={toggle}
  aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
  title={theme === 'dark' ? 'Light mode' : 'Dark mode'}
>
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <mask id="moon-cutout">
      <rect width="24" height="24" fill="white" />
      <circle class="cutout" cx="17" cy="7" r="6" fill="black" />
    </mask>
    <circle class="core" cx="12" cy="12" r="8" mask="url(#moon-cutout)" />
    <g class="rays">
      <line x1="12" y1="1.5" x2="12" y2="3.5" />
      <line x1="12" y1="20.5" x2="12" y2="22.5" />
      <line x1="1.5" y1="12" x2="3.5" y2="12" />
      <line x1="20.5" y1="12" x2="22.5" y2="12" />
      <line x1="4.6" y1="4.6" x2="6" y2="6" />
      <line x1="18" y1="18" x2="19.4" y2="19.4" />
      <line x1="4.6" y1="19.4" x2="6" y2="18" />
      <line x1="18" y1="6" x2="19.4" y2="4.6" />
    </g>
  </svg>
</button>

<style>
  .toggle {
    display: grid;
    place-items: center;
    width: 40px;
    height: 40px;
    border: 1px solid var(--line);
    border-radius: 50%;
    background: transparent;
    color: var(--fg);
    cursor: pointer;
    pointer-events: auto;
    transition: transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1), border-color 0.3s;
  }

  .toggle:hover {
    border-color: var(--fg);
  }

  .toggle:active {
    transform: scale(0.88);
  }

  .toggle:focus-visible {
    outline: 1px solid var(--fg);
    outline-offset: 3px;
  }

  svg {
    width: 18px;
    height: 18px;
    overflow: visible;
    transition: transform 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
  }

  .core {
    fill: currentColor;
    transition: r 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
  }

  .cutout {
    transition: cx 0.5s ease, cy 0.5s ease;
  }

  .rays {
    stroke: currentColor;
    stroke-width: 2;
    stroke-linecap: round;
    transform-origin: 12px 12px;
    opacity: 0;
    transform: rotate(-90deg) scale(0.4);
    transition: opacity 0.3s, transform 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
  }

  /* Light mode shows the sun: shrink the core, slide the cutout away, bring the rays in */
  .light svg {
    transform: rotate(90deg);
  }

  .light .core {
    r: 5px;
  }

  .light .cutout {
    cx: 30px;
    cy: 0px;
  }

  .light .rays {
    opacity: 1;
    transform: none;
  }

  @media (prefers-reduced-motion: reduce) {
    .toggle,
    svg,
    .core,
    .cutout,
    .rays {
      transition: none;
    }
  }
</style>
