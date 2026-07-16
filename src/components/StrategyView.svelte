<script>
  import { settings, players, plays, savePlay, deletePlay, showToast, ui, saveSettings } from '../lib/stores.js';
  import { avc, dispIni, clampPct } from '../lib/helpers.js';
  import { FORMATIONS } from '../lib/constants.js';
  import { addDoc } from 'firebase/firestore';
  import { playsCol } from '../lib/firebase.js';

  // ── Current play ────────────────────────────────────────────────────────────
  $: currentPlay = $plays.find(p => p.id === $settings.currentPlayId) ?? null;
  $: currentStep = $ui.currentStep ?? 0;
  $: steps = currentPlay?.steps ?? [];
  $: stepPositions = steps[currentStep]?.positions ?? {};

  // Tokens = players who have positions in the current step
  $: tokens = Object.entries(stepPositions)
    .map(([pid, pos]) => {
      const player = $players.find(p => p.id === pid);
      return player ? { player, pos } : null;
    })
    .filter(Boolean);

  // ── Play management ─────────────────────────────────────────────────────────
  function openPlay(id) {
    saveSettings({ currentPlayId: id });
    ui.update(s => ({ ...s, currentStep: 0, playing: false }));
  }

  async function newPlay() {
    // Build initial positions from current lineup + formation
    const formation = $settings.formation || '2-3-1';
    const slots = FORMATIONS[formation]?.positions ?? [];
    const lineup = $settings.lineup ?? {};
    const positions = {};
    for (const slot of slots) {
      const pid = lineup[slot.id];
      if (pid) positions[pid] = { x: slot.x, y: slot.y };
    }
    const playData = {
      name: `Jugada ${$plays.length + 1}`,
      formation,
      steps: [{ positions }],
    };
    const ref = await addDoc(playsCol(), playData);
    saveSettings({ currentPlayId: ref.id });
    ui.update(s => ({ ...s, currentStep: 0 }));
    showToast('Nueva jugada creada');
  }

  async function deleteCurrentPlay(id, e) {
    e.stopPropagation();
    if (!confirm('¿Eliminar jugada?')) return;
    if ($settings.currentPlayId === id) {
      saveSettings({ currentPlayId: null });
    }
    await deletePlay(id);
    showToast('Jugada eliminada');
  }

  function setPlayName(val) {
    if (!currentPlay) return;
    const { id, ...data } = currentPlay;
    savePlay({ ...data, name: val }, id);
  }

  // ── Step management ─────────────────────────────────────────────────────────
  function selectStep(idx) {
    ui.update(s => ({ ...s, currentStep: idx, playing: false }));
  }

  function addStep() {
    if (!currentPlay) return;
    // Duplicate last step
    const lastStep = steps[steps.length - 1] ?? { positions: {} };
    const newSteps = [...steps, { positions: { ...lastStep.positions } }];
    const { id, ...data } = currentPlay;
    savePlay({ ...data, steps: newSteps }, id);
    ui.update(s => ({ ...s, currentStep: newSteps.length - 1 }));
  }

  function deleteCurrentStep() {
    if (!currentPlay || steps.length <= 1) return;
    const newSteps = steps.filter((_, i) => i !== currentStep);
    const { id, ...data } = currentPlay;
    savePlay({ ...data, steps: newSteps }, id);
    ui.update(s => ({ ...s, currentStep: Math.min(currentStep, newSteps.length - 1) }));
  }

  // ── Play animation ───────────────────────────────────────────────────────────
  let playTimer = null;

  function togglePlay() {
    if ($ui.playing) {
      clearInterval(playTimer);
      ui.update(s => ({ ...s, playing: false }));
    } else {
      ui.update(s => ({ ...s, playing: true }));
      playTimer = setInterval(() => {
        ui.update(s => {
          const next = s.currentStep + 1;
          if (next >= steps.length) {
            clearInterval(playTimer);
            return { ...s, playing: false, currentStep: 0 };
          }
          return { ...s, currentStep: next };
        });
      }, 900);
    }
  }

  // ── Drag tokens on strategy pitch ───────────────────────────────────────────
  let pitchEl = null;
  let draggingToken = null;

  function onTokenPointerDown(e, playerId) {
    e.preventDefault();
    draggingToken = playerId;
    e.currentTarget.setPointerCapture(e.pointerId);
  }

  function onTokenPointerMove(e) {
    if (!draggingToken || !pitchEl) return;
    const rect = pitchEl.getBoundingClientRect();
    const x = clampPct(((e.clientX - rect.left) / rect.width) * 100);
    const y = clampPct(((e.clientY - rect.top) / rect.height) * 100);
    // Update local view immediately (before saving)
    stepPositions = { ...stepPositions, [draggingToken]: { x, y } };
  }

  function onTokenPointerUp(e) {
    if (!draggingToken || !currentPlay) { draggingToken = null; return; }
    // Persist the updated positions
    const newSteps = steps.map((step, i) =>
      i === currentStep
        ? { ...step, positions: { ...stepPositions } }
        : step
    );
    const { id, ...data } = currentPlay;
    savePlay({ ...data, steps: newSteps }, id);
    draggingToken = null;
  }
</script>

<div class="slayout">
  <!-- Left: plays list -->
  <aside class="sidebar">
    <div class="sh">
      <span class="stitle">Jugadas <span class="cnt">{$plays.length}</span></span>
      <button class="btn btn-p" on:click={newPlay}>+ Jugada</button>
    </div>
    <div class="plist">
      {#each $plays as play}
        <!-- svelte-ignore a11y-no-static-element-interactions -->
        <div
          class="playcard"
          class:active={play.id === $settings.currentPlayId}
          on:click={() => openPlay(play.id)}
        >
          <div class="pc-info">
            <div class="pc-name">{play.name}</div>
            <div class="pc-sub">{play.formation} · {play.steps?.length ?? 0} pasos</div>
          </div>
          <button class="bico" on:click={e => deleteCurrentPlay(play.id, e)}>🗑</button>
        </div>
      {/each}
      {#if $plays.length === 0}
        <div class="empty">No hay jugadas. Creá una para comenzar.</div>
      {/if}
    </div>
  </aside>

  <!-- Center: strategy pitch -->
  <main class="center">
    {#if currentPlay}
      <!-- Play name -->
      <input
        class="pmname-input"
        value={currentPlay.name}
        on:change={e => setPlayName(e.target.value)}
        placeholder="Nombre de la jugada"
      />

      <!-- Strategy pitch -->
      <div class="pc">
        <div class="pitch" bind:this={pitchEl}>
          <div class="pstripes"></div>
          <svg class="pmarks" viewBox="0 0 100 160" preserveAspectRatio="none">
            <rect x="2" y="2" width="96" height="156" fill="none" stroke="rgba(255,255,255,.18)" stroke-width=".8"/>
            <line x1="2" y1="80" x2="98" y2="80" stroke="rgba(255,255,255,.18)" stroke-width=".8"/>
            <circle cx="50" cy="80" r="13" fill="none" stroke="rgba(255,255,255,.14)" stroke-width=".8"/>
            <rect x="22" y="2" width="56" height="24" fill="none" stroke="rgba(255,255,255,.14)" stroke-width=".8"/>
            <rect x="22" y="134" width="56" height="24" fill="none" stroke="rgba(255,255,255,.14)" stroke-width=".8"/>
          </svg>
          <div class="vignette"></div>

          <!-- Player tokens -->
          {#each tokens as { player, pos }}
            {@const idx = $players.findIndex(p => p.id === player.id)}
            {@const [bg, tc] = avc(player.id, idx)}
            <!-- svelte-ignore a11y-no-static-element-interactions -->
            <div
              class="tk"
              class:dragging={draggingToken === player.id}
              style="left:{pos.x}%; top:{pos.y}%; background:{bg}; color:{tc};"
              on:pointerdown={e => onTokenPointerDown(e, player.id)}
              on:pointermove={onTokenPointerMove}
              on:pointerup={onTokenPointerUp}
            >
              <div class="tk-ini">{dispIni(player)}</div>
              <div class="tk-nm">{player.nickname || player.name}</div>
            </div>
          {/each}
        </div>
      </div>

      <!-- Step tabs -->
      <div class="steps-bar">
        {#each steps as _, i}
          {#if i > 0}<span class="step-arrow">→</span>{/if}
          <button
            class="step-btn"
            class:active={i === currentStep}
            on:click={() => selectStep(i)}
          >{i + 1}</button>
        {/each}
      </div>

      <!-- Play controls -->
      <div class="play-controls">
        <button class="btn btn-p" on:click={togglePlay}>
          {$ui.playing ? '⏹ Detener' : '▶ Reproducir'}
        </button>
        <button class="btn btn-s" on:click={addStep}>+ Paso</button>
        <button class="btn btn-d" on:click={deleteCurrentStep} disabled={steps.length <= 1}>🗑 Paso</button>
      </div>
    {:else}
      <div class="no-play">
        <span>Seleccioná o creá una jugada</span>
      </div>
    {/if}
  </main>

  <!-- Right: empty (reuse stats panel style) -->
  <aside class="rpanel">
    {#if currentPlay}
      <div class="pnlcard">
        <div class="pnltitle">Jugadores en escena</div>
        {#each tokens as { player }}
          {@const idx = $players.findIndex(p => p.id === player.id)}
          {@const [bg, tc] = avc(player.id, idx)}
          <div class="tk-row">
            <div class="tk-av" style="background:{bg}; color:{tc};">{dispIni(player)}</div>
            <span class="tk-name">{player.nickname || player.name}</span>
            <span class="tk-pos">{player.position}</span>
          </div>
        {/each}
        {#if tokens.length === 0}
          <div class="empty-small">Sin jugadores. Asigná una alineación primero.</div>
        {/if}
      </div>
    {/if}
  </aside>
</div>

<style>
  .slayout {
    display: grid;
    grid-template-columns: 250px 1fr 220px;
    min-height: calc(100vh - 56px);
    background: var(--bg);
  }

  .sidebar {
    background: var(--bg2);
    border-right: 1px solid var(--border);
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding: 10px 8px;
    overflow: hidden;
  }

  .sh {
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-shrink: 0;
  }
  .stitle { font-size: .75rem; font-weight: 700; color: var(--txt2); text-transform: uppercase; letter-spacing: .06em; }
  .cnt { background: var(--card); border-radius: 10px; padding: 1px 6px; font-size: .7rem; color: var(--txt); margin-left: 4px; }

  .plist {
    flex: 1;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: 5px;
  }

  .playcard {
    background: var(--card);
    border: 1px solid var(--border);
    border-radius: 9px;
    padding: 8px 9px;
    display: flex;
    align-items: center;
    gap: 7px;
    cursor: pointer;
    transition: all .15s;
  }
  .playcard:hover { border-color: var(--blue); }
  .playcard.active { border-color: var(--blue); background: var(--bg2); }
  .pc-info { flex: 1; min-width: 0; }
  .pc-name { font-size: .8rem; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .pc-sub  { font-size: .65rem; color: var(--txt2); margin-top: 1px; }

  .bico {
    background: none; border: none;
    color: var(--txt2); cursor: pointer;
    padding: 3px 5px; border-radius: 3px; font-size: .75rem;
    transition: all .15s; flex-shrink: 0;
  }
  .bico:hover { background: var(--border); color: var(--txt); }

  .empty {
    color: var(--txt2); font-size: .82rem; padding: 16px 4px; text-align: center;
  }

  /* Center */
  .center {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 10px;
    padding: 12px;
    overflow-y: auto;
  }

  .pmname-input {
    width: 100%;
    max-width: 460px;
    background: var(--card);
    border: 1px solid var(--border);
    border-radius: 6px;
    padding: 5px 8px;
    color: var(--txt);
    font-size: .82rem;
    font-weight: 600;
    outline: none;
  }
  .pmname-input:focus { border-color: var(--blue); }

  .pc { width: 100%; max-width: 460px; }

  /* Strategy pitch */
  .pitch {
    position: relative;
    width: 100%;
    aspect-ratio: 65 / 100;
    max-height: calc(100vh - 260px);
    border-radius: 10px;
    overflow: hidden;
    box-shadow: 0 0 0 1px var(--border);
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

  /* Tokens */
  .tk {
    position: absolute;
    transform: translate(-50%, -50%);
    width: 46px; height: 46px;
    border-radius: 50%;
    display: flex; flex-direction: column;
    align-items: center; justify-content: center;
    cursor: grab;
    z-index: 11;
    border: 2px solid #fff;
    box-shadow: 0 2px 8px rgba(0,0,0,.5);
    touch-action: none;
    transition: left .9s cubic-bezier(.4,0,.2,1), top .9s cubic-bezier(.4,0,.2,1);
    user-select: none;
  }
  .tk.dragging { cursor: grabbing; transition: none; z-index: 15; }
  .tk-ini { font-size: .68rem; font-weight: 700; color: #fff; }
  .tk-nm  { font-size: .42rem; color: rgba(255,255,255,.9); margin-top: 1px; white-space: nowrap; }

  /* Step controls */
  .steps-bar {
    display: flex;
    gap: 5px;
    flex-wrap: wrap;
    align-items: center;
    justify-content: center;
    width: 100%;
    max-width: 460px;
    min-height: 30px;
  }

  .step-btn {
    width: 28px; height: 28px;
    border-radius: 50%;
    border: 2px solid var(--border);
    background: var(--card);
    color: var(--txt2);
    font-size: .72rem;
    font-weight: 700;
    cursor: pointer;
    transition: all .15s;
    flex-shrink: 0;
  }
  .step-btn.active { border-color: var(--blue); color: var(--blue); background: rgba(88,166,255,.18); }
  .step-arrow { color: var(--txt2); font-size: .7rem; }

  .play-controls {
    display: flex;
    gap: 7px;
    align-items: center;
    flex-wrap: wrap;
    width: 100%;
    max-width: 460px;
    justify-content: center;
  }

  .no-play {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--txt2);
    font-size: .9rem;
  }

  /* Right panel */
  .rpanel {
    background: var(--bg2);
    border-left: 1px solid var(--border);
    padding: 10px;
    overflow-y: auto;
  }

  .pnlcard {
    background: var(--card);
    border: 1px solid var(--border);
    border-radius: 10px;
    padding: 12px;
  }
  .pnltitle {
    font-size: .72rem; font-weight: 700; color: var(--txt2);
    text-transform: uppercase; letter-spacing: .06em; margin-bottom: 10px;
  }

  .tk-row {
    display: flex; align-items: center; gap: 7px;
    padding: 5px 0; border-bottom: 1px solid var(--border); font-size: .78rem;
  }
  .tk-row:last-child { border: none; }
  .tk-av {
    width: 26px; height: 26px; border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    font-size: .6rem; font-weight: 700; flex-shrink: 0;
  }
  .tk-name { flex: 1; font-weight: 600; }
  .tk-pos  { color: var(--txt2); font-size: .7rem; }

  .empty-small { color: var(--txt2); font-size: .78rem; padding: 8px 0; }

  @media (max-width: 768px) {
    .slayout { grid-template-columns: 1fr; }
    .sidebar { border-right: none; border-bottom: 1px solid var(--border); max-height: 35vh; }
    .rpanel { display: none; }
  }
</style>
