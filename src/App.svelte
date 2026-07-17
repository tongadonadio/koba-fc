<script>
  import { get } from 'svelte/store';
  import { initialized, settings, players, saveSettings, showToast, ui } from './lib/stores.js';
  import Header from './components/Header.svelte';
  import PlantelView from './components/PlantelView.svelte';
  import AlineacionView from './components/AlineacionView.svelte';
  import StrategyView from './components/StrategyView.svelte';
  import HistorialView from './components/HistorialView.svelte';
  import Toast from './components/Toast.svelte';
  import PlayerModal from './modals/PlayerModal.svelte';
  import PositionPickerModal from './modals/PositionPickerModal.svelte';
  import MatchModal from './modals/MatchModal.svelte';

  // ── Modal state ──────────────────────────────────────────────────────────────
  // type: null | 'player' | 'picker' | 'match'
  // data: player object (for 'player') | { slotId } (for 'picker') | match object or null (for 'match')
  let modalState = { type: null, data: null };

  function openPlayerModal(e) {
    modalState = { type: 'player', data: e.detail ?? null };
  }

  function closePicker() {
    ui.update(s => ({ ...s, selSlot: null }));
  }

  function handlePickerAssign(e) {
    const { slotId, playerId } = e.detail;
    const currentLineup = get(settings).lineup ?? {};
    const newLineup = { ...currentLineup, [slotId]: playerId };
    saveSettings({ lineup: newLineup });
    closePicker();
  }

  function handlePickerClear(e) {
    const { slotId } = e.detail;
    const newLineup = { ...(get(settings).lineup ?? {}) };
    delete newLineup[slotId];
    saveSettings({ lineup: newLineup });
    closePicker();
  }

  function openMatchModal(e) {
    modalState = { type: 'match', data: e.detail ?? null };
  }

  function closeModal() {
    modalState = { type: null, data: null };
  }

  // ── Export / Import ──────────────────────────────────────────────────────────
  function handleExport() {
    const data = {
      players: $players,
      settings: $settings,
      exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `koba-fc-backup-${new Date().toISOString().slice(0,10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Backup exportado');
  }

  async function handleImport(e) {
    const file = e.detail;
    if (!file) return;
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      showToast('Importación no implementada aún (usá Firestore)');
      // Full restore would require batch writes; placeholder for now
      console.log('Import data:', data);
    } catch {
      showToast('Error al leer el archivo');
    }
  }
</script>

<!-- Loading overlay while Firestore initialises -->
{#if !$initialized}
  <div class="loading-overlay">
    <img src="{import.meta.env.BASE_URL}logo.png" alt="Koba FC" class="loading-logo" />
    <span class="loading-txt">Conectando con el equipo…</span>
  </div>
{:else}
  <Header
    on:export={handleExport}
    on:import={handleImport}
  />

  {#if $settings.view === 'plantel'}
    <PlantelView on:openPlayerModal={openPlayerModal} />
  {:else if $settings.view === 'alineacion'}
    <AlineacionView />
  {:else if $settings.view === 'estrategias'}
    <StrategyView />
  {:else if $settings.view === 'historial'}
    <HistorialView on:openMatch={openMatchModal} />
  {/if}

  <!-- Modals -->
  {#if modalState.type === 'player'}
    <PlayerModal player={modalState.data} on:close={closeModal} />
  {/if}
  {#if $ui.selSlot}
    <PositionPickerModal
      slotId={$ui.selSlot}
      on:assign={handlePickerAssign}
      on:clear={handlePickerClear}
      on:close={closePicker}
    />
  {/if}
  {#if modalState.type === 'match'}
    <MatchModal match={modalState.data} on:close={closeModal} />
  {/if}

  <Toast />
{/if}

<style>
  .loading-overlay {
    position: fixed; inset: 0;
    background: var(--bg);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 14px;
    z-index: 9999;
  }

  .loading-logo {
    width: 96px;
    height: 96px;
    border-radius: 50%;
    animation: pulse-logo 1.8s ease-in-out infinite;
  }
  @keyframes pulse-logo {
    0%, 100% { opacity: 1; transform: scale(1); }
    50%       { opacity: .6; transform: scale(.92); }
  }
  .loading-txt {
    font-size: .88rem;
    color: var(--txt2);
  }
</style>
