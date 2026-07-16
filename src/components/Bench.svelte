<script>
  import { settings, players } from '../lib/stores.js';
  import { avc, dispIni, ratingColor, isAvail } from '../lib/helpers.js';

  $: lineupIds = new Set(Object.values($settings.lineup ?? {}));

  $: benchPlayers = $players.filter(p => isAvail(p) && !lineupIds.has(p.id));
</script>

{#if benchPlayers.length > 0 || true}
  <div class="bench">
    <div class="bench-title">
      Suplentes
      <span class="cnt">{benchPlayers.length}</span>
    </div>
    <div class="chips">
      {#each benchPlayers as player}
        {@const idx = $players.findIndex(p => p.id === player.id)}
        {@const [bg, tc] = avc(player.id, idx)}
        <div class="chip">
          <div class="bav" style="background:{bg}; color:{tc};">{dispIni(player)}</div>
          <span class="nick">{player.nickname || player.name}</span>
          <span class="pos">{player.position}</span>
          <span class="rat" style="color:{ratingColor(player.rating)};">{player.rating ?? '-'}</span>
        </div>
      {/each}
      {#if benchPlayers.length === 0}
        <span class="empty">Todos en cancha 🎉</span>
      {/if}
    </div>
  </div>
{/if}

<style>
  .bench {
    background: var(--bg2);
    border-top: 1px solid var(--border);
    padding: 8px 12px 10px;
  }

  .bench-title {
    font-size: .68rem;
    font-weight: 700;
    color: var(--txt2);
    text-transform: uppercase;
    letter-spacing: .06em;
    margin-bottom: 7px;
  }

  .cnt {
    background: var(--card);
    border-radius: 10px;
    padding: 1px 6px;
    margin-left: 4px;
    font-size: .65rem;
    color: var(--txt);
  }

  .chips {
    display: flex;
    flex-wrap: wrap;
    gap: 5px;
    align-items: center;
  }

  .chip {
    display: flex;
    align-items: center;
    gap: 5px;
    background: var(--card);
    border: 1px solid var(--border);
    border-radius: 20px;
    padding: 3px 10px 3px 4px;
    font-size: .75rem;
  }

  .bav {
    width: 22px; height: 22px;
    border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    font-size: .58rem; font-weight: 700;
    flex-shrink: 0;
  }

  .nick { font-weight: 600; color: var(--txt); }
  .pos  { color: var(--txt2); font-size: .68rem; }
  .rat  { font-weight: 700; font-size: .75rem; }

  .empty { color: var(--txt2); font-size: .8rem; }
</style>
