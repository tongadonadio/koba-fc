<script>
  import { createEventDispatcher } from 'svelte';
  import { settings, players, saveSettings } from '../lib/stores.js';
  import { isAvail, avc, dispIni, ratingColor } from '../lib/helpers.js';
  import { FORMATIONS, ROLE_COLORS, POS_TO_ROLE } from '../lib/constants.js';

  export let slotId;

  const dispatch = createEventDispatcher();

  $: slots = FORMATIONS[$settings.formation]?.positions ?? [];
  $: slot  = slots.find(s => s.id === slotId);
  $: rc    = slot ? ROLE_COLORS[slot.role] : null;
  $: lineup = $settings.lineup ?? {};

  // Available players not already in lineup (but allow the one already in this slot)
  $: candidates = $players
    .filter(p => {
      if (!isAvail(p)) return false;
      const inThisSlot = lineup[slotId] === p.id;
      const inOtherSlot = Object.entries(lineup).some(([k, v]) => v === p.id && k !== slotId);
      return !inOtherSlot || inThisSlot;
    })
    .sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));

  function isRoleMatch(player) {
    return !!slot && POS_TO_ROLE[player.position] === slot.role;
  }

  function assign(playerId) {
    const newLineup = { ...lineup, [slotId]: playerId };
    saveSettings({ lineup: newLineup });
    dispatch('close');
  }

  function clearSlot() {
    const newLineup = { ...lineup };
    delete newLineup[slotId];
    saveSettings({ lineup: newLineup });
    dispatch('close');
  }

  function onKeydown(e) {
    if (e.key === 'Escape') dispatch('close');
  }
</script>

<svelte:window on:keydown={onKeydown} />

<!-- svelte-ignore a11y-no-static-element-interactions -->
<div class="overlay" on:click|self={() => dispatch('close')}>
  <div class="modal">
    <div class="mhead">
      <div class="mpos" style="background:{rc?.bg}33; color:{rc?.bg}; border-color:{rc?.bg}44;">
        {slot?.lbl ?? slotId}
      </div>
      <div class="mtitle">Asignar jugador</div>
      {#if lineup[slotId]}
        <button class="btn btn-d clear-btn" on:click={clearSlot}>Quitar</button>
      {/if}
    </div>

    <div class="pgrid">
      {#each candidates as player}
        {@const idx = $players.findIndex(p => p.id === player.id)}
        {@const [bg, tc] = avc(player.id, idx)}
        {@const selected = lineup[slotId] === player.id}
        {@const roleMatch = isRoleMatch(player)}
        <!-- svelte-ignore a11y-no-static-element-interactions -->
        <div
          class="pscard"
          class:selected
          class:role-match={roleMatch}
          on:click={() => assign(player.id)}
        >
          <div class="psa" style="background:{bg}; color:{tc};">{dispIni(player)}</div>
          <div class="psnick">{player.nickname || player.name}</div>
          <div class="pspos">{player.position}</div>
          <div class="psrat" style="color:{ratingColor(player.rating)};">{player.rating ?? '–'}</div>
        </div>
      {/each}

      {#if candidates.length === 0}
        <div class="empty-msg">No hay jugadores disponibles</div>
      {/if}
    </div>

    <div class="mactions">
      <button class="btn btn-s" on:click={() => dispatch('close')}>Cancelar</button>
    </div>
  </div>
</div>

<style>
  .overlay {
    position: fixed; inset: 0;
    background: rgba(0,0,0,.7);
    z-index: 1000;
    display: flex;
    align-items: center;
    justify-content: center;
    backdrop-filter: blur(4px);
  }

  .modal {
    background: var(--bg2);
    border: 1px solid var(--border);
    border-radius: 14px;
    padding: 20px;
    width: 420px;
    max-width: 92vw;
    max-height: 88vh;
    overflow-y: auto;
    animation: mdin .18s ease;
  }

  @keyframes mdin {
    from { transform: scale(.9); opacity: 0; }
    to   { transform: scale(1);  opacity: 1; }
  }

  .mhead {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 14px;
  }

  .mpos {
    padding: 3px 10px;
    border-radius: 6px;
    border: 1px solid;
    font-size: .72rem;
    font-weight: 700;
    flex-shrink: 0;
  }

  .mtitle { font-size: .95rem; font-weight: 700; flex: 1; }

  .clear-btn { padding: 4px 10px; font-size: .75rem; }

  .pgrid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 7px;
    margin-bottom: 14px;
  }

  .pscard {
    background: var(--card);
    border: 2px solid var(--border);
    border-radius: 9px;
    padding: 10px 6px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 3px;
    cursor: pointer;
    transition: all .15s;
    text-align: center;
  }
  .pscard:hover { border-color: var(--blue); transform: translateY(-1px); }
  .pscard.selected { border-color: var(--green); background: rgba(63,185,80,.1); }
  .pscard.role-match:not(.selected) { border-color: rgba(88,166,255,.4); }

  .psa {
    width: 38px; height: 38px;
    border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    font-weight: 700; font-size: .65rem;
    margin-bottom: 2px;
  }

  .psnick { font-size: .72rem; font-weight: 600; line-height: 1.2; }
  .pspos  { font-size: .62rem; color: var(--txt2); }
  .psrat  { font-size: .78rem; font-weight: 700; }

  .empty-msg {
    grid-column: 1 / -1;
    text-align: center;
    color: var(--txt2);
    font-size: .85rem;
    padding: 20px;
  }

  .mactions { display: flex; justify-content: flex-end; }
</style>
