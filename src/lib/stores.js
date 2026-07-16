import { writable } from 'svelte/store';
import {
  onSnapshot, setDoc, doc, addDoc, deleteDoc, getDoc, query, orderBy,
} from 'firebase/firestore';
import { db, teamRef, playersCol, playsCol, matchesCol } from './firebase.js';
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

// ─── Example plays seeder ────────────────────────────────────────────────────
let _currentPlayerList = [];
let _playsAreEmpty    = true;
let _playsSeeded      = false;

function _maybeSeedPlays() {
  if (_playsSeeded || !_playsAreEmpty || _currentPlayerList.length === 0) return;
  _playsSeeded = true;
  _seedExamplePlays(_currentPlayerList).catch(console.error);
}

async function _seedExamplePlays(playerList) {
  const used = new Set();
  const find = (pos) => {
    const p = playerList.find(p => p.position === pos && !used.has(p.id));
    if (p) { used.add(p.id); return p.id; }
    return null;
  };

  const gk = find('POR'), d1 = find('DEF'), d2 = find('DEF');
  const m1 = find('MED'), m2 = find('MED'), m3 = find('MED');
  const f1 = find('DEL');
  if (!gk || !d1 || !d2 || !m1 || !m2 || !f1) return;

  const s = (pos) => ({ positions: pos });
  const base = s({
    [gk]:{x:50,y:88}, [d1]:{x:30,y:70}, [d2]:{x:70,y:70},
    [m1]:{x:20,y:49}, [m2]:{x:50,y:49}, ...(m3?{[m3]:{x:80,y:49}}:{}),
    [f1]:{x:50,y:22},
  });

  const exPlays = [
    {
      name: '⚔️ Ataque: triangulación con tercer hombre',
      formation: '2-3-1',
      steps: [
        base,
        // Medios crean triángulo, lateral sube como tercer hombre
        s({ [gk]:{x:50,y:88}, [d1]:{x:35,y:65}, [d2]:{x:70,y:70},
            [m1]:{x:14,y:34}, [m2]:{x:42,y:60}, ...(m3?{[m3]:{x:75,y:45}}:{}), [f1]:{x:62,y:20} }),
        // D1 llega como tercer hombre, M1 cruza, F1 ataca primer palo, M2 segundo palo
        s({ [gk]:{x:50,y:88}, [d1]:{x:22,y:25}, [d2]:{x:65,y:68},
            [m1]:{x:8, y:16}, [m2]:{x:48,y:20}, ...(m3?{[m3]:{x:65,y:32}}:{}), [f1]:{x:38,y:12} }),
      ],
    },
    {
      name: '🛡️ Defensa: bloque bajo y salida rápida',
      formation: '2-3-1',
      steps: [
        base,
        // Todo el equipo baja y forma bloque compacto 4-2
        s({ [gk]:{x:50,y:88}, [d1]:{x:35,y:80}, [d2]:{x:65,y:80},
            [m1]:{x:28,y:70}, [m2]:{x:50,y:68}, ...(m3?{[m3]:{x:72,y:70}}:{}), [f1]:{x:50,y:56} }),
        // Al ganar la pelota: salida rápida por banda derecha (M3 y F1 contraatacan)
        s({ [gk]:{x:50,y:88}, [d1]:{x:30,y:72}, [d2]:{x:62,y:74},
            [m1]:{x:20,y:60}, [m2]:{x:44,y:54}, ...(m3?{[m3]:{x:85,y:32}}:{}), [f1]:{x:68,y:28} }),
      ],
    },
    {
      name: '🚩 Tiro de esquina: bloqueador y segundo palo',
      formation: '2-3-1',
      steps: [
        // Setup: D1 toma el corner (esquina izquierda atacante), resto se posiciona en el área
        s({ [gk]:{x:50,y:88}, [d1]:{x:4, y:6},  [d2]:{x:50,y:78},
            [m1]:{x:38,y:10}, [m2]:{x:56,y:8},  ...(m3?{[m3]:{x:44,y:20}}:{}), [f1]:{x:63,y:10} }),
        // D1 centra: M1 bloquea al marcador de M2, M2 ataca primer palo, F1 ataca segundo palo
        s({ [gk]:{x:50,y:88}, [d1]:{x:4, y:4},  [d2]:{x:50,y:75},
            [m1]:{x:36,y:8},  [m2]:{x:52,y:6},  ...(m3?{[m3]:{x:44,y:18}}:{}), [f1]:{x:65,y:8}  }),
      ],
    },
  ];

  for (const play of exPlays) {
    await addDoc(playsCol(), play);
  }
}

// ─── Firestore real-time listeners ───────────────────────────────────────────

// Settings listener
onSnapshot(teamRef(), async (snap) => {
  if (!snap.exists()) {
    await seedDefaults();
    initialized.set(true);
    return;
  }
  const data = snap.data();
  if (data._session === SESSION_ID) { initialized.set(true); return; }
  const { _session, ...rest } = data;
  settings.set(rest);
  initialized.set(true);
});

// Players listener — tracks current list for play seeding
onSnapshot(playersCol(), (snap) => {
  const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  list.sort((a, b) => a.name.localeCompare(b.name));
  _currentPlayerList = list;
  players.set(list);
  _maybeSeedPlays();
});

// Plays listener — seeds example plays on first load if empty
onSnapshot(playsCol(), (snap) => {
  const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  list.sort((a, b) => a.name.localeCompare(b.name));
  _playsAreEmpty = list.length === 0;
  plays.set(list);
  _maybeSeedPlays();
});

// ─── Matches ─────────────────────────────────────────────────────────────────
export const matches = writable([]);

export async function saveMatch(matchData, id) {
  try {
    if (id) {
      await setDoc(doc(db, 'teams', 'koba', 'matches', id), matchData);
    } else {
      await addDoc(matchesCol(), matchData);
    }
  } catch (e) {
    console.error('saveMatch error', e);
  }
}

export async function deleteMatch(id) {
  try {
    await deleteDoc(doc(db, 'teams', 'koba', 'matches', id));
  } catch (e) {
    console.error('deleteMatch error', e);
  }
}

// Matches listener — ordered by date descending
onSnapshot(query(matchesCol(), orderBy('date', 'desc')), (snap) => {
  const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  matches.set(list);
});
