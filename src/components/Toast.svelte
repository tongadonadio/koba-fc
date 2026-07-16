<script>
  import { toast } from '../lib/stores.js';

  let visible = false;
  let currentMsg = '';
  let timer;

  // Re-runs each time toast.key changes (incremented by showToast)
  $: if ($toast.key) {
    currentMsg = $toast.msg;
    visible = true;
    clearTimeout(timer);
    timer = setTimeout(() => { visible = false; }, 2200);
  }
</script>

{#if visible}
  <div class="toast">{currentMsg}</div>
{/if}

<style>
  .toast {
    position: fixed;
    bottom: 24px;
    right: 20px;
    background: var(--card);
    border: 1px solid var(--border);
    color: var(--txt);
    padding: 10px 18px;
    border-radius: 10px;
    z-index: 9999;
    font-size: .88rem;
    font-weight: 500;
    box-shadow: 0 4px 20px rgba(0,0,0,.5);
    animation: fadeUp .2s ease;
    pointer-events: none;
  }

  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(10px); }
    to   { opacity: 1; transform: translateY(0); }
  }
</style>
