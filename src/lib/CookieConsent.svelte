<script>
  import { onMount } from 'svelte';
  import { acceptAll, CATEGORIES, choose, closeSettings, onConsent, openSettings, rejectAll } from './consent.js';

  // The privacy banner (until the visitor answers) and the settings dialog (from "Choose" or the
  // footer's "Privacy" link). "Reject all" sits next to "Accept all" with the same weight on purpose.
  let consent = $state({ decided: true, settingsOpen: false });
  let draft = $state({});
  let dialog;

  onMount(() => onConsent((next) => (consent = next)));

  $effect(() => {
    if (!dialog) return;
    if (consent.settingsOpen && !dialog.open) {
      // start from what they chose before (everything off the first time)
      draft = Object.fromEntries(CATEGORIES.map(({ id }) => [id, consent[id]]));
      dialog.showModal();
    } else if (!consent.settingsOpen && dialog.open) {
      dialog.close();
    }
  });
</script>

{#if !consent.decided && !consent.settingsOpen}
  <section class="banner" aria-label="Privacy choices">
    <p class="label">Cookies &amp; privacy</p>
    <p class="text">
      No ads, no tracking, no cookies. With your OK this site remembers your theme and sound settings in this browser and
      can show the weather where you are.
    </p>
    <div class="actions">
      <button class="pill" onclick={rejectAll}>Reject all</button>
      <button class="pill" onclick={acceptAll}>Accept all</button>
      <button class="text-button" onclick={openSettings}>Choose</button>
    </div>
  </section>
{/if}

<dialog bind:this={dialog} aria-labelledby="privacy-title" onclose={closeSettings}>
  <div class="head">
    <h2 id="privacy-title">Privacy choices</h2>
    <button class="close" onclick={closeSettings} aria-label="Close without saving">
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" /></svg>
    </button>
  </div>
  <p class="intro">
    This site sets no cookies and has no ads or analytics. The weather in Sisaket comes from Open-Meteo, which sees your IP
    address like any site you load. These are the optional things it can do. Change your mind any time from
    <em>Privacy</em> at the bottom of the page.
  </p>

  <ul>
    <li>
      <div>
        <p class="title">Your privacy choice</p>
        <p class="description">Saves the answer you give here in this browser for 12 months, then asks again.</p>
      </div>
      <span class="always">Always on</span>
    </li>
    {#each CATEGORIES as category}
      <li>
        <div>
          <p class="title" id="consent-{category.id}">{category.title}</p>
          <p class="description">{category.description}</p>
        </div>
        <button
          class="switch"
          role="switch"
          aria-checked={draft[category.id] === true}
          aria-labelledby="consent-{category.id}"
          onclick={() => (draft[category.id] = !draft[category.id])}
        >
          <span class="knob"></span>
        </button>
      </li>
    {/each}
  </ul>

  <div class="actions">
    <button class="pill" onclick={rejectAll}>Reject all</button>
    <button class="pill" onclick={acceptAll}>Accept all</button>
    <button class="pill primary" onclick={() => choose(draft)}>Save choices</button>
  </div>
</dialog>

<style>
  .banner {
    position: fixed;
    z-index: 10;
    left: clamp(16px, 3vw, 40px);
    bottom: clamp(16px, 3vw, 40px);
    width: min(440px, calc(100% - 2 * clamp(16px, 3vw, 40px)));
    padding: 20px;
    border: 1px solid var(--line);
    border-radius: 18px;
    background: var(--bg);
    box-shadow: 0 12px 40px rgba(0, 0, 0, 0.18);
    pointer-events: auto;
    animation: rise 0.7s cubic-bezier(0.2, 0.7, 0.1, 1) both;
  }

  .label {
    font-family: var(--mono);
    font-size: 12px;
    letter-spacing: 0.02em;
    color: var(--muted);
  }

  .text {
    margin-top: 8px;
    font-size: 14px;
    line-height: 1.55;
    color: var(--fg);
  }

  .actions {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px;
    margin-top: 16px;
  }

  button {
    font: inherit;
    color: inherit;
    background: none;
    border: 0;
    cursor: pointer;
  }

  button:focus-visible {
    outline: 1px solid var(--fg);
    outline-offset: 3px;
  }

  .pill {
    height: 36px;
    padding: 0 16px;
    border: 1px solid var(--line);
    border-radius: 999px;
    font-family: var(--mono);
    font-size: 12px;
    color: var(--fg);
    transition: background 0.3s, color 0.3s, border-color 0.3s, transform 0.3s;
  }

  .pill:hover {
    background: var(--fg);
    border-color: var(--fg);
    color: var(--bg);
  }

  .pill:active {
    transform: scale(0.96);
  }

  .primary {
    background: var(--fg);
    border-color: var(--fg);
    color: var(--bg);
  }

  .primary:hover {
    background: transparent;
    color: var(--fg);
  }

  .text-button {
    margin-left: auto;
    padding: 0 4px;
    font-family: var(--mono);
    font-size: 12px;
    color: var(--muted);
    text-decoration: underline dotted;
    text-underline-offset: 3px;
    transition: color 0.3s;
  }

  .text-button:hover {
    color: var(--fg);
  }

  dialog {
    width: min(520px, calc(100% - 32px));
    max-height: calc(100dvh - 32px);
    margin: auto;
    padding: 24px;
    overflow: auto;
    border: 1px solid var(--line);
    border-radius: 20px;
    background: var(--bg);
    color: var(--fg);
  }

  dialog[open] {
    animation: rise 0.5s cubic-bezier(0.2, 0.7, 0.1, 1) both;
  }

  dialog::backdrop {
    background: rgba(0, 0, 0, 0.45);
    backdrop-filter: blur(4px);
    -webkit-backdrop-filter: blur(4px);
  }

  .head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
  }

  h2 {
    font-size: 20px;
    font-weight: 400;
    letter-spacing: -0.01em;
  }

  .close {
    display: grid;
    place-items: center;
    width: 36px;
    height: 36px;
    flex: none;
    border: 1px solid var(--line);
    border-radius: 50%;
    transition: border-color 0.3s;
  }

  .close:hover {
    border-color: var(--fg);
  }

  .close svg {
    width: 16px;
    height: 16px;
    fill: none;
    stroke: currentColor;
    stroke-width: 1.5;
    stroke-linecap: round;
  }

  .intro {
    margin-top: 12px;
    font-size: 14px;
    line-height: 1.55;
    color: var(--muted);
  }

  .intro em {
    font-style: normal;
    color: var(--fg);
  }

  ul {
    list-style: none;
    margin-top: 20px;
    border-top: 1px solid var(--line);
  }

  li {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 20px;
    padding: 16px 0;
    border-bottom: 1px solid var(--line);
  }

  .title {
    font-size: 14px;
    font-weight: 400;
  }

  .description {
    margin-top: 4px;
    font-size: 13px;
    line-height: 1.5;
    color: var(--muted);
  }

  .always {
    flex: none;
    padding-top: 2px;
    font-family: var(--mono);
    font-size: 12px;
    color: var(--muted);
    white-space: nowrap;
  }

  .switch {
    position: relative;
    flex: none;
    width: 40px;
    height: 22px;
    border: 1px solid var(--line);
    border-radius: 999px;
    transition: background 0.3s, border-color 0.3s;
  }

  .knob {
    position: absolute;
    top: 3px;
    left: 3px;
    width: 14px;
    height: 14px;
    border-radius: 50%;
    background: var(--muted);
    transition: transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1), background 0.3s;
  }

  .switch[aria-checked='true'] {
    background: var(--fg);
    border-color: var(--fg);
  }

  .switch[aria-checked='true'] .knob {
    transform: translateX(18px);
    background: var(--bg);
  }

  @keyframes rise {
    from {
      opacity: 0;
      transform: translateY(16px);
    }
  }

  @media (max-width: 420px) {
    .text-button {
      margin-left: 0;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .banner,
    dialog[open],
    .pill,
    .knob,
    .switch {
      animation: none;
      transition: none;
    }
  }
</style>
