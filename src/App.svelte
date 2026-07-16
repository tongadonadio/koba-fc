<script>
  import { initialized, settings, players, showToast } from './lib/stores.js';
  import Header from './components/Header.svelte';
  import PlantelView from './components/PlantelView.svelte';
  import StrategyView from './components/StrategyView.svelte';
  import Toast from './components/Toast.svelte';
  import PlayerModal from './modals/PlayerModal.svelte';
  import PositionPickerModal from './modals/PositionPickerModal.svelte';

  // ── Modal state ──────────────────────────────────────────────────────────────
  // type: null | 'player' | 'picker'
  // data: player object (for 'player') | { slotId } (for 'picker')
  let modalState = { type: null, data: null };

  function openPlayerModal(e) {
    modalState = { type: 'player', data: e.detail ?? null };
  }

  function openPicker(e) {
    modalState = { type: 'picker', data: e.detail };
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
    <div class="spinner"></div>
    <span class="loading-txt">Conectando con Firestore…</span>
  </div>
{:else}
  <Header
    on:export={handleExport}
    on:import={handleImport}
  />

  {#if $settings.view === 'plantel'}
    <PlantelView
      on:openPlayerModal={openPlayerModal}
      on:openPicker={openPicker}
    />
  {:else if $settings.view === 'estrategias'}
    <StrategyView />
  {/if}

  <!-- Modals -->
  {#if modalState.type === 'player'}
    <PlayerModal player={modalState.data} on:close={closeModal} />
  {:else if modalState.type === 'picker'}
    <PositionPickerModal slotId={modalState.data?.slotId} on:close={closeModal} />
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

  .loading-txt {
    font-size: .88rem;
    color: var(--txt2);
  }
</style>
