import { writable } from 'svelte/store';
import {
  onSnapshot, setDoc, doc, addDoc, deleteDoc, getDoc,
} from 'firebase/firestore';
import { db, teamRef, playersCol, playsCol } from './firebase.js';
import { DEFAULT_PLAYERS, FORMATIONS } from './constants.js';

// ─── Session identity ────────────────────────────────────────────────────────
const SESSION_ID = Math.random().toString(36).slice(2, 9);

// ─── Stores ──────────────────────────────────────────────────────────────────
export const settings = writable({
  name: 'Koba',
  formation: '2-3-1',
  lineup: {},
  view: 'plantel',
  currentPlayId: null,
  libSeeded: false,
});

export const players = writable(/** @type {Array} */ ([]));
export const plays   = writable(/** @type {Array} */ ([]));

// Local-only UI state (never persisted to Firestore)
export const ui = writable({
  currentStep: 0,
  playing:     false,
  editId:      null,
  selSlot:     null,
});

export const toast = writable({ msg: '', key: 0 });

export const initialized = writable(false);

// ─── Toast ───────────────────────────────────────────────────────────────────
export function showToast(msg) {
  toast.update(t => ({ msg, key: t.key + 1 }));
}

// ─── Settings write (debounced 500 ms) ───────────────────────────────────────
let _settingsTimer = null;
let _latestSettings = null;

export function saveSettings(patch) {
  settings.update(s => {
    _latestSettings = { ...s, ...patch };
    return _latestSettings;
  });

  clearTimeout(_settingsTimer);
  _settingsTimer = setTimeout(async () => {
    try {
      await setDoc(teamRef(), { ..._latestSettings, _session: SESSION_ID }, { merge: true });
    } catch (e) {
      console.error('saveSettings error', e);
    }
  }, 500);
}

// ─── Players ─────────────────────────────────────────────────────────────────
export async function savePlayer(playerData, id) {
  try {
    if (id) {
      await setDoc(doc(db, 'teams', 'koba', 'players', id), playerData);
    } else {
      await addDoc(playersCol(), playerData);
    }
  } catch (e) {
    console.error('savePlayer error', e);
  }
}

export async function deletePlayer(id) {
  try {
    await deleteDoc(doc(db, 'teams', 'koba', 'players', id));
  } catch (e) {
    console.error('deletePlayer error', e);
  }
}

// ─── Plays ───────────────────────────────────────────────────────────────────
export async function savePlay(playData, id) {
  try {
    if (id) {
      await setDoc(doc(db, 'teams', 'koba', 'plays', id), playData);
    } else {
      await addDoc(playsCol(), playData);
    }
  } catch (e) {
    console.error('savePlay error', e);
  }
}

export async function deletePlay(id) {
  try {
    await deleteDoc(doc(db, 'teams', 'koba', 'plays', id));
  } catch (e) {
    console.error('deletePlay error', e);
  }
}

// ─── Seed helper ─────────────────────────────────────────────────────────────
async function seedDefaults() {
  // Write each default player as a separate Firestore doc
  for (const p of DEFAULT_PLAYERS) {
    await addDoc(playersCol(), p);
  }

  // Write initial settings doc
  const initial = {
    name: 'Koba',
    formation: '2-3-1',
    lineup: {},
    view: 'plantel',
    currentPlayId: null,
    libSeeded: true,
    _session: SESSION_ID,
  };
  await setDoc(teamRef(), initial);
  settings.set({ ...initial });
}

// ─── Firestore real-time listeners ───────────────────────────────────────────

// Settings listener
onSnapshot(teamRef(), async (snap) => {
  if (!snap.exists()) {
    // First run — seed the database
    await seedDefaults();
    initialized.set(true);
    return;
  }

  const data = snap.data();

  // Skip our own writes to avoid echoes
  if (data._session === SESSION_ID) {
    initialized.set(true);
    return;
  }

  const { _session, ...rest } = data;
  settings.set(rest);
  initialized.set(true);
});

// Players listener
onSnapshot(playersCol(), (snap) => {
  const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  // Sort by name for consistency
  list.sort((a, b) => a.name.localeCompare(b.name));
  players.set(list);
});

// Plays listener
onSnapshot(playsCol(), (snap) => {
  const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  list.sort((a, b) => a.name.localeCompare(b.name));
  plays.set(list);
});
