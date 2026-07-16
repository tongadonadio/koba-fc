<script>
  import { createEventDispatcher } from 'svelte';
  import { matches, players, deleteMatch } from '../lib/stores.js';
  import { dispName } from '../lib/helpers.js';
  import { FORMATIONS, ROLE_COLORS } from '../lib/constants.js';

  const dispatch = createEventDispatcher();

  let selectedId = null;

  $: selectedMatch = $matches.find(m => m.id === selectedId) ?? null;

  // ── Stats helpers ────────────────────────────────────────────────────────────
  function computeStats(playerId) {
    let played = 0, goals = 0, assists = 0, yellow = 0, red = 0, wins = 0, draws = 0, losses = 0;
    for (const m of $matches) {
      if (!Object.values(m.lineup || {}).includes(playerId)) continue;
      played++;
      for (const ev of m.events || []) {
        if (ev.playerId !== playerId) continue;
        if (ev.type === 'goal')       goals++;
        else if (ev.type === 'assist')     assists++;
        else if (ev.type === 'yellowCard') yellow++;
        else if (ev.type === 'redCard')    red++;
      }
      const gf = m.goalsFor ?? 0, ga = m.goalsAgainst ?? 0;
      if (gf > ga) wins++;
      else if (gf === ga) draws++;
      else losses++;
    }
    return { played, goals, assists, yellow, red, wins, draws, losses };
  }

  function formatDate(d) {
    if (!d) return '';
    const [y, m, day] = d.split('-');
    const months = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'];
    return `${parseInt(day)} ${months[parseInt(m) - 1]} ${y}`;
  }

  function resultClass(m) {
    if ((m.goalsFor ?? 0) > (m.goalsAgainst ?? 0)) return 'win';
    if ((m.goalsFor ?? 0) === (m.goalsAgainst ?? 0)) return 'draw';
    return 'loss';
  }

  function resultLabel(m) {
    const rc = resultClass(m);
    if (rc === 'win') return 'Victoria';
    if (rc === 'draw') return 'Empate';
    return 'Derrota';
  }

  function eventIcon(type) {
    if (type === 'goal')       return '⚽';
    if (type === 'assist')     return '🎯';
    if (type === 'yellowCard') return '🟨';
    if (type === 'redCard')    return '🟥';
    return '•';
  }

  function eventLabel(type) {
    if (type === 'goal')       return 'Gol';
    if (type === 'assist')     return 'Asistencia';
    if (type === 'yellowCard') return 'Amarilla';
    if (type === 'redCard')    return 'Roja';
    return type;
  }

  function getPlayer(id) {
    return $players.find(p => p.id === id) ?? null;
  }

  // ── Season table ─────────────────────────────────────────────────────────────
  $: allPlayerIds = [...new Set(
    $matches.flatMap(m => Object.values(m.lineup || {}))
  )].filter(Boolean);

  $: statsRows = allPlayerIds
    .map(pid => {
      const s = computeStats(pid);
      return {
        player: $players.find(p => p.id === pid),
        ...s,
        pct: s.played > 0 ? Math.round((s.wins / s.played) * 100) : 0,
      };
    })
    .filter(r => r.player && r.played > 0)
    .sort((a, b) => b.played - a.played);

  $: topScorerPid = (() => {
    if (!statsRows.length) return null;
    const best = statsRows.reduce((b, r) => r.goals > b.goals ? r : b, { goals: -1, player: null });
    return best.goals > 0 ? best.player?.id : null;
  })();

  // ── Delete ───────────────────────────────────────────────────────────────────
  async function handleDelete(id) {
    if (!confirm('¿Eliminar este partido?')) return;
    await deleteMatch(id);
    selectedId = null;
  }

  // ── Lineup slot positions ────────────────────────────────────────────────────
  function getPositions(formation) {
    return FORMATIONS[formation]?.positions ?? [];
  }
</script>

<div class="historial-layout">
  <!-- ── Left sidebar: match list ── -->
  <aside class="sidebar">
    <div class="sidebar-header">
      <h2 class="sidebar-title">Partidos ({$matches.length})</h2>
      <button class="btn btn-p" on:click={() => dispatch('openMatch', null)}>+ Partido</button>
    </div>

    <div class="match-list">
      {#if $matches.length === 0}
        <div class="empty-list">
          <p>Sin partidos aún ⚽</p>
          <p class="empty-sub">Registrá el primer resultado</p>
        </div>
      {:else}
        {#each $matches as m (m.id)}
          <!-- svelte-ignore a11y-no-static-element-interactions -->
          <div
            class="match-card"
            class:selected={selectedId === m.id}
            on:click={() => selectedId = m.id}
          >
            <div class="match-card-top">
              <span class="match-date">{formatDate(m.date)}</span>
              <span class="result-badge {resultClass(m)}">{resultLabel(m)}</span>
            </div>
            <div class="match-opponent">vs {m.opponent || '—'}</div>
            {#if m.competition}
              <div class="match-competition">{m.competition}</div>
            {/if}
            <div class="match-score">
              <span class="score-num">{m.goalsFor ?? 0}</span>
              <span class="score-sep">—</span>
              <span class="score-num">{m.goalsAgainst ?? 0}</span>
            </div>
          </div>
        {/each}
      {/if}
    </div>
  </aside>

  <!-- ── Right panel: detail + season table ── -->
  <main class="detail-panel">
    {#if selectedMatch}
      <!-- Match detail card -->
      <div class="detail-card">
        <div class="detail-header">
          <div class="detail-meta">
            <span class="detail-date">{formatDate(selectedMatch.date)}</span>
            {#if selectedMatch.competition}
              <span class="detail-competition">{selectedMatch.competition}</span>
            {/if}
            <span class="detail-vs">vs <strong>{selectedMatch.opponent || '—'}</strong></span>
            <span class="result-badge lg {resultClass(selectedMatch)}">{resultLabel(selectedMatch)}</span>
          </div>
          <div class="detail-score">
            {selectedMatch.goalsFor ?? 0} — {selectedMatch.goalsAgainst ?? 0}
          </div>
          <div class="detail-actions">
            <button class="btn btn-s" on:click={() => dispatch('openMatch', selectedMatch)}>✏️ Editar</button>
            <button class="btn btn-d" on:click={() => handleDelete(selectedMatch.id)}>🗑️ Eliminar</button>
          </div>
        </div>

        <!-- Lineup -->
        <section class="detail-section">
          <h3 class="section-title">Alineación</h3>
          {#if selectedMatch.formation && FORMATIONS[selectedMatch.formation]}
            <div class="lineup-grid">
              {#each getPositions(selectedMatch.formation) as pos}
                {@const pid = (selectedMatch.lineup || {})[pos.id]}
                {@const p = pid ? getPlayer(pid) : null}
                {@const roleColor = ROLE_COLORS[pos.role]}
                <div class="lineup-slot">
                  <span
                    class="role-pill"
                    style="background:{roleColor.bg}; color:{roleColor.txt}"
                  >{pos.lbl}</span>
                  <span class="slot-player">{p ? dispName(p) : '—'}</span>
                </div>
              {/each}
            </div>
          {:else}
            <p class="no-data">Formación no registrada</p>
          {/if}
        </section>

        <!-- Events -->
        <section class="detail-section">
          <h3 class="section-title">Eventos</h3>
          {#if (selectedMatch.events || []).length === 0}
            <p class="no-data">Sin eventos registrados</p>
          {:else}
            <ul class="events-list">
              {#each selectedMatch.events as ev}
                {@const ep = getPlayer(ev.playerId)}
                <li class="event-item">
                  <span class="ev-icon">{eventIcon(ev.type)}</span>
                  <span class="ev-label">{eventLabel(ev.type)}</span>
                  <span class="ev-player">{ep ? dispName(ep) : '—'}</span>
                  {#if ev.minute}
                    <span class="ev-min">min {ev.minute}</span>
                  {/if}
                </li>
              {/each}
            </ul>
          {/if}
        </section>
      </div>
    {:else}
      <div class="no-selection">
        <p>Seleccioná un partido para ver el detalle</p>
      </div>
    {/if}

  </main>

  <!-- Season table — sibling del grid para poder reordenarla en mobile -->
  <div class="season-card">
      <h3 class="section-title">Tabla de la temporada</h3>
      {#if statsRows.length === 0}
        <p class="no-data">Sin datos suficientes</p>
      {:else}
        <div class="table-wrap">
          <table class="stats-table">
            <thead>
              <tr>
                <th>Jugador</th>
                <th title="Partidos jugados">PJ</th>
                <th>⚽</th>
                <th>🎯</th>
                <th>🟨</th>
                <th>🟥</th>
                <th title="Porcentaje de victorias">%V</th>
              </tr>
            </thead>
            <tbody>
              {#each statsRows as row}
                <tr class:top-scorer={row.player?.id === topScorerPid}>
                  <td class="td-name">{dispName(row.player)}</td>
                  <td>{row.played}</td>
                  <td>{row.goals}</td>
                  <td>{row.assists}</td>
                  <td>{row.yellow}</td>
                  <td>{row.red}</td>
                  <td>{row.pct}%</td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      {/if}
    </div>
</div>

<style>
  .historial-layout {
    display: grid;
    grid-template-columns: 300px 1fr;
    grid-template-rows: 1fr auto;
    gap: 0;
    height: calc(100vh - 52px);
    overflow: hidden;
  }

  /* sidebar ocupa ambas filas en desktop */
  .sidebar      { grid-column: 1; grid-row: 1 / 3; }
  .detail-panel { grid-column: 2; grid-row: 1; overflow-y: auto; }
  .season-card  { grid-column: 2; grid-row: 2; overflow-y: auto; max-height: 40vh; }

  /* ── Sidebar ── */
  .sidebar {
    background: var(--bg2);
    border-right: 1px solid var(--border);
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  .sidebar-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 14px 14px 10px;
    border-bottom: 1px solid var(--border);
    flex-shrink: 0;
  }

  .sidebar-title {
    font-size: .9rem;
    font-weight: 700;
    margin: 0;
    color: var(--txt);
  }

  .match-list {
    overflow-y: auto;
    flex: 1;
    padding: 8px;
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .empty-list {
    text-align: center;
    color: var(--txt2);
    padding: 32px 16px;
    font-size: .88rem;
  }
  .empty-sub {
    font-size: .78rem;
    margin-top: 4px;
    opacity: .7;
  }

  .match-card {
    background: var(--card);
    border: 1px solid var(--border);
    border-radius: 10px;
    padding: 10px 12px;
    cursor: pointer;
    transition: border-color .15s, background .15s;
    flex-shrink: 0;
  }
  .match-card:hover { border-color: var(--blue); }
  .match-card.selected {
    border-color: var(--blue);
    background: #1c2333;
  }

  .match-card-top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 2px;
  }

  .match-date {
    font-size: .72rem;
    color: var(--txt2);
  }

  .match-competition {
    font-size: .65rem;
    font-weight: 700;
    color: var(--blue);
    text-transform: uppercase;
    letter-spacing: .05em;
    margin-top: 1px;
  }

  .detail-competition {
    font-size: .72rem;
    font-weight: 700;
    color: var(--blue);
    text-transform: uppercase;
    letter-spacing: .05em;
    padding: 2px 8px;
    background: rgba(88,166,255,.1);
    border-radius: 10px;
  }

  .match-opponent {
    font-size: .82rem;
    color: var(--txt2);
    margin-bottom: 4px;
  }

  .match-score {
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .score-num {
    font-size: 1.3rem;
    font-weight: 800;
    color: var(--txt);
  }

  .score-sep {
    font-size: 1rem;
    color: var(--txt2);
  }

  /* Result badge */
  .result-badge {
    font-size: .68rem;
    font-weight: 700;
    padding: 2px 7px;
    border-radius: 20px;
    background: var(--card);
    color: var(--txt2);
  }
  .result-badge.win  { background: rgba(63,185,80,.18); color: var(--green); }
  .result-badge.loss { background: rgba(248,81,73,.18);  color: var(--red); }
  .result-badge.draw { background: rgba(139,148,158,.15); color: var(--txt2); }
  .result-badge.lg   { font-size: .8rem; padding: 3px 10px; }

  /* ── Detail panel ── */
  .detail-panel {
    overflow-y: auto;
    padding: 16px;
    display: flex;
    flex-direction: column;
    gap: 14px;
    background: var(--bg);
  }

  .no-selection {
    text-align: center;
    color: var(--txt2);
    padding: 40px;
    font-size: .88rem;
  }

  .detail-card, .season-card {
    background: var(--bg2);
    border: 1px solid var(--border);
    border-radius: 12px;
    padding: 16px 18px;
  }

  .detail-header {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    flex-wrap: wrap;
    margin-bottom: 14px;
    padding-bottom: 14px;
    border-bottom: 1px solid var(--border);
  }

  .detail-meta {
    display: flex;
    flex-direction: column;
    gap: 3px;
    flex: 1;
  }

  .detail-date {
    font-size: .78rem;
    color: var(--txt2);
  }

  .detail-vs {
    font-size: .95rem;
    color: var(--txt);
  }

  .detail-score {
    font-size: 2rem;
    font-weight: 800;
    color: var(--txt);
    letter-spacing: 2px;
    white-space: nowrap;
  }

  .detail-actions {
    display: flex;
    gap: 6px;
    align-items: center;
    flex-shrink: 0;
  }

  /* ── Sections ── */
  .detail-section {
    margin-bottom: 14px;
  }
  .detail-section:last-child { margin-bottom: 0; }

  .section-title {
    font-size: .78rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: .05em;
    color: var(--txt2);
    margin: 0 0 10px;
  }

  /* ── Lineup grid ── */
  .lineup-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(110px, 1fr));
    gap: 7px;
  }

  .lineup-slot {
    background: var(--card);
    border: 1px solid var(--border);
    border-radius: 8px;
    padding: 6px 8px;
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .role-pill {
    font-size: .65rem;
    font-weight: 700;
    padding: 2px 5px;
    border-radius: 4px;
    flex-shrink: 0;
  }

  .slot-player {
    font-size: .78rem;
    color: var(--txt);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  /* ── Events list ── */
  .events-list {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 5px;
  }

  .event-item {
    display: flex;
    align-items: center;
    gap: 7px;
    background: var(--card);
    border-radius: 7px;
    padding: 5px 10px;
    font-size: .82rem;
  }

  .ev-icon { font-size: 1rem; flex-shrink: 0; }
  .ev-label { color: var(--txt2); font-size: .74rem; }
  .ev-player { color: var(--txt); font-weight: 600; }
  .ev-min { color: var(--txt2); font-size: .72rem; margin-left: auto; }

  .no-data {
    color: var(--txt2);
    font-size: .82rem;
    margin: 0;
  }

  /* ── Season table ── */
  .table-wrap {
    overflow-x: auto;
  }

  .stats-table {
    width: 100%;
    border-collapse: collapse;
    font-size: .82rem;
  }

  .stats-table th {
    text-align: left;
    padding: 6px 8px;
    color: var(--txt2);
    font-size: .72rem;
    font-weight: 700;
    border-bottom: 1px solid var(--border);
    white-space: nowrap;
  }

  .stats-table th:not(:first-child) { text-align: center; }

  .stats-table td {
    padding: 7px 8px;
    border-bottom: 1px solid rgba(48,54,61,.6);
    color: var(--txt);
    vertical-align: middle;
  }

  .stats-table td:not(:first-child) { text-align: center; }

  .stats-table tr:last-child td { border-bottom: none; }

  .stats-table tr.top-scorer td { color: var(--orange); font-weight: 700; }
  .stats-table tr.top-scorer .td-name::after { content: ' ⚽'; }

  .td-name {
    font-weight: 600;
    max-width: 120px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  /* ── Mobile ── */
  @media (max-width: 768px) {
    .historial-layout {
      grid-template-columns: 1fr;
      grid-template-rows: auto;
      height: auto;
      overflow: visible;
      display: flex;
      flex-direction: column;
    }

    /* Reordenamiento mobile: temporada arriba, luego partidos, luego detalle */
    .season-card  { order: 1; max-height: none; border-right: none; border-bottom: 1px solid var(--border); }
    .sidebar      { order: 2; border-right: none; border-bottom: 1px solid var(--border); }
    .detail-panel { order: 3; overflow-y: visible; padding: 12px; }

    .match-list {
      max-height: 40vh;
      overflow-y: auto;
    }

    .detail-header {
      flex-direction: column;
      gap: 8px;
    }

    .detail-score { font-size: 1.5rem; }

    .lineup-grid {
      grid-template-columns: repeat(auto-fill, minmax(90px, 1fr));
    }
  }
</style>
