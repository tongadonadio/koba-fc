<script>
  import { createEventDispatcher } from 'svelte';
  import { settings, players, saveMatch, showToast } from '../lib/stores.js';
  import { dispName } from '../lib/helpers.js';
  import { FORMATIONS, ROLE_COLORS } from '../lib/constants.js';

  export let match = null; // null = new, object = edit

  const dispatch = createEventDispatcher();

  const FORMATIONS_LIST = ['2-3-1', '3-2-1', '3-1-2'];

  const EVENT_TYPES = [
    { id: 'goal',       label: '⚽ Gol' },
    { id: 'assist',     label: '🎯 Asist.' },
    { id: 'yellowCard', label: '🟨 Amarilla' },
    { id: 'redCard',    label: '🟥 Roja' },
  ];

  function today() {
    return new Date().toISOString().slice(0, 10);
  }

  // ── Form state ───────────────────────────────────────────────────────────────
  const COMPETITIONS = ['Copa Intermedia', 'Liga', 'Torneo', 'Amistoso'];

  let form = match ? {
    date:          match.date          ?? today(),
    opponent:      match.opponent      ?? '',
    competition:   match.competition   ?? '',
    goalsFor:      match.goalsFor      ?? 0,
    goalsAgainst:  match.goalsAgainst  ?? 0,
    formation:     match.formation     ?? $settings.formation,
    lineup:        { ...(match.lineup  ?? {}) },
    events:        [...(match.events   ?? [])],
  } : {
    date:         today(),
    opponent:     '',
    competition:  '',
    goalsFor:     0,
    goalsAgainst: 0,
    formation:    $settings.formation,
    lineup:       {},
    events:       [],
  };

  // ── Reactive slots for current formation ────────────────────────────────────
  $: positions = FORMATIONS[form.formation]?.positions ?? [];

  // Players assigned in current lineup (for event selector)
  $: assignedPlayers = Object.entries(form.lineup)
    .filter(([, pid]) => !!pid)
    .map(([, pid]) => $players.find(p => p.id === pid))
    .filter(Boolean);

  // ── New event state ──────────────────────────────────────────────────────────
  let newEv = { type: 'goal', playerId: '', minute: '' };

  // ── Validation ───────────────────────────────────────────────────────────────
  let opponentError = '';

  // ── Actions ─────────────────────────────────────────────────────────────────
  function useCurrentLineup() {
    form = { ...form, lineup: { ...$settings.lineup } };
  }

  function setFormation(f) {
    form = { ...form, formation: f };
  }

  function addEvent() {
    if (!newEv.playerId) return;
    const ev = {
      type:     newEv.type,
      playerId: newEv.playerId,
    };
    if (newEv.minute !== '' && newEv.minute !== null) {
      ev.minute = parseInt(newEv.minute);
    }
    form.events = [...form.events, ev];
    newEv = { type: newEv.type, playerId: '', minute: '' };
  }

  function removeEvent(i) {
    form.events = form.events.filter((_, idx) => idx !== i);
  }

  function eventIcon(type) {
    if (type === 'goal')       return '⚽';
    if (type === 'assist')     return '🎯';
    if (type === 'yellowCard') return '🟨';
    if (type === 'redCard')    return '🟥';
    return '•';
  }

  function getPlayer(id) {
    return $players.find(p => p.id === id) ?? null;
  }

  async function handleSave() {
    opponentError = '';
    if (!form.opponent.trim()) {
      opponentError = 'El nombre del rival es requerido';
      return;
    }

    const data = {
      date:         form.date,
      opponent:     form.opponent.trim(),
      competition:  form.competition.trim(),
      goalsFor:     Number(form.goalsFor),
      goalsAgainst: Number(form.goalsAgainst),
      formation:    form.formation,
      lineup:       form.lineup,
      events:       form.events,
    };

    await saveMatch(data, match?.id);
    showToast(match?.id ? 'Partido actualizado' : 'Partido guardado');
    dispatch('close');
  }

  // Close on Escape
  function onKeydown(e) {
    if (e.key === 'Escape') dispatch('close');
  }
</script>

<svelte:window on:keydown={onKeydown} />

<!-- svelte-ignore a11y-no-static-element-interactions -->
<div class="overlay" on:click|self={() => dispatch('close')}>
  <div class="modal">
    <div class="mtitle">{match ? 'Editar partido' : 'Nuevo partido'}</div>

    <!-- ── 1. Info del partido ── -->
    <div class="msection-title">Info del partido</div>

    <div class="frow">
      <div class="fg">
        <label class="flbl">Fecha</label>
        <input class="fi" type="date" bind:value={form.date} />
      </div>
    </div>

    <div class="fg">
      <label class="flbl">Rival *</label>
      <input
        class="fi"
        class:error={!!opponentError}
        bind:value={form.opponent}
        placeholder="Nombre del equipo rival"
      />
      {#if opponentError}
        <span class="field-error">{opponentError}</span>
      {/if}
    </div>

    <div class="fg">
      <label class="flbl">Competencia</label>
      <div class="comp-chips">
        {#each COMPETITIONS as c}
          <button
            type="button"
            class="comp-chip"
            class:active={form.competition === c}
            on:click={() => form.competition = form.competition === c ? '' : c}
          >{c}</button>
        {/each}
      </div>
      <input class="fi" style="margin-top:6px" bind:value={form.competition} placeholder="O escribí el nombre del torneo…" />
    </div>

    <div class="fg">
      <label class="flbl">Resultado</label>
      <div class="score-row">
        <span class="score-team-lbl">Koba</span>
        <input class="fi score-input" type="number" min="0" max="99" bind:value={form.goalsFor} />
        <span class="score-sep">—</span>
        <input class="fi score-input" type="number" min="0" max="99" bind:value={form.goalsAgainst} />
        <span class="score-team-lbl">Rival</span>
      </div>
    </div>

    <div class="fg">
      <label class="flbl">Formación</label>
      <div class="ftab-group">
        {#each FORMATIONS_LIST as f}
          <button
            class="ftab"
            class:active={form.formation === f}
            on:click={() => setFormation(f)}
          >{f}</button>
        {/each}
      </div>
    </div>

    <!-- ── 2. Alineación ── -->
    <div class="msection-title">
      Alineación que jugó
      <button class="btn btn-s ml-auto" on:click={useCurrentLineup}>Usar alineación actual</button>
    </div>

    <div class="lineup-grid">
      {#each positions as pos}
        {@const roleColor = ROLE_COLORS[pos.role]}
        <div class="lineup-slot">
          <span class="role-pill" style="background:{roleColor.bg}; color:{roleColor.txt}">{pos.lbl}</span>
          <select
            class="fi slot-select"
            bind:value={form.lineup[pos.id]}
          >
            <option value="">—</option>
            {#each $players as p (p.id)}
              <option value={p.id}>{dispName(p)}{p.number != null ? ' #'+p.number : ''}</option>
            {/each}
          </select>
        </div>
      {/each}
    </div>

    <!-- ── 3. Eventos ── -->
    <div class="msection-title">Eventos del partido</div>

    {#if form.events.length > 0}
      <ul class="events-list">
        {#each form.events as ev, i}
          {@const ep = getPlayer(ev.playerId)}
          <li class="event-item">
            <span class="ev-icon">{eventIcon(ev.type)}</span>
            <span class="ev-player">{ep ? dispName(ep) : '—'}</span>
            {#if ev.minute}
              <span class="ev-min">min {ev.minute}</span>
            {/if}
            <button class="ev-remove" on:click={() => removeEvent(i)} title="Eliminar">✕</button>
          </li>
        {/each}
      </ul>
    {/if}

    <!-- Add event form -->
    <div class="add-event-form">
      <div class="ev-type-btns">
        {#each EVENT_TYPES as et}
          <button
            class="ev-type-btn"
            class:active={newEv.type === et.id}
            on:click={() => newEv = { ...newEv, type: et.id }}
          >{et.label}</button>
        {/each}
      </div>
      <div class="ev-row">
        <select class="fi ev-player-select" bind:value={newEv.playerId}>
          <option value="">Jugador</option>
          {#each assignedPlayers as p (p.id)}
            <option value={p.id}>{dispName(p)}</option>
          {/each}
        </select>
        <input
          class="fi ev-min-input"
          type="number"
          min="1"
          max="90"
          placeholder="min"
          bind:value={newEv.minute}
        />
        <button
          class="btn btn-p ev-add-btn"
          on:click={addEvent}
          disabled={!newEv.playerId}
        >+ Agregar</button>
      </div>
    </div>

    <!-- ── Footer ── -->
    <div class="mactions">
      <button class="btn btn-s" on:click={() => dispatch('close')}>Cancelar</button>
      <button class="btn btn-p" on:click={handleSave}>Guardar partido</button>
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
    padding: 22px;
    width: 480px;
    max-width: 94vw;
    max-height: 90vh;
    overflow-y: auto;
    animation: mdin .18s ease;
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  @keyframes mdin {
    from { transform: scale(.9); opacity: 0; }
    to   { transform: scale(1);  opacity: 1; }
  }

  .mtitle {
    font-size: 1rem;
    font-weight: 700;
    margin-bottom: 4px;
  }

  .msection-title {
    font-size: .72rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: .05em;
    color: var(--txt2);
    padding-top: 6px;
    border-top: 1px solid var(--border);
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .ml-auto { margin-left: auto; }

  /* Form helpers */
  .fg { display: flex; flex-direction: column; gap: 4px; }
  .flbl { font-size: .75rem; color: var(--txt2); font-weight: 600; }
  .fi {
    background: var(--bg);
    border: 1px solid var(--border);
    border-radius: 7px;
    color: var(--txt);
    font-size: .85rem;
    padding: 7px 10px;
    outline: none;
    transition: border-color .15s;
  }
  .fi:focus { border-color: var(--blue); }
  .fi.error { border-color: var(--red); }
  .frow { display: flex; gap: 10px; }
  .frow .fg { flex: 1; }

  .field-error {
    font-size: .72rem;
    color: var(--red);
  }

  .comp-chips {
    display: flex;
    gap: 6px;
    flex-wrap: wrap;
  }
  .comp-chip {
    padding: 3px 10px;
    border-radius: 20px;
    border: 1px solid var(--border);
    background: transparent;
    color: var(--txt2);
    font-size: .75rem;
    cursor: pointer;
    transition: all .15s;
  }
  .comp-chip.active {
    border-color: var(--blue);
    color: var(--blue);
    background: rgba(88,166,255,.1);
  }
  .comp-chip:hover:not(.active) {
    border-color: var(--txt2);
    color: var(--txt);
  }

  /* Score row */
  .score-row {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .score-input {
    width: 56px;
    text-align: center;
    font-size: 1.1rem;
    font-weight: 700;
    padding: 6px 4px;
  }
  .score-sep {
    font-size: 1.1rem;
    color: var(--txt2);
    font-weight: 700;
  }
  .score-team-lbl {
    font-size: .78rem;
    color: var(--txt2);
    white-space: nowrap;
  }

  /* Formation tabs */
  .ftab-group {
    display: flex;
    gap: 4px;
    flex-wrap: wrap;
  }
  .ftab {
    padding: 5px 14px;
    border-radius: 6px;
    border: 1px solid var(--border);
    background: var(--bg);
    color: var(--txt2);
    font-size: .8rem;
    font-weight: 700;
    cursor: pointer;
    transition: all .15s;
  }
  .ftab.active { background: var(--green); color: #000; border-color: var(--green); }
  .ftab:hover:not(.active) { background: var(--card); color: var(--txt); }

  /* Lineup grid */
  .lineup-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
    gap: 7px;
  }

  .lineup-slot {
    display: flex;
    align-items: center;
    gap: 5px;
  }

  .role-pill {
    font-size: .62rem;
    font-weight: 700;
    padding: 2px 5px;
    border-radius: 4px;
    flex-shrink: 0;
  }

  .slot-select {
    flex: 1;
    padding: 5px 6px;
    font-size: .78rem;
    min-width: 0;
  }

  /* Events */
  .events-list {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 4px;
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

  .ev-icon { font-size: .95rem; flex-shrink: 0; }
  .ev-player { color: var(--txt); font-weight: 600; flex: 1; }
  .ev-min { color: var(--txt2); font-size: .72rem; white-space: nowrap; }
  .ev-remove {
    background: none;
    border: none;
    color: var(--txt2);
    cursor: pointer;
    font-size: .75rem;
    padding: 0 2px;
    flex-shrink: 0;
    transition: color .15s;
  }
  .ev-remove:hover { color: var(--red); }

  /* Add event form */
  .add-event-form {
    background: var(--card);
    border: 1px solid var(--border);
    border-radius: 9px;
    padding: 10px;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .ev-type-btns {
    display: flex;
    gap: 4px;
    flex-wrap: wrap;
  }

  .ev-type-btn {
    padding: 4px 9px;
    border-radius: 5px;
    border: 1px solid var(--border);
    background: var(--bg);
    color: var(--txt2);
    font-size: .74rem;
    cursor: pointer;
    transition: all .15s;
    white-space: nowrap;
  }
  .ev-type-btn.active { border-color: var(--blue); color: var(--blue); background: rgba(88,166,255,.1); }
  .ev-type-btn:hover:not(.active) { background: var(--bg2); color: var(--txt); }

  .ev-row {
    display: flex;
    gap: 6px;
    align-items: center;
    flex-wrap: wrap;
  }

  .ev-player-select {
    flex: 1;
    min-width: 100px;
    font-size: .8rem;
    padding: 6px 8px;
  }

  .ev-min-input {
    width: 62px;
    text-align: center;
    font-size: .8rem;
    padding: 6px 4px;
  }

  .ev-add-btn {
    font-size: .8rem;
    padding: 6px 12px;
    white-space: nowrap;
  }

  .ev-add-btn:disabled { opacity: .45; cursor: not-allowed; }

  /* Footer actions */
  .mactions {
    display: flex;
    gap: 7px;
    justify-content: flex-end;
    margin-top: 4px;
    padding-top: 10px;
    border-top: 1px solid var(--border);
  }

  @media (max-width: 520px) {
    .ev-row { flex-direction: column; align-items: stretch; }
    .ev-min-input { width: 100%; }
    .score-row { flex-wrap: wrap; gap: 6px; }
  }
</style>
