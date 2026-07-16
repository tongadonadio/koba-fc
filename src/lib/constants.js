export const FIREBASE_CONFIG = {
  apiKey: 'AIzaSyA8Ihp9OGrH6ZmHDmfHvf_XM6ddlVPLj98',
  authDomain: 'koba-fc.firebaseapp.com',
  projectId: 'koba-fc',
  storageBucket: 'koba-fc.firebasestorage.app',
  messagingSenderId: '5519356971',
  appId: '1:5519356971:web:70af6f32689a92cd90666e',
};

export const FORMATIONS = {
  '2-3-1': {
    positions: [
      { id: 'gk', lbl: 'POR', role: 'gk',  x: 50, y: 88 },
      { id: 'd1', lbl: 'DEF', role: 'def', x: 30, y: 70 },
      { id: 'd2', lbl: 'DEF', role: 'def', x: 70, y: 70 },
      { id: 'm1', lbl: 'MED', role: 'mid', x: 20, y: 49 },
      { id: 'm2', lbl: 'MED', role: 'mid', x: 50, y: 49 },
      { id: 'm3', lbl: 'MED', role: 'mid', x: 80, y: 49 },
      { id: 'f1', lbl: 'DEL', role: 'fwd', x: 50, y: 22 },
    ],
  },
  '3-2-1': {
    positions: [
      { id: 'gk', lbl: 'POR', role: 'gk',  x: 50, y: 88 },
      { id: 'd1', lbl: 'DEF', role: 'def', x: 20, y: 70 },
      { id: 'd2', lbl: 'DEF', role: 'def', x: 50, y: 70 },
      { id: 'd3', lbl: 'DEF', role: 'def', x: 80, y: 70 },
      { id: 'm1', lbl: 'MED', role: 'mid', x: 33, y: 49 },
      { id: 'm2', lbl: 'MED', role: 'mid', x: 67, y: 49 },
      { id: 'f1', lbl: 'DEL', role: 'fwd', x: 50, y: 22 },
    ],
  },
  '3-1-2': {
    positions: [
      { id: 'gk', lbl: 'POR', role: 'gk',  x: 50, y: 88 },
      { id: 'd1', lbl: 'DEF', role: 'def', x: 20, y: 70 },
      { id: 'd2', lbl: 'DEF', role: 'def', x: 50, y: 70 },
      { id: 'd3', lbl: 'DEF', role: 'def', x: 80, y: 70 },
      { id: 'm1', lbl: 'MED', role: 'mid', x: 50, y: 50 },
      { id: 'f1', lbl: 'DEL', role: 'fwd', x: 30, y: 24 },
      { id: 'f2', lbl: 'DEL', role: 'fwd', x: 70, y: 24 },
    ],
  },
};

export const ROLE_COLORS = {
  gk:  { bg: '#f59e0b', txt: '#000' },
  def: { bg: '#3b82f6', txt: '#fff' },
  mid: { bg: '#10b981', txt: '#fff' },
  fwd: { bg: '#ef4444', txt: '#fff' },
};

export const POS_TO_ROLE = { POR: 'gk', DEF: 'def', MED: 'mid', DEL: 'fwd' };
export const ROLE_TO_POS = { gk: 'POR', def: 'DEF', mid: 'MED', fwd: 'DEL' };

export const AVATAR_COLORS = [
  ['#6366f1', '#fff'],
  ['#8b5cf6', '#fff'],
  ['#ec4899', '#fff'],
  ['#f59e0b', '#000'],
  ['#10b981', '#fff'],
  ['#3b82f6', '#fff'],
  ['#ef4444', '#fff'],
  ['#14b8a6', '#fff'],
  ['#f97316', '#fff'],
  ['#84cc16', '#000'],
  ['#06b6d4', '#fff'],
  ['#a855f7', '#fff'],
];

export const TEAM_ID = 'koba';

export const DEFAULT_PLAYERS = [
  { name: 'Héctor Marcelo Barnada',              nickname: 'Chito',      number: 18,  position: 'MED', rating: 75, badges: [], available: true },
  { name: 'Emiliano Javier Rodríguez Naguil',    nickname: 'Emi',        number: 5,   position: 'DEF', rating: 75, badges: [], available: true },
  { name: 'Gastón Donadío Aprile',               nickname: 'Tonga',      number: 4,   position: 'DEF', rating: 75, badges: [], available: true },
  { name: 'Federico Agustín Rodríguez Giuliani', nickname: 'Agu',        number: 42,  position: 'DEL', rating: 75, badges: [], available: true },
  { name: 'Eri Pedro Gallino Formaggia',         nickname: 'Eri',        number: 3,   position: 'DEF', rating: 75, badges: [], available: true },
  { name: 'Juan Martín Saavedra Vazquez',        nickname: 'Juanma',     number: 11,  position: 'MED', rating: 75, badges: [], available: true },
  { name: 'Hernán Rumbo',                        nickname: 'Hernán',     number: 10,  position: 'MED', rating: 75, badges: [], available: true },
  { name: 'Nicolás Nieto Diaz',                  nickname: 'Nico Nieto', number: 111, position: 'POR', rating: 75, badges: [], available: true },
  { name: 'German Roytman',                      nickname: 'Ger',        number: 105, position: 'DEL', rating: 75, badges: [], available: true },
  { name: 'Nahuel Lofiego Armand Ugón',          nickname: 'Nahue',      number: 101, position: 'MED', rating: 75, badges: [], available: true },
  { name: 'Nicolas Maximiliano Ortiz',           nickname: 'Nico O',     number: 103, position: 'MED', rating: 75, badges: [], available: true },
  { name: 'Nicolas Sogliano',                    nickname: 'Nico S',     number: 104, position: 'DEF', rating: 75, badges: [], available: true },
  { name: 'Mariano Rodriguez',                   nickname: 'Mariano',    number: 17,  position: 'POR', rating: 75, badges: [], available: true },
  { name: 'Gonzalo Alvarez',                     nickname: 'Gonza',      number: 7,   position: 'MED', rating: 75, badges: [], available: true },
  { name: 'Diego Areosa Denevi',                 nickname: 'Morocho',    number: 1,   position: 'POR', rating: 75, badges: [], available: true },
];
