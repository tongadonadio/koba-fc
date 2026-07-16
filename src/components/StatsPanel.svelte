<script>
  import { settings, players, saveSettings } from '../lib/stores.js';
  import { isAvail, ratingColor } from '../lib/helpers.js';
  import { FORMATIONS, ROLE_COLORS, POS_TO_ROLE } from '../lib/constants.js';

  $: formation = $settings.formation || '2-3-1';
  $: slots = FORMATIONS[formation]?.positions ?? [];
  $: lineup = $settings.lineup ?? {};

  $: available = $players.filter(isAvail);
  $: total     = $players.length;
  $: inLineup  = slots.filter(s => lineup[s.id]).length;

  $: avgRating = (() => {
    const rated = available.filter(p => p.rating != null);
    if (!rated.length) return '—';
    return (rated.reduce((a, p) => a + p.rating, 0) / rated.length).toFixed(1);
  })();

  $: posCounts = (() => {
    const c = {};
    available.forEach(p => { c[p.position] = (c[p.position] || 0) + 1; });
    return c;
  })();

  function autoFill() {
    const newLineup = { ...lineup };
    const used = new Set(Object.values(newLineup).filter(Boolean));

    for (const slot of slots) {
      if (newLineup[slot.id]) continue;
      // Find best available unassigned player matching this role
      const candidates = available.filter(p =>
        !used.has(p.id) && POS_TO_ROLE[p.position] === slot.role
      );
      if (!candidates.length) continue;
      const best = candidates.reduce((a, b) => (b.rating ?? 0) > (a.rating ?? 0) ? b : a);
      newLineup[slot.id] = best.id;
      used.add(best.id);
    }
    saveSettings({ lineup: newLineup });
  }

  function getPlayer(slotId) {
    const pid = lineup[slotId];
    return pid ? $players.find(p => p.id === pid) : null;
  }
</script>

<div class="rpanel">
  <!-- Availability stats -->
  <div class="pnlcard">
    <div class="pnltitle">Estadísticas</div>

    <div class="st">
      <span class="sl">Disponibles</span>
      <span class="sv">{available.length}<span class="sub">/{total}</span></span>
    </div>
    <div class="avail-bar">
      <div
        class="bar-fill"
        style="width:{total ? (available.length / total * 100).toFixed(0) : 0}%;"
      ></div>
    </div>

    <div class="st" style="margin-top:6px;">
      <span class="sl">En cancha</span>
      <span class="sv">{inLineup}<span class="sub">/{slots.length}</span></span>
    </div>

    <div class="st">
      <span class="sl">Rating prom.</span>
      <span class="sv">{avgRating}</span>
    </div>

    <!-- Position breakdown -->
    <div class="pos-row">
      {#each Object.entries(posCounts) as [pos, n]}
        {@const role = POS_TO_ROLE[pos]}
        {@const rc = ROLE_COLORS[role]}
        <span class="pos-badge" style="background:{rc?.bg}22; border-color:{rc?.bg}44; color:{rc?.bg};">
          {pos} <b>{n}</b>
        </span>
      {/each}
    </div>

    <button class="btn btn-s autofill" on:click={autoFill}>⚡ Auto-completar</button>
  </div>

  <!-- Lineup list -->
  <div class="pnlcard">
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
  </div>
</div>

<style>
  .rpanel {
    display: flex;
    flex-direction: column;
    gap: 10px;
    overflow-y: auto;
    padding: 10px;
  }

  .pnlcard {
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

  .st {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 2px 0;
  }
  .sl { font-size: .78rem; color: var(--txt2); }
  .sv { font-size: .88rem; font-weight: 700; }
  .sub { font-size: .7rem; color: var(--txt2); font-weight: 400; }

  .avail-bar {
    height: 4px;
    background: var(--border);
    border-radius: 2px;
    margin: 5px 0 4px;
    overflow: hidden;
  }
  .bar-fill {
    height: 100%;
    background: var(--green);
    border-radius: 2px;
    transition: width .4s ease;
  }

  .pos-row {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
    margin: 8px 0;
  }
  .pos-badge {
    border: 1px solid;
    border-radius: 6px;
    padding: 2px 7px;
    font-size: .7rem;
  }
  .pos-badge b { font-weight: 700; }

  .autofill { width: 100%; margin-top: 4px; font-size: .78rem; }

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
    font-size: .62rem; font-weight: 700;
    width: 28px; text-align: center;
    padding: 2px 3px; border-radius: 3px;
    flex-shrink: 0;
  }
  .li-num { color: var(--txt2); width: 22px; text-align: center; flex-shrink: 0; }
  .li-name { flex: 1; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .li-rat { font-weight: 700; flex-shrink: 0; }
  .li-empty { color: var(--txt2); font-style: italic; font-size: .75rem; }
</style>
