<script>
  import { onMount } from 'svelte';
  import { CONDITIONS, onWeather, previewWeather } from './weather.js';
  import { WEATHER_ICONS } from './weatherIcons.js';

  // Dev-only: try Khai Tun's pose for every kind of weather without waiting for it to rain.
  let active = $state(null);

  onMount(() => onWeather((weather) => (active = weather.preview ? weather.condition : null)));
</script>

<div class="panel" role="group" aria-label="Weather preview (dev only)">
  <span class="title">weather test</span>
  <button class:active={active === null} onclick={() => previewWeather(null)}>live</button>
  {#each CONDITIONS as condition}
    <button class:active={active === condition} onclick={() => previewWeather(condition)} title={condition} aria-label={condition}>
      <svg viewBox="0 0 24 24" aria-hidden="true">
        {#each WEATHER_ICONS[condition].paths as d}
          <path {d} />
        {/each}
      </svg>
    </button>
  {/each}
</div>

<style>
  .panel {
    position: fixed;
    left: 50%;
    bottom: 12px;
    z-index: 3;
    transform: translateX(-50%);
    display: flex;
    align-items: center;
    gap: 4px;
    max-width: calc(100vw - 24px);
    overflow-x: auto;
    padding: 6px 8px;
    border: 1px dashed var(--line);
    border-radius: 999px;
    background: color-mix(in srgb, var(--bg) 85%, transparent);
    backdrop-filter: blur(8px);
    font-family: var(--mono);
    font-size: 11px;
    color: var(--muted);
  }

  .title {
    padding: 0 6px;
    white-space: nowrap;
  }

  button {
    display: grid;
    place-items: center;
    min-width: 30px;
    height: 30px;
    padding: 0 6px;
    border: 1px solid transparent;
    border-radius: 999px;
    background: none;
    color: var(--fg);
    font: inherit;
    cursor: pointer;
  }

  button:hover {
    border-color: var(--line);
  }

  button.active {
    background: var(--fg);
    color: var(--bg);
  }

  svg {
    width: 16px;
    height: 16px;
    fill: none;
    stroke: currentColor;
    stroke-width: 1.5;
    stroke-linecap: round;
    stroke-linejoin: round;
  }
</style>
