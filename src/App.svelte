<script>
  import { onMount } from 'svelte';
  // Khai Tun's day: weather → play → eat → sleep (see lib/shapes/showcase.js); './lib/SphereScene.svelte' is the original sphere alone
  import Scene from './lib/MorphScene.svelte';
  import ThemeToggle from './lib/ThemeToggle.svelte';
  import TypedName from './lib/TypedName.svelte';
  import Weather from './lib/Weather.svelte';
  import WeatherTestPanel from './lib/WeatherTestPanel.svelte';
  import { socials } from './lib/socials.js';

  let localTime = $state('');

  onMount(() => {
    const format = new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Asia/Bangkok',
      hour: '2-digit',
      minute: '2-digit',
    });
    const tick = () => (localTime = format.format(new Date()));
    tick();
    const timer = setInterval(tick, 10_000);
    return () => clearInterval(timer);
  });
</script>

<Scene />

<main>
  <header>
    <span class="mark">Oat</span>
    <div class="header-end">
      <span class="meta"><span>Sisaket<span class="country">, TH</span></span> <Weather /> <span class="dot"></span> {localTime} ICT</span>
      <ThemeToggle />
    </div>
  </header>

  <section class="hero">
    <p class="eyebrow">Developer — Go · Next.js · TypeScript</p>
    <TypedName lines={['Subhibhat', 'Srikam']} />
    <p class="lead">Hi, I'm Oat. I build quiet, useful software for the web — <br />usually with Khai Tun the pug snoring nearby.</p>
  </section>

  <footer>
    <span class="copy">© {new Date().getFullYear()}</span>

    <nav aria-label="Social links">
      {#each socials as social}
        <a href={social.url} target="_blank" rel="noreferrer" aria-label={social.label} title={social.label}>
          <svg viewBox="0 0 24 24" aria-hidden="true" class:filled={social.filled}>
            <path d={social.path} />
          </svg>
        </a>
      {/each}
    </nav>
  </footer>
</main>

{#if import.meta.env.DEV}
  <WeatherTestPanel />
{/if}

<style>
  main {
    position: relative;
    z-index: 1;
    height: 100vh;
    height: 100dvh;
    display: grid;
    grid-template-rows: auto 1fr auto;
    padding: clamp(16px, 3vw, 40px);
    pointer-events: none;
  }

  main a {
    pointer-events: auto;
  }

  header,
  footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 16px;
    font-family: var(--mono);
    font-size: 12px;
    letter-spacing: 0.02em;
    color: var(--muted);
  }

  .mark {
    color: var(--fg);
  }

  .header-end {
    display: flex;
    align-items: center;
    gap: 16px;
  }

  .meta {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    font-variant-numeric: tabular-nums;
  }

  .dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: #3ecf8e;
    animation: pulse 2.4s ease-in-out infinite;
  }

  .hero {
    align-self: center;
    max-width: 720px;
    animation: rise 1.2s cubic-bezier(0.2, 0.7, 0.1, 1) both;
  }

  .eyebrow {
    font-family: var(--mono);
    font-size: 12px;
    color: var(--muted);
    margin-bottom: 20px;
  }

  .lead {
    margin-top: 28px;
    font-size: clamp(15px, 1.4vw, 18px);
    color: var(--muted);
  }

  nav {
    display: flex;
    gap: 8px;
  }

  nav a {
    display: grid;
    place-items: center;
    width: 44px;
    height: 44px;
    border: 1px solid var(--line);
    border-radius: 50%;
    color: var(--fg);
    backdrop-filter: blur(6px);
    transition: background 0.3s, color 0.3s, transform 0.3s;
  }

  nav a:hover,
  nav a:focus-visible {
    background: var(--fg);
    color: var(--bg);
    transform: translateY(-2px);
    outline: none;
  }

  nav svg {
    width: 18px;
    height: 18px;
    fill: none;
    stroke: currentColor;
    stroke-width: 1.5;
    stroke-linecap: round;
    stroke-linejoin: round;
  }

  nav svg.filled {
    fill: currentColor;
    stroke: none;
  }

  @keyframes rise {
    from {
      opacity: 0;
      transform: translateY(24px);
    }
  }

  @keyframes pulse {
    50% {
      opacity: 0.3;
    }
  }

  @media (max-width: 900px) {
    .hero {
      align-self: end;
      margin-bottom: 40px;
    }

    .lead br {
      display: none;
    }
  }

  @media (max-width: 420px) {
    .copy,
    .country {
      display: none;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .hero,
    .dot {
      animation: none;
    }
  }
</style>
