<script>
  import { createEventDispatcher } from 'svelte';
  import PlayerList from './PlayerList.svelte';
  import Pitch from './Pitch.svelte';
  import StatsPanel from './StatsPanel.svelte';
  import Bench from './Bench.svelte';

  const dispatch = createEventDispatcher();

  // Forward events from children up to App.svelte
  function onOpenPlayerModal(e) {
    dispatch('openPlayerModal', e.detail);
  }

  function onOpenPicker(e) {
    dispatch('openPicker', e.detail);
  }
</script>

<div class="plantel-layout">
  <aside class="sidebar">
    <PlayerList on:openPlayerModal={onOpenPlayerModal} />
  </aside>

  <main class="center">
    <Pitch on:openPicker={onOpenPicker} />
    <Bench />
  </main>

  <aside class="rpanel">
    <StatsPanel />
  </aside>
</div>

<style>
  .plantel-layout {
    display: grid;
    grid-template-columns: 250px 1fr 230px;
    gap: 0;
    min-height: calc(100vh - 56px);
    background: var(--bg);
  }

  .sidebar {
    border-right: 1px solid var(--border);
    background: var(--bg2);
    overflow: hidden;
    display: flex;
    flex-direction: column;
  }

  .center {
    display: flex;
    flex-direction: column;
    background: var(--bg);
    overflow: hidden;
  }

  .rpanel {
    border-left: 1px solid var(--border);
    background: var(--bg2);
    overflow-y: auto;
  }

  @media (max-width: 768px) {
    .plantel-layout {
      grid-template-columns: 1fr;
      grid-template-rows: auto auto auto;
    }

    .sidebar {
      border-right: none;
      border-bottom: 1px solid var(--border);
    }

    .rpanel {
      border-left: none;
      border-top: 1px solid var(--border);
      /* On mobile, hide stats panel to save space */
      display: none;
    }
  }
</style>
