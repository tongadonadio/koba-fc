<script>
  import { createEventDispatcher } from 'svelte';
  import { players, settings, saveSettings } from '../lib/stores.js';
  import { isAvail } from '../lib/helpers.js';
  import PlayerCard from './PlayerCard.svelte';
  import { FORMATIONS } from '../lib/constants.js';

  const dispatch = createEventDispatcher();

  $: slots = FORMATIONS[$settings.formation]?.positions ?? [];
  $: lineupIds = new Set(Object.values($settings.lineup ?? {}));

  $: attending = $players.filter(p => isAvail(p));
  $: absent    = $players.filter(p => !isAvail(p));

  function playerIndex(p) {
    return $players.findIndex(pl => pl.id === p.id);
  }

  function handleEdit(e) {
    dispatch('openPlayerModal', e.detail);
  }

  // Mobile: formation tab bar (desktop hides this, header shows it)
  const FORMATIONS_LIST = ['2-3-1', '3-2-1', '3-1-2'];
</script>

<div class="player-list">
  <div class="list-header">
    <span class="stitle">Plantilla <span class="cnt">{$players.length}</span></span>
    <button class="btn btn-p" on:click={() => dispatch('openPlayerModal', null)}>+ Jugador</button>
  </div>

  <!-- Formation tabs visible only on mobile -->
  <div class="mobile-ftabs">
    {#each FORMATIONS_LIST as f}
      <button
        class="ftab"
        class:active={$settings.formation === f}
        on:click={() => saveSettings({ formation: f })}
      >{f}</button>
    {/each}
  </div>

  <div class="plist">
    {#if attending.length > 0}
      <div class="list-sep green">Asisten <span class="sep-cnt">{attending.length}</span></div>
      {#each attending as player}
        <PlayerCard
          {player}
          index={playerIndex(player)}
          inLineup={lineupIds.has(player.id)}
          on:edit={handleEdit}
        />
      {/each}
    {/if}

    {#if absent.length > 0}
      <div class="list-sep muted">No asisten <span class="sep-cnt">{absent.length}</span></div>
      {#each absent as player}
        <PlayerCard
          {player}
          index={playerIndex(player)}
          inLineup={false}
          on:edit={handleEdit}
        />
      {/each}
    {/if}

    {#if $players.length === 0}
      <div class="empty">Agregá jugadores para comenzar</div>
    {/if}
  </div>
</div>

<style>
  .player-list {
    display: flex;
    flex-direction: column;
    height: 100%;
    background: var(--bg2);
  }

  .list-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 10px 10px 7px;
    border-bottom: 1px solid var(--border);
    flex-shrink: 0;
  }

  .stitle { font-size: .75rem; font-weight: 700; color: var(--txt2); text-transform: uppercase; letter-spacing: .06em; }
  .cnt {
    background: var(--card);
    border-radius: 10px;
    padding: 1px 6px;
    font-size: .7rem;
    margin-left: 4px;
    color: var(--txt);
  }

  /* Mobile-only formation tabs */
  .mobile-ftabs {
    display: none;
    gap: 4px;
    padding: 6px 8px;
    border-bottom: 1px solid var(--border);
  }
  .ftab {
    padding: 4px 12px;
    border-radius: 5px;
    border: none;
    background: var(--bg);
    color: var(--txt2);
    font-size: .78rem;
    font-weight: 700;
    cursor: pointer;
    transition: all .15s;
  }
  .ftab.active { background: var(--green); color: #000; }
  .ftab:hover:not(.active) { background: var(--card); color: var(--txt); }

  .plist {
    flex: 1;
    overflow-y: auto;
    padding: 6px 8px;
    display: flex;
    flex-direction: column;
    gap: 5px;
  }

  .list-sep {
    font-size: .62rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: .07em;
    padding: 7px 2px 3px;
    display: flex;
    align-items: center;
    gap: 6px;
    flex-shrink: 0;
  }
  .list-sep.green { color: var(--green); }
  .list-sep.muted { color: var(--txt2); }

  .sep-cnt {
    background: var(--card);
    border-radius: 10px;
    padding: 0 5px;
    font-size: .65rem;
    color: var(--txt2);
  }

  .empty {
    text-align: center;
    color: var(--txt2);
    font-size: .85rem;
    padding: 24px 12px;
  }

  @media (max-width: 768px) {
    .mobile-ftabs { display: flex; }
    .plist { max-height: 40vh; }
  }
</style>
