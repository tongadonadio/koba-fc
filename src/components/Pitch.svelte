<script>
  import { createEventDispatcher } from 'svelte';
  import { settings, players, saveSettings, ui } from '../lib/stores.js';
  import { avc, dispIni, ratingColor } from '../lib/helpers.js';
  import { FORMATIONS, ROLE_COLORS } from '../lib/constants.js';

  const dispatch = createEventDispatcher();

  $: formation = $settings.formation || '2-3-1';
  $: slots = FORMATIONS[formation]?.positions ?? [];
  $: lineup = $settings.lineup ?? {};
  $: allFilled = slots.length > 0 && slots.every(s => lineup[s.id]);

  let dragOverSlot = null;


  function playerIndex(player) {
    return $players.findIndex(p => p.id === player.id);
  }

  // Split nickname on first space for 2-line display
  function splitName(nick) {
    if (!nick) return ['', ''];
    const i = nick.indexOf(' ');
    if (i === -1) return [nick, ''];
    return [nick.slice(0, i), nick.slice(i + 1)];
  }

  function removeSlot(slotId, e) {
    e.stopPropagation();
    const newLineup = { ...lineup };
    delete newLineup[slotId];
    saveSettings({ lineup: newLineup });
  }

  function onDragOver(e, slotId) {
    e.preventDefault();
    dragOverSlot = slotId;
  }

  function onDragLeave() {
    dragOverSlot = null;
  }

  function onDrop(e, slotId) {
    e.preventDefault();
    dragOverSlot = null;
    const pid = e.dataTransfer.getData('playerId');
    if (!pid) return;
    // Remove player from any slot they're currently in
    const newLineup = { ...lineup };
    for (const k of Object.keys(newLineup)) {
      if (newLineup[k] === pid) delete newLineup[k];
    }
    newLineup[slotId] = pid;
    saveSettings({ lineup: newLineup });
  }

  // Drag from pitch to pitch (rearrange)
  function onPlayerDragStart(e, player) {
    e.stopPropagation();
    e.dataTransfer.setData('playerId', player.id);
    e.dataTransfer.effectAllowed = 'move';
  }

  function clickSlot(slotId) {
    ui.update(s => ({ ...s, selSlot: slotId }));
  }
</script>

<div class="pitch-wrap">
  <div class="pitch" class:all-filled={allFilled}>
    <!-- Grass stripes -->
    <div class="pstripes"></div>

    <!-- Field markings -->
    <svg class="pmarks" viewBox="0 0 100 160" preserveAspectRatio="none">
      <!-- Outer border -->
      <rect x="2" y="2" width="96" height="156" fill="none" stroke="rgba(255,255,255,.18)" stroke-width=".8"/>
      <!-- Center line -->
      <line x1="2" y1="80" x2="98" y2="80" stroke="rgba(255,255,255,.18)" stroke-width=".8"/>
      <!-- Center circle -->
      <circle cx="50" cy="80" r="13" fill="none" stroke="rgba(255,255,255,.14)" stroke-width=".8"/>
      <circle cx="50" cy="80" r="1.2" fill="rgba(255,255,255,.3)"/>
      <!-- Top penalty area -->
      <rect x="22" y="2" width="56" height="24" fill="none" stroke="rgba(255,255,255,.14)" stroke-width=".8"/>
      <!-- Top goal box -->
      <rect x="35" y="2" width="30" height="8" fill="none" stroke="rgba(255,255,255,.14)" stroke-width=".8"/>
      <!-- Bottom penalty area -->
      <rect x="22" y="134" width="56" height="24" fill="none" stroke="rgba(255,255,255,.14)" stroke-width=".8"/>
      <!-- Bottom goal box -->
      <rect x="35" y="150" width="30" height="8" fill="none" stroke="rgba(255,255,255,.14)" stroke-width=".8"/>
    </svg>

    <!-- Vignette overlay -->
    <div class="vignette"></div>

    <!-- Position slots -->
    {#each slots as slot}
      {@const pid    = lineup[slot.id]}
      {@const player = pid ? ($players.find(p => p.id === pid) ?? null) : null}
      {@const rc = ROLE_COLORS[slot.role]}
      {@const isDragTarget = dragOverSlot === slot.id}
      <!-- svelte-ignore a11y-no-static-element-interactions -->
      <div
        class="slot"
        class:filled={!!player}
        class:drag-over={isDragTarget}
        style="left:{slot.x}%; top:{slot.y}%;"
        on:dragover={e => onDragOver(e, slot.id)}
        on:dragleave={onDragLeave}
        on:drop={e => onDrop(e, slot.id)}
      >
        {#if player}
          {@const idx = $players.findIndex(p => p.id === player.id)}
          {@const [bg, tc] = avc(player.id, idx >= 0 ? idx : 0)}
          {@const [n1, n2] = splitName(player.nickname || player.name)}
          <!-- svelte-ignore a11y-no-static-element-interactions -->
          <div
            class="slot-inner filled-inner"
            style="border-color:{rc?.bg ?? '#fff'}; background:{bg}22;"
            draggable="true"
            on:dragstart={e => onPlayerDragStart(e, player)}
            on:click={() => clickSlot(slot.id)}
          >
            <div class="slot-av" style="background:{bg}; color:{tc};">{dispIni(player)}</div>
            <div class="slot-nm">
              <span>{n1}</span>
              {#if n2}<span>{n2}</span>{/if}
            </div>
            <div class="slot-rat" style="color:{ratingColor(player.rating)};">{player.rating ?? '–'}</div>
            <button class="slot-rm" on:click={e => removeSlot(slot.id, e)}>✕</button>
          </div>
        {:else}
          <!-- svelte-ignore a11y-no-static-element-interactions -->
          <div class="slot-inner empty-inner" on:click={() => clickSlot(slot.id)}>
            <span class="slot-lbl">{slot.lbl}</span>
          </div>
        {/if}
      </div>
    {/each}
  </div>
</div>

<style>
  .pitch-wrap {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 12px;
  }

  .pitch {
    position: relative;
    width: 100%;
    max-width: 520px;
    aspect-ratio: 65 / 100;
    max-height: calc(100vh - 100px);
    border-radius: 10px;
    overflow: hidden;
    box-shadow: 0 0 60px rgba(0,160,0,.08), 0 0 0 1px var(--border);
    transition: box-shadow .4s;
  }
  .pitch.all-filled {
    box-shadow: 0 0 60px rgba(63,185,80,.3), 0 0 0 1px var(--green);
  }

  .pstripes {
    position: absolute; inset: 0;
    background: repeating-linear-gradient(
      to bottom,
      var(--p-dark)  0%,   var(--p-dark)  14.28%,
      var(--p-light) 14.28%, var(--p-light) 28.57%
    );
  }

  .pmarks {
    position: absolute; inset: 0;
    width: 100%; height: 100%;
    pointer-events: none;
  }

  .vignette {
    position: absolute; inset: 0;
    background: radial-gradient(ellipse at center, transparent 45%, rgba(0,0,0,.45) 100%);
    pointer-events: none;
    z-index: 1;
  }

  /* ── Slots ── */
  .slot {
    position: absolute;
    transform: translate(-50%, -50%);
    z-index: 10;
    width: 58px; height: 58px;
    display: flex; align-items: center; justify-content: center;
    cursor: pointer;
  }

  .slot-inner {
    width: 52px; height: 52px;
    border-radius: 50%;
    display: flex; flex-direction: column;
    align-items: center; justify-content: center;
    transition: all .2s;
    position: relative;
  }

  /* Empty slot */
  .empty-inner {
    border: 2px dashed rgba(255,255,255,.3);
    background: rgba(0,0,0,.45);
  }
  .slot.drag-over .empty-inner,
  .slot:hover .empty-inner {
    border-color: #fff;
    background: rgba(255,255,255,.12);
    transform: scale(1.08);
  }

  .slot-lbl {
    font-size: .52rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: .04em;
    color: rgba(255,255,255,.6);
  }

  /* Filled slot */
  .filled-inner {
    border: 2.5px solid;
    gap: 1px;
  }
  .slot.filled:hover .filled-inner {
    filter: brightness(1.2);
    transform: scale(1.05);
  }
  .slot.drag-over .filled-inner {
    border-style: dashed;
    transform: scale(1.08);
  }

  .slot-av {
    width: 28px; height: 28px;
    border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    font-weight: 700; font-size: .7rem;
    flex-shrink: 0;
  }

  .slot-nm {
    display: flex; flex-direction: column;
    align-items: center;
    line-height: 1.1;
    font-size: .46rem;
    font-weight: 700;
    color: #fff;
    text-align: center;
    max-width: 50px;
    overflow: hidden;
  }
  .slot-nm span {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 48px;
    text-shadow: 0 1px 3px rgba(0,0,0,.8);
  }

  .slot-rat {
    font-size: .46rem;
    font-weight: 700;
    background: rgba(0,0,0,.75);
    border-radius: 3px;
    padding: 0 3px;
  }

  .slot-rm {
    position: absolute;
    top: -5px; right: -5px;
    width: 18px; height: 18px;
    border-radius: 50%;
    background: var(--red);
    border: none;
    color: #fff;
    font-size: .5rem;
    cursor: pointer;
    display: none;
    align-items: center; justify-content: center;
    z-index: 20;
    line-height: 1;
    padding: 0;
  }
  .slot:hover .slot-rm { display: flex; }

  @media (max-width: 768px) {
    .pitch { max-width: 100%; max-height: 44vh; }
    .pitch-wrap { padding: 8px 6px; }
    .slot-rm { display: flex; width: 22px; height: 22px; top: -5px; right: -5px; font-size: .6rem; }
  }
</style>
