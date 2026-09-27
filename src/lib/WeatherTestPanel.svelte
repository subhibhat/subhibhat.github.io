<script>
  import { onMount } from 'svelte';
  import { OCCASIONS, onOccasion, previewOccasion } from './occasions.js';
  import { CONDITIONS, onWeather, previewWeather } from './weather.js';
  import { WEATHER_ICONS } from './weatherIcons.js';

  // Dev-only: try Khai Tun's pose for every kind of weather and special day without waiting for them.
  let weather = $state(null);
  let occasion = $state(undefined);

  onMount(() => {
    const stopWeather = onWeather((next) => (weather = next.preview ? next.condition : null));
    const stopOccasion = onOccasion((next) => (occasion = next.preview ? next.key : undefined));
    return () => {
      stopWeather();
      stopOccasion();
    };
  });
</script>

<div class="panel" aria-label="Previews (dev only)">
  <div class="group" role="group" aria-label="Weather preview">
    <span class="title">weather</span>
    <button class:active={weather === null} onclick={() => previewWeather(null)}>live</button>
    {#each CONDITIONS as condition}
      <button class:active={weather === condition} onclick={() => previewWeather(condition)} title={condition} aria-label={condition}>
        <svg viewBox="0 0 24 24" aria-hidden="true">
          {#each WEATHER_ICONS[condition].paths as d}
            <path {d} />
          {/each}
        </svg>
      </button>
    {/each}
  </div>

  <span class="divider" aria-hidden="true"></span>

  <div class="group" role="group" aria-label="Special day preview">
    <span class="title">day</span>
    <button class:active={occasion === undefined} onclick={() => previewOccasion(undefined)}>today</button>
    <button class:active={occasion === null} onclick={() => previewOccasion(null)}>ordinary</button>
    {#each OCCASIONS as { key, label }}
      <button class:active={occasion === key} onclick={() => previewOccasion(key)}>{label}</button>
    {/each}
  </div>
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
    /* stays clear of the © and social links on desktop; scrolls sideways when it doesn't fit */
    max-width: min(calc(100vw - 24px), max(56vw, 640px));
    overflow-x: auto;
    scrollbar-width: thin;
    padding: 6px 8px;
    border: 1px dashed var(--line);
    border-radius: 999px;
    background: color-mix(in srgb, var(--bg) 85%, transparent);
    backdrop-filter: blur(8px);
    font-family: var(--mono);
    font-size: 11px;
    color: var(--muted);
  }

  .group {
    flex: none;
    display: flex;
    align-items: center;
    gap: 4px;
  }

  .divider {
    flex: none;
    width: 1px;
    height: 18px;
    margin: 0 4px;
    background: var(--line);
  }

  .title {
    padding: 0 6px;
    white-space: nowrap;
  }

  button {
    flex: none;
    display: grid;
    place-items: center;
    min-width: 30px;
    height: 28px;
    padding: 0 8px;
    border: 1px solid transparent;
    border-radius: 999px;
    background: none;
    color: var(--fg);
    font: inherit;
    white-space: nowrap;
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
