<script>
  import { onMount } from 'svelte';

  let { lines } = $props();

  const START_DELAY_MS = 500;
  const TYPE_MS = 80;
  const LINE_PAUSE_MS = 280;
  const CARET_LINGER_MS = 2600;
  const SCRAMBLE_TICK_MS = 45;
  // how many letters ahead of the caret flicker before they settle
  const SCRAMBLE_AHEAD = 3;
  const GLYPHS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789<>/_#';

  let typedCounts = $state(lines.map(() => 0));
  let activeLine = $state(0);
  let typing = $state(true);
  let caretVisible = $state(true);
  let tick = $state(0);

  const randomGlyph = () => GLYPHS[Math.floor(Math.random() * GLYPHS.length)];

  // `_tick` is passed from the template so the random letters re-roll on every tick
  function scrambled(lineIndex, _tick) {
    if (!typing || lineIndex !== activeLine) return '';
    const typed = typedCounts[lineIndex];
    const ahead = Math.min(SCRAMBLE_AHEAD, lines[lineIndex].length - typed);
    return Array.from({ length: ahead }, randomGlyph).join('');
  }

  // Letters not reached yet stay in the layout, invisible, so nothing shifts while typing
  function hidden(lineIndex) {
    const reached = typedCounts[lineIndex] + scrambled(lineIndex, tick).length;
    return lines[lineIndex].slice(reached);
  }

  onMount(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      typedCounts = lines.map((line) => line.length);
      typing = false;
      caretVisible = false;
      return;
    }

    let cancelled = false;
    const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
    const scrambleTimer = setInterval(() => tick++, SCRAMBLE_TICK_MS);

    (async () => {
      await sleep(START_DELAY_MS);
      for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
        activeLine = lineIndex;
        for (let count = 1; count <= lines[lineIndex].length; count++) {
          if (cancelled) return;
          typedCounts[lineIndex] = count;
          await sleep(TYPE_MS);
        }
        if (lineIndex < lines.length - 1) await sleep(LINE_PAUSE_MS);
      }
      typing = false;
      clearInterval(scrambleTimer);
      await sleep(CARET_LINGER_MS);
      if (!cancelled) caretVisible = false;
    })();

    return () => {
      cancelled = true;
      clearInterval(scrambleTimer);
    };
  });
</script>

<h1 aria-label={lines.join(' ')}>
  {#each lines as line, lineIndex}
    <span class="line" aria-hidden="true">
      {line.slice(0, typedCounts[lineIndex])}<span class="scramble">{scrambled(lineIndex, tick)}</span>{#if lineIndex === activeLine}<span
          class="caret"
          class:gone={!caretVisible}
          class:blinking={!typing}
        ></span>{/if}<span class="hidden">{hidden(lineIndex)}</span>
    </span>
  {/each}
</h1>

<style>
  h1 {
    font-weight: 300;
    font-size: clamp(48px, min(9vw, 16vh), 128px);
    line-height: 0.92;
    letter-spacing: -0.045em;
    text-transform: uppercase;
  }

  .line {
    display: block;
    white-space: nowrap;
  }

  .line:last-child {
    color: var(--muted);
  }

  .scramble {
    opacity: 0.35;
  }

  .hidden {
    visibility: hidden;
  }

  .caret {
    display: inline-block;
    width: 0.06em;
    height: 0.72em;
    margin-left: 0.06em;
    background: currentColor;
    transition: opacity 0.4s;
  }

  .caret.blinking {
    animation: blink 1s steps(1) infinite;
  }

  .caret.gone {
    opacity: 0;
    animation: none;
  }

  @keyframes blink {
    50% {
      opacity: 0;
    }
  }
</style>
