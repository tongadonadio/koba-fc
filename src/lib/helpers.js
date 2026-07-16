import { AVATAR_COLORS } from './constants.js';

export const ini = n => n.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

export const avc = (id, index) => AVATAR_COLORS[index % AVATAR_COLORS.length];

export const ratingColor = r =>
  r >= 85 ? '#10b981' :
  r >= 75 ? '#3b82f6' :
  r >= 65 ? '#f59e0b' :
             '#ef4444';

export const dispName = p => p.nickname || p.name.split(' ')[0];

export const dispIni = p => ini(p.nickname || p.name);

export const showFull = p =>
  p.nickname && p.name.split(' ')[0].toLowerCase() !== p.nickname.toLowerCase();

export const isAvail = p => p.available !== false;

export const clampPct = v => Math.max(4, Math.min(96, v));
