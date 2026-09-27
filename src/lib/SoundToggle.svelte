<script>
  import { onMount } from 'svelte';
  import { onSound, restoreSound, setSound } from './sound/index.js';

  let on = $state(false);

  onMount(() => {
    const stopListening = onSound((enabled) => (on = enabled));
    const stopRestoring = restoreSound();
    return () => {
      stopListening();
      stopRestoring();
    };
  });
</script>

<button
  class="toggle"
  class:on
  onclick={(event) => {
    // don't let this same click also count as the "first click" that restores sound
    event.stopPropagation();
    setSound(!on);
  }}
  aria-pressed={on}
  aria-label={on ? 'Turn sound off' : 'Turn sound on'}
  title={on ? 'Sound off' : 'Sound on'}
>
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M4 9.5h3l4.5-4v13l-4.5-4H4z" />
    <g class="waves">
      <path d="M15 9.5a3.5 3.5 0 0 1 0 5" />
      <path d="M17.5 7a7 7 0 0 1 0 10" />
    </g>
    <g class="muted">
      <path d="M15.5 9.5l5 5M20.5 9.5l-5 5" />
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
    fill: none;
    stroke: currentColor;
    stroke-width: 1.5;
    stroke-linecap: round;
    stroke-linejoin: round;
    overflow: visible;
  }

  .waves,
  .muted {
    transition: opacity 0.3s, transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
    transform-origin: 14px 12px;
  }

  .waves {
    opacity: 0;
    transform: scale(0.5);
  }

  .on .waves {
    opacity: 1;
    transform: none;
    animation: pulse 1.6s ease-in-out infinite;
  }

  .on .muted {
    opacity: 0;
    transform: scale(0.5);
  }

  @keyframes pulse {
    50% {
      opacity: 0.45;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .toggle,
    .waves,
    .muted {
      transition: none;
      animation: none;
    }
  }
</style>
