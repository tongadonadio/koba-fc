<script>
  import { createEventDispatcher } from 'svelte';
  import { players, matches, savePlayer } from '../lib/stores.js';
  import { isAvail, avc, dispIni, ratingColor, showFull } from '../lib/helpers.js';

  const dispatch = createEventDispatcher();

  $: attending = $players.filter(isAvail);
  $: absent    = $players.filter(p => !isAvail(p));

  $: sections = [
    { label: 'Asisten',    color: 'green', list: attending },
    { label: 'No asisten', color: 'muted', list: absent },
  ].filter(s => s.list.length > 0);

  // Compute all season stats from matches in one pass
  $: allStats = (() => {
    const m = {};
    for (const p of $players) {
      m[p.id] = { played: 0, goals: 0, assists: 0, yellow: 0, red: 0 };
    }
    for (const match of $matches) {
      const lineupPids = Object.values(match.lineup ?? {});
      for (const pid of lineupPids) {
        if (m[pid]) m[pid].played++;
      }
      for (const ev of match.events ?? []) {
        const s = m[ev.playerId];
        if (!s) continue;
        if (ev.type === 'goal')        s.goals++;
        else if (ev.type === 'assist') s.assists++;
        else if (ev.type === 'yellowCard') s.yellow++;
        else if (ev.type === 'redCard')    s.red++;
      }
    }
    return m;
  })();

  function playerIndex(p) {
    return $players.findIndex(pl => pl.id === p.id);
  }

  function toggleAvail(player) {
    const { id, ...data } = player;
    savePlayer({ ...data, available: !player.available }, id);
  }
</script>

<div class="plantel-view">
  <!-- View header -->
  <div class="view-header">
    <div class="view-title">
      Plantel
      <span class="cnt">{$players.length}</span>
    </div>
    <button class="btn btn-p" on:click={() => dispatch('openPlayerModal', null)}>+ Jugador</button>
  </div>

  <!-- Player list -->
  <div class="plist">
    {#each sections as sec}
      <div class="section-sep" class:green={sec.color === 'green'} class:muted={sec.color === 'muted'}>
        {sec.label}
        <span class="sep-cnt">{sec.list.length}</span>
      </div>

      {#each sec.list as player (player.id)}
        {@const idx    = playerIndex(player)}
        {@const [bg, tc] = avc(player.id, idx)}
        {@const avail  = isAvail(player)}
        {@const stats  = allStats[player.id] ?? { played: 0, goals: 0, assists: 0, yellow: 0, red: 0 }}

        <div class="pcard" class:not-avail={!avail}>
          <!-- Avatar -->
          <div class="av" style="background:{bg}; color:{tc}; {!avail ? 'filter:grayscale(1);' : ''}">{dispIni(player)}</div>

          <!-- Name + stats block -->
          <div class="pinfo">
            <div class="pnick">{player.nickname || player.name}</div>
            {#if showFull(player)}
              <div class="pfull">{player.name}</div>
            {/if}
            {#if stats.played > 0}
              <div class="pstats">
                <span class="stat"><span class="stat-lbl">PJ</span>&nbsp;{stats.played}</span>
                <span class="stat"><span class="stat-ico">⚽</span>&nbsp;{stats.goals}</span>
                <span class="stat"><span class="stat-ico">🎯</span>&nbsp;{stats.assists}</span>
                {#if stats.yellow > 0}
                  <span class="stat"><span class="stat-ico">🟨</span>&nbsp;{stats.yellow}</span>
                {/if}
                {#if stats.red > 0}
                  <span class="stat"><span class="stat-ico">🟥</span>&nbsp;{stats.red}</span>
                {/if}
              </div>
            {/if}
          </div>

          <!-- Right: pos badge, number, rating, dot, edit -->
          <div class="pright">
            <span class="pos-badge">{player.position}</span>
            {#if player.number != null}
              <span class="pnum">#{player.number}</span>
            {/if}
            <span class="prat" style="color:{ratingColor(player.rating)};">{player.rating ?? '–'}</span>
            <button
              class="avail-dot"
              class:off={!avail}
              title={avail ? 'Asiste — clic para marcar ausente' : 'Ausente — clic para marcar asiste'}
              on:click={() => toggleAvail(player)}
            ></button>
            <button
              class="btn-edit"
              on:click={() => dispatch('openPlayerModal', player)}
              title="Editar jugador"
            >✏️</button>
          </div>
        </div>
      {/each}
    {/each}

    {#if $players.length === 0}
      <div class="empty">Agregá jugadores para comenzar</div>
    {/if}
  </div>
</div>

<style>
  .plantel-view {
    max-width: 900px;
    margin: 0 auto;
    padding: 0 16px 32px;
  }

  /* ── View header ── */
  .view-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px 0 12px;
    border-bottom: 1px solid var(--border);
    margin-bottom: 8px;
  }

  .view-title {
    font-size: 1rem;
    font-weight: 700;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .cnt {
    background: var(--card);
    border: 1px solid var(--border);
    border-radius: 12px;
    padding: 2px 8px;
    font-size: .75rem;
    color: var(--txt2);
    font-weight: 400;
  }

  /* ── Section separators ── */
  .plist {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .section-sep {
    font-size: .65rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: .07em;
    padding: 10px 0 4px;
    display: flex;
    align-items: center;
    gap: 7px;
  }
  .section-sep.green { color: var(--green); }
  .section-sep.muted { color: var(--txt2); }

  .sep-cnt {
    background: var(--card);
    border-radius: 10px;
    padding: 1px 6px;
    font-size: .65rem;
    color: var(--txt2);
    font-weight: 400;
  }

  /* ── Player card ── */
  .pcard {
    background: var(--card);
    border: 1px solid var(--border);
    border-radius: 10px;
    padding: 10px 12px;
    display: flex;
    align-items: center;
    gap: 12px;
    transition: border-color .15s;
  }
  .pcard:hover { border-color: var(--blue); }
  .pcard.not-avail { opacity: .6; }

  /* Avatar */
  .av {
    width: 48px; height: 48px;
    border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    font-weight: 700; font-size: .85rem;
    flex-shrink: 0;
  }

  /* Info block */
  .pinfo {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .pnick {
    font-size: .9rem;
    font-weight: 600;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .pfull {
    font-size: .72rem;
    color: var(--txt2);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .pstats {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-top: 3px;
    flex-wrap: wrap;
  }

  .stat {
    font-size: .72rem;
    color: var(--txt2);
    display: flex;
    align-items: center;
    white-space: nowrap;
  }

  .stat-lbl {
    font-weight: 700;
    color: var(--txt2);
    font-size: .65rem;
    text-transform: uppercase;
    letter-spacing: .04em;
  }

  .stat-ico { font-size: .72rem; }

  /* Right controls */
  .pright {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-shrink: 0;
  }

  .pos-badge {
    font-size: .65rem;
    font-weight: 700;
    padding: 2px 6px;
    border-radius: 4px;
    background: var(--bg);
    border: 1px solid var(--border);
    color: var(--txt2);
    white-space: nowrap;
  }

  .pnum {
    font-size: .78rem;
    color: var(--txt2);
    min-width: 28px;
    text-align: center;
  }

  .prat {
    font-size: .88rem;
    font-weight: 700;
    min-width: 24px;
    text-align: right;
  }

  .avail-dot {
    width: 11px; height: 11px;
    border-radius: 50%;
    background: var(--green);
    border: none;
    cursor: pointer;
    padding: 0;
    transition: transform .15s, background .15s;
    flex-shrink: 0;
  }
  .avail-dot.off { background: var(--red); }
  .avail-dot:hover { transform: scale(1.5); }

  .btn-edit {
    background: none;
    border: none;
    color: var(--txt2);
    cursor: pointer;
    padding: 4px 6px;
    border-radius: 5px;
    font-size: .78rem;
    transition: background .15s, color .15s;
    flex-shrink: 0;
  }
  .btn-edit:hover { background: var(--border); color: var(--txt); }

  .empty {
    text-align: center;
    color: var(--txt2);
    font-size: .88rem;
    padding: 32px 12px;
  }

  /* ── Mobile ── */
  @media (max-width: 768px) {
    .plantel-view { padding: 0 10px 24px; }

    .av { width: 40px; height: 40px; font-size: .75rem; }

    .pnick { font-size: .84rem; }

    .pos-badge, .pnum { display: none; }

    .pright { gap: 6px; }
  }
</style>
