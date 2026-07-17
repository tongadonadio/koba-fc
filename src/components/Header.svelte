<script>
  import { createEventDispatcher } from 'svelte';
  import { settings, saveSettings } from '../lib/stores.js';

  const dispatch = createEventDispatcher();

  let editingName = false;
  let nameInput = '';

  function startEditName() {
    nameInput = $settings.name || 'Mi Equipo';
    editingName = true;
  }

  function commitName() {
    const trimmed = nameInput.trim();
    if (trimmed) saveSettings({ name: trimmed });
    editingName = false;
  }

  function onNameKey(e) {
    if (e.key === 'Enter')  commitName();
    if (e.key === 'Escape') editingName = false;
  }

  function setView(view) {
    saveSettings({ view });
  }

  // File import handler
  function handleImportFile(e) {
    const file = e.target.files[0];
    if (!file) return;
    dispatch('import', file);
    e.target.value = '';
  }
</script>

<header>
  <div class="header-main">
    <!-- Brand / team name -->
    <div class="brand">
      <img src="{import.meta.env.BASE_URL}logo.png" alt="Koba FC" class="logo-img" />
      {#if editingName}
        <!-- svelte-ignore a11y-autofocus -->
        <input
          class="name-input"
          bind:value={nameInput}
          on:blur={commitName}
          on:keydown={onNameKey}
          autofocus
        />
      {:else}
        <span class="team-name" on:click={startEditName} title="Editar nombre del equipo">
          {$settings.name || 'Mi Equipo'}
        </span>
      {/if}
    </div>

    <!-- Main view tabs -->
    <nav class="tabs">
      <button
        class="tab"
        class:active={$settings.view === 'alineacion'}
        on:click={() => setView('alineacion')}
      ><span class="tab-ico">🗒️</span><span class="tab-lbl">Alineación</span></button>
      <button
        class="tab"
        class:active={$settings.view === 'estrategias'}
        on:click={() => setView('estrategias')}
      ><span class="tab-ico">🎯</span><span class="tab-lbl">Estrategias</span></button>
      <button
        class="tab"
        class:active={$settings.view === 'plantel'}
        on:click={() => setView('plantel')}
      ><span class="tab-ico">🧩</span><span class="tab-lbl">Plantel</span></button>
      <button
        class="tab"
        class:active={$settings.view === 'historial'}
        on:click={() => setView('historial')}
      ><span class="tab-ico">📋</span><span class="tab-lbl">Historial</span></button>
    </nav>

    <!-- Right actions (hidden on mobile) -->
    <div class="actions">
      <div class="sync-dot" title="Sincronizado con Firestore"></div>
      <button class="btn btn-s" on:click={() => dispatch('export')} title="Descargar backup">⬇️ Exportar</button>
      <label class="btn btn-s" title="Restaurar backup" style="cursor:pointer;">
        ⬆️ Importar
        <input type="file" accept=".json" style="display:none" on:change={handleImportFile} />
      </label>
    </div>
  </div>
</header>

<style>
  header {
    background: var(--bg2);
    border-bottom: 1px solid var(--border);
    padding: 0 16px;
    position: sticky;
    top: 0;
    z-index: 100;
  }

  .header-main {
    display: flex;
    align-items: center;
    gap: 12px;
    height: 52px;
  }

  .brand {
    display: flex;
    align-items: center;
    gap: 6px;
    flex-shrink: 0;
  }

  .logo-img { width: 36px; height: 36px; border-radius: 50%; object-fit: cover; flex-shrink: 0; }

  .team-name {
    font-size: 1rem;
    font-weight: 700;
    cursor: pointer;
    border-bottom: 2px dashed transparent;
    transition: border-color .2s;
    white-space: nowrap;
    padding-bottom: 1px;
  }
  .team-name:hover { border-color: var(--blue); }

  .name-input {
    font-size: 1rem;
    font-weight: 700;
    background: transparent;
    border: none;
    border-bottom: 2px solid var(--blue);
    color: var(--txt);
    outline: none;
    width: 160px;
    padding-bottom: 1px;
  }

  .tabs {
    display: flex;
    gap: 3px;
    background: var(--bg);
    padding: 3px;
    border-radius: 8px;
  }

  .tab {
    display: flex;
    align-items: center;
    gap: 5px;
    padding: 5px 12px;
    border-radius: 5px;
    border: none;
    background: transparent;
    color: var(--txt2);
    font-size: .8rem;
    font-weight: 700;
    cursor: pointer;
    transition: all .15s;
    white-space: nowrap;
  }
  .tab.active { background: var(--blue); color: #000; }
  .tab:hover:not(.active) { background: var(--card); color: var(--txt); }

  .tab-ico { font-size: 1rem; line-height: 1; }

  .actions {
    display: flex;
    align-items: center;
    gap: 7px;
    margin-left: auto;
  }

  .sync-dot {
    width: 8px; height: 8px;
    border-radius: 50%;
    background: var(--green);
    box-shadow: 0 0 6px var(--green);
    animation: pulse 2.5s ease-in-out infinite;
    flex-shrink: 0;
  }

  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: .3; }
  }

  @media (max-width: 768px) {
    .actions { display: none; }
    .tab { padding: 6px 9px; font-size: .72rem; }
  }

  @media (max-width: 480px) {
    .tab { padding: 7px 9px; }
    .tab-lbl { display: none; }
    .tab-ico { font-size: 1.05rem; }
  }
</style>
