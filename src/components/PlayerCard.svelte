<script>
  import { createEventDispatcher } from 'svelte';
  import { savePlayer } from '../lib/stores.js';
  import { avc, dispIni, ratingColor, showFull, isAvail } from '../lib/helpers.js';

  export let player;
  export let index;
  export let inLineup = false;

  const dispatch = createEventDispatcher();

  $: [bgColor, txtColor] = avc(player.id, index);
  $: avail = isAvail(player);
  $: rColor = ratingColor(player.rating);

  function toggleAvail() {
    const { id, ...data } = player;
    savePlayer({ ...data, available: !player.available }, id);
  }

  function handleDragStart(e) {
    if (!avail) { e.preventDefault(); return; }
    e.dataTransfer.setData('playerId', player.id);
    e.dataTransfer.effectAllowed = 'move';
  }
</script>

<!-- svelte-ignore a11y-no-static-element-interactions -->
<div
  class="pcard"
  class:not-avail={!avail}
  class:in-lineup={inLineup}
  draggable={avail}
  on:dragstart={handleDragStart}
>
  <div class="av" style="background:{bgColor}; color:{txtColor};">
    {dispIni(player)}
  </div>

  <div class="pi">
    <div class="pname">{player.nickname || player.name}</div>
    {#if showFull(player)}
      <div class="pfull">{player.name}</div>
    {/if}
    <div class="pmeta">
      <span class="ptag">{player.position}</span>
      {#if player.number != null}
        <span class="pnum">#{player.number}</span>
      {/if}
      {#if inLineup}
        <span class="in-tag">✓</span>
      {/if}
    </div>
  </div>

  <div class="pright">
    <span class="prat" style="color:{rColor};">{player.rating ?? '-'}</span>
    <button
      class="avail-dot"
      class:off={!avail}
      title={avail ? 'Asiste — clic para marcar ausente' : 'Ausente — clic para marcar asiste'}
      on:click|stopPropagation={toggleAvail}
    ></button>
    <div class="pactions">
      <button class="bico" on:click|stopPropagation={() => dispatch('edit', player)} title="Editar jugador">✏️</button>
    </div>
  </div>
</div>

<style>
  .pcard {
    background: var(--card);
    border: 1px solid var(--border);
    border-radius: 9px;
    padding: 7px 9px;
    display: flex;
    align-items: center;
    gap: 7px;
    cursor: grab;
    transition: border-color .15s, transform .15s;
    position: relative;
    user-select: none;
  }
  .pcard:hover {
    border-color: var(--blue);
    transform: translateX(2px);
  }
  .pcard.not-avail { opacity: .55; cursor: default; }
  .pcard.in-lineup { opacity: .6; background: var(--bg2); }

  .av {
    width: 34px; height: 34px;
    border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    font-weight: 700; font-size: .7rem;
    flex-shrink: 0;
  }
  .not-avail .av { filter: grayscale(1); }

  .pi { flex: 1; min-width: 0; }
  .pname {
    font-size: .82rem; font-weight: 600;
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  }
  .pfull {
    font-size: .68rem; color: var(--txt2);
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    margin-top: 1px;
  }
  .pmeta { display: flex; align-items: center; gap: 4px; margin-top: 2px; }
  .ptag {
    font-size: .6rem; font-weight: 700;
    padding: 1px 5px; border-radius: 3px;
    background: var(--bg); border: 1px solid var(--border);
    color: var(--txt2);
  }
  .pnum { font-size: .68rem; color: var(--txt2); }
  .in-tag { font-size: .62rem; color: var(--green); font-weight: 700; }

  .pright {
    display: flex; align-items: center; gap: 5px; flex-shrink: 0;
  }
  .prat { font-size: .82rem; font-weight: 700; min-width: 22px; text-align: right; }

  .avail-dot {
    width: 9px; height: 9px;
    border-radius: 50%;
    background: var(--green);
    border: none; cursor: pointer; padding: 0;
    transition: transform .15s, background .15s;
    flex-shrink: 0;
  }
  .avail-dot.off { background: var(--red); }
  .avail-dot:hover { transform: scale(1.5); }

  .pactions { display: none; gap: 3px; flex-shrink: 0; }
  .pcard:hover .pactions { display: flex; }

  .bico {
    background: none; border: none;
    color: var(--txt2); cursor: pointer;
    padding: 2px 4px; border-radius: 3px;
    font-size: .72rem; transition: all .15s;
  }
  .bico:hover { background: var(--border); color: var(--txt); }

  @media (max-width: 768px) {
    .pactions { display: flex; }
  }
</style>
