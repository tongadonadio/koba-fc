<script>
  import { createEventDispatcher, onDestroy } from 'svelte';
  import { savePlayer, deletePlayer, showToast } from '../lib/stores.js';
  import { ratingColor } from '../lib/helpers.js';

  export let player = null; // null = new player

  const dispatch = createEventDispatcher();

  const POSITIONS = ['POR', 'DEF', 'MED', 'DEL'];
  const BADGES = [
    { id: 'captain',   label: '🎗️ Capitán' },
    { id: 'mvp',       label: '⭐ MVP' },
    { id: 'topscorer', label: '🎯 Goleador' },
    { id: 'veteran',   label: '🏅 Veterano' },
  ];

  // Form state
  let form = player
    ? { name: player.name, nickname: player.nickname || '', number: player.number ?? '', position: player.position, rating: player.rating ?? 75, available: player.available !== false, badges: [...(player.badges ?? [])] }
    : { name: '', nickname: '', number: '', position: 'MED', rating: 75, available: true, badges: [] };

  $: rColor = ratingColor(form.rating);

  function toggleBadge(id) {
    form.badges = form.badges.includes(id)
      ? form.badges.filter(b => b !== id)
      : [...form.badges, id];
  }

  async function handleSave() {
    if (!form.name.trim()) {
      showToast('El nombre es requerido');
      return;
    }
    const data = {
      name: form.name.trim(),
      nickname: form.nickname.trim(),
      number: form.number !== '' ? Number(form.number) : null,
      position: form.position,
      rating: Number(form.rating),
      available: form.available,
      badges: form.badges,
    };
    if (player?.id) {
      await savePlayer(data, player.id);
      showToast('Jugador actualizado');
    } else {
      await savePlayer(data);
      showToast('Jugador agregado');
    }
    dispatch('close');
  }

  async function handleDelete() {
    if (!player?.id) return;
    if (!confirm(`¿Eliminar a ${player.name}?`)) return;
    await deletePlayer(player.id);
    showToast('Jugador eliminado');
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
    <div class="mtitle">{player ? 'Editar jugador' : 'Nuevo jugador'}</div>

    <div class="fg">
      <label class="flbl">Nombre completo *</label>
      <input class="fi" bind:value={form.name} placeholder="Nombre Apellido" autofocus />
    </div>

    <div class="frow">
      <div class="fg">
        <label class="flbl">Apodo</label>
        <input class="fi" bind:value={form.nickname} placeholder="Apodo" />
      </div>
      <div class="fg">
        <label class="flbl">Número</label>
        <input class="fi" type="number" bind:value={form.number} placeholder="#" min="1" max="999" />
      </div>
    </div>

    <div class="frow">
      <div class="fg">
        <label class="flbl">Posición</label>
        <select class="fi" bind:value={form.position}>
          {#each POSITIONS as pos}
            <option value={pos}>{pos}</option>
          {/each}
        </select>
      </div>
      <div class="fg">
        <label class="flbl">Rating: <span style="color:{rColor}; font-weight:700;">{form.rating}</span></label>
        <div class="ract">
          <input type="range" min="50" max="99" bind:value={form.rating} />
        </div>
      </div>
    </div>

    <div class="fg">
      <label class="flbl">Insignias</label>
      <div class="badge-opts">
        {#each BADGES as b}
          <button
            class="bopt"
            class:sel={form.badges.includes(b.id)}
            on:click={() => toggleBadge(b.id)}
          >{b.label}</button>
        {/each}
      </div>
    </div>

    <div class="fg avail-row">
      <label class="chk">
        <input type="checkbox" bind:checked={form.available} />
        <span>Asiste al partido</span>
      </label>
    </div>

    <div class="mactions">
      <button class="btn btn-s" on:click={() => dispatch('close')}>Cancelar</button>
      {#if player?.id}
        <button class="btn btn-d" on:click={handleDelete}>Eliminar</button>
      {/if}
      <button class="btn btn-p" on:click={handleSave}>Guardar</button>
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
    width: 370px;
    max-width: 92vw;
    max-height: 90vh;
    overflow-y: auto;
    animation: mdin .18s ease;
  }

  @keyframes mdin {
    from { transform: scale(.9); opacity: 0; }
    to   { transform: scale(1);  opacity: 1; }
  }

  .mtitle { font-size: 1rem; font-weight: 700; margin-bottom: 16px; }

  .ract { display: flex; align-items: center; gap: 8px; }
  .ract input[type=range] { flex: 1; accent-color: var(--green); }

  .badge-opts { display: flex; gap: 6px; flex-wrap: wrap; }
  .bopt {
    padding: 3px 9px; border-radius: 20px;
    border: 2px solid var(--border); background: transparent;
    color: var(--txt2); cursor: pointer; font-size: .72rem; transition: all .15s;
  }
  .bopt.sel { border-color: var(--blue); color: var(--blue); }

  .avail-row { margin-top: 2px; }
  .chk {
    display: flex; align-items: center; gap: 6px;
    font-size: .82rem; color: var(--txt); cursor: pointer;
  }

  .mactions {
    display: flex; gap: 7px;
    justify-content: flex-end;
    margin-top: 16px;
  }
</style>
