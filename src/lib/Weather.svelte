<script>
  import { onMount } from 'svelte';
  import { onWeather } from './weather.js';
  import { WEATHER_ICONS } from './weatherIcons.js';

  let weather = $state(null);

  onMount(() => onWeather((next) => (weather = next)));

  const temperature = $derived(weather?.temperature ?? '--');
</script>

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

  @media (prefers-reduced-motion: reduce) {
    .weather,
    .spin {
      animation: none;
    }
  }
</style>
