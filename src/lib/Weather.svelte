<script>
  import { onMount } from 'svelte';
  import { locationToday, onWeather, useVisitorLocation } from './weather.js';
  import { WEATHER_ICONS } from './weatherIcons.js';

  // Where Oat is today (Bangkok on weekdays, Sisaket at weekends) and the weather there, until the
  // visitor taps the place name and lets us use their location; then their province and weather.
  // No weather at all until the visitor allows it in their privacy choices.
  let weather = $state(null);
  let city = $state(locationToday().name);
  let here = $state(false);
  let locating = $state(false);

  async function locate() {
    locating = true;
    await useVisitorLocation();
    locating = false;
  }

  onMount(() =>
    onWeather((next) => {
      weather = next;
      city = next?.location ?? locationToday().name;
      here = next?.here ?? false;
    }),
  );

  const temperature = $derived(weather?.temperature ?? '--');
</script>

{#if here || !weather}
  <span>{city}<span class="country">, TH</span></span>
{:else}
  <button class="place" onclick={locate} disabled={locating} title="Show the weather where you are">
    {city}<span class="country">, TH</span>
  </button>
{/if}
{#if weather}
  <span class="weather" title={weather.label} aria-label="{weather.label}, {temperature} degrees Celsius">
    <svg viewBox="0 0 24 24" aria-hidden="true" class:spin={WEATHER_ICONS[weather.condition].spin}>
      {#each WEATHER_ICONS[weather.condition].paths as d}
        <path {d} />
      {/each}
    </svg>
    <span aria-hidden="true">{temperature}°</span>
  </span>
{/if}

<style>
  .weather {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    color: var(--fg);
    animation: appear 0.6s ease both;
  }

  .place {
    padding: 0;
    border: 0;
    background: none;
    color: inherit;
    font: inherit;
    letter-spacing: inherit;
    text-transform: inherit;
    text-decoration: underline dotted;
    text-decoration-color: color-mix(in srgb, currentColor 45%, transparent);
    text-underline-offset: 3px;
    cursor: pointer;
    pointer-events: auto;
  }

  .place:hover {
    text-decoration-color: currentColor;
  }

  .place:focus-visible {
    outline: 1px solid var(--fg);
    outline-offset: 3px;
  }

  .place:disabled {
    cursor: progress;
  }

  svg {
    width: 15px;
    height: 15px;
    fill: none;
    stroke: currentColor;
    stroke-width: 1.5;
    stroke-linecap: round;
    stroke-linejoin: round;
    overflow: visible;
  }

  .spin {
    animation: spin 24s linear infinite;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }

  @keyframes appear {
    from {
      opacity: 0;
      transform: translateY(-3px);
    }
  }

  @media (max-width: 420px) {
    .country {
      display: none;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .weather,
    .spin {
      animation: none;
    }
  }
</style>
