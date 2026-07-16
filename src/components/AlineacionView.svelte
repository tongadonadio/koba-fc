<script>
  import { settings, players, saveSettings } from '../lib/stores.js';
  import { ratingColor } from '../lib/helpers.js';
  import { FORMATIONS, ROLE_COLORS } from '../lib/constants.js';
  import Pitch from './Pitch.svelte';
  import Bench from './Bench.svelte';
  import StatsPanel from './StatsPanel.svelte';

  const FORMATIONS_LIST = ['2-3-1', '3-2-1', '3-1-2'];

  $: formation = $settings.formation || '2-3-1';
  $: slots = FORMATIONS[formation]?.positions ?? [];
  $: lineup = $settings.lineup ?? {};

  function getPlayer(slotId) {
    const pid = lineup[slotId];
    return pid ? $players.find(p => p.id === pid) : null;
  }
</script>

<div class="alineacion-layout">
  <!-- Left: Stats panel with auto-fill and team stats -->
  <aside class="lpanel">
    <StatsPanel />
  </aside>

  <!-- Center: Formation tabs + Pitch + Bench -->
  <main class="center">
    <div class="ftabs">
      {#each FORMATIONS_LIST as f}
        <button
          class="ftab"
          class:active={$settings.formation === f}
          on:click={() => saveSettings({ formation: f })}
        >{f}</button>
      {/each}
    </div>
    <Pitch />
    <Bench />
  </main>

  <!-- Right: Lineup list (desktop only) -->
  <aside class="rpanel">
    <div class="lineup-card">
      <div class="pnltitle">Alineación</div>
      {#each slots as slot}
        {@const player = getPlayer(slot.id)}
        {@const rc = ROLE_COLORS[slot.role]}
        <div class="li" class:empty={!player}>
          <span class="li-pos" style="background:{rc?.bg}33; color:{rc?.bg};">{slot.lbl}</span>
          {#if player}
            <span class="li-num">#{player.number ?? '–'}</span>
            <span class="li-name">{player.nickname || player.name}</span>
            <span class="li-rat" style="color:{ratingColor(player.rating)};">{player.rating ?? '–'}</span>
          {:else}
            <span class="li-empty">Vacío</span>
          {/if}
        </div>
      {/each}
      {#if slots.length === 0}
        <div class="li-hint">Seleccioná una formación</div>
      {/if}
    </div>
  </aside>
</div>

<style>
  .alineacion-layout {
    display: grid;
    grid-template-columns: 220px 1fr 200px;
    grid-template-areas: "lpanel center rpanel";
    min-height: calc(100vh - 52px);
    background: var(--bg);
  }

  .lpanel {
    grid-area: lpanel;
    border-right: 1px solid var(--border);
    background: var(--bg2);
    overflow-y: auto;
  }

  .center {
    grid-area: center;
    display: flex;
    flex-direction: column;
    background: var(--bg);
    overflow: hidden;
  }

  .rpanel {
    grid-area: rpanel;
    border-left: 1px solid var(--border);
    background: var(--bg2);
    overflow-y: auto;
    padding: 10px;
  }

  /* Formation tabs inside the center column */
  .ftabs {
    display: flex;
    gap: 4px;
    padding: 10px 12px 8px;
    border-bottom: 1px solid var(--border);
    background: var(--bg2);
    flex-shrink: 0;
  }

  .ftab {
    padding: 5px 14px;
    border-radius: 5px;
    border: none;
    background: var(--bg);
    color: var(--txt2);
    font-size: .78rem;
    font-weight: 700;
    cursor: pointer;
    transition: all .15s;
  }
  .ftab.active {
    background: var(--green);
    color: #000;
  }
  .ftab:hover:not(.active) { background: var(--card); color: var(--txt); }

  /* Right panel lineup list */
  .lineup-card {
    background: var(--card);
    border: 1px solid var(--border);
    border-radius: 10px;
    padding: 12px;
  }

  .pnltitle {
    font-size: .72rem;
    font-weight: 700;
    color: var(--txt2);
    text-transform: uppercase;
    letter-spacing: .06em;
    margin-bottom: 10px;
  }

  .li {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 5px 0;
    border-bottom: 1px solid var(--border);
    font-size: .78rem;
  }
  .li:last-child { border: none; }
  .li.empty { opacity: .5; }

  .li-pos {
    font-size: .62rem;
    font-weight: 700;
    width: 28px;
    text-align: center;
    padding: 2px 3px;
    border-radius: 3px;
    flex-shrink: 0;
  }
  .li-num { color: var(--txt2); width: 22px; text-align: center; flex-shrink: 0; }
  .li-name { flex: 1; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .li-rat { font-weight: 700; flex-shrink: 0; }
  .li-empty { color: var(--txt2); font-style: italic; font-size: .75rem; }
  .li-hint { color: var(--txt2); font-size: .78rem; font-style: italic; }

  @media (max-width: 768px) {
    .alineacion-layout {
      grid-template-columns: 1fr;
      grid-template-areas:
        "center"
        "lpanel";
    }

    .lpanel {
      border-right: none;
      border-top: 1px solid var(--border);
    }

    .rpanel {
      display: none;
    }
  }
</style>
