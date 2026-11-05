/* ════════════════════════════════════════════════════════════════
   state.js — save data, creatures, levelling & party helpers
   ════════════════════════════════════════════════════════════════ */

import { SPECIES, statsFor, xpToNext, makeCreature, clamp } from './data.js';

export const SAVE_KEY = 'bloom-and-bond-save-v1';

export function freshState() {
  return {
    version: 1,
    createdAt: Date.now(),
    playSeconds: 0,
    player: {
      name: 'Wren',
      x: 10, y: 29, dir: 'up',
      coins: 120,
      items: { orb: 5, potion: 3, tea: 0 },
      seals: [false, false, false],
      steps: 0,
      housed: false,
    },
    party: [],
    box: [],
    seen: {},
    flags: {
      defeated: {},
      introDone: false,
      gateOpened: false,
      ending: false,
      starterChosen: false,
      vipSeen: false,
    },
    stats: { battles: 0, wins: 0, caught: 0, evolutions: 0, steps: 0, levelUps: 0 },
    location: 'Verdant Hollow',
  };
}

export function statsOf(c) {
  return statsFor(c.species, c.level);
}

export function speciesOf(c) { return SPECIES[c.species]; }

export function healCreature(c) {
  c.hp = statsOf(c).maxHp;
}

export function healParty(state) {
  state.party.forEach(healCreature);
}

export function leadIndex(state) {
  const i = state.party.findIndex(c => c.hp > 0);
  return i;
}

export function activeCreature(state) {
  const i = leadIndex(state);
  return i >= 0 ? state.party[i] : null;
}

export function addXp(c, amount) {
  if (!c) return { levels: [], xp: 0 };
  const before = c.level;
  c.xp += amount;
  let guard = 0;
  while (c.level < 40 && c.xp >= xpToNext(c.level) && guard++ < 20) {
    c.xp -= xpToNext(c.level);
    const oldMax = statsOf(c).maxHp;
    c.level++;
    const newMax = statsOf(c).maxHp;
    c.hp = clamp(c.hp + (newMax - oldMax), 1, newMax);
  }
  return { levels: c.level > before ? range(before + 1, c.level) : [], xp: amount };
}

function range(a, b) { const r = []; for (let i = a; i <= b; i++) r.push(i); return r; }

export function addCreature(state, creature, { silent = false } = {}) {
  state.seen[creature.species] = true;
  state.stats.caught++;
  if (state.party.length < 4) {
    state.party.push(creature);
    return { where: 'party' };
  }
  state.box.push(creature);
  return { where: 'box' };
}

export function evolvable(c) {
  const sp = SPECIES[c.species];
  return !!(sp && sp.evolvesTo && c.level >= sp.evolveLevel && SPECIES[sp.evolvesTo]);
}

export function evolveCreature(c) {
  const from = SPECIES[c.species];
  const to = SPECIES[from.evolvesTo];
  if (!to) return null;
  const ratio = c.hp / Math.max(1, statsOf(c).maxHp);
  c.species = to.id;
  const newMax = statsOf(c).maxHp;
  c.hp = clamp(Math.round(newMax * ratio), 1, newMax);
  c.xp = 0;
  return { from, to, oldMax: newMax };
}

export function sealCount(state) { return state.player.seals.filter(Boolean).length; }

export function itemCount(state, id) { return state.player.items[id] || 0; }

export function useItem(state, id, creature) {
  if ((state.player.items[id] || 0) <= 0) return { ok: false, reason: 'You are out of those.' };
  const item = { potion: { heal: 30, name: 'Heart Potion' }, tea: { heal: 999, name: 'Moon Tea' } }[id];
  if (!item || !creature) return { ok: false, reason: 'That cannot be used right now.' };
  const max = statsOf(creature).maxHp;
  if (creature.hp >= max) return { ok: false, reason: `${SPECIES[creature.species].name} is already full of beans.` };
  const amount = Math.min(item.heal, max - creature.hp);
  creature.hp += amount;
  state.player.items[id]--;
  return { ok: true, amount, name: item.name };
}

export function saveGame(state) {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(state));
    return true;
  } catch { return false; }
}

export function loadGame() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (!data || data.version !== 1 || !data.player) return null;
    const base = freshState();
    const merged = {
      ...base, ...data,
      player: { ...base.player, ...data.player, items: { ...base.player.items, ...(data.player.items || {}) } },
      flags: { ...base.flags, ...(data.flags || {}), defeated: { ...(data.flags?.defeated || {}) } },
      stats: { ...base.stats, ...(data.stats || {}) },
      party: Array.isArray(data.party) ? data.party.filter(validCreature) : [],
      box: Array.isArray(data.box) ? data.box.filter(validCreature) : [],
      seen: data.seen || {},
    };
    // clamp / heal saves made mid-battle
    merged.party.forEach(c => {
      const max = statsFor(c.species, c.level).maxHp;
      if (!Number.isFinite(c.hp)) c.hp = max;
      c.hp = clamp(c.hp, 1, max);
    });
    return merged;
  } catch { return null; }
}

function validCreature(c) {
  return c && typeof c.species === 'string' && SPECIES[c.species] && Number.isFinite(c.level);
}

export function hasSave() {
  return !!localStorage.getItem(SAVE_KEY);
}

export function deleteSave() {
  try { localStorage.removeItem(SAVE_KEY); } catch {}
}

export function formatTime(seconds) {
  const s = Math.max(0, Math.floor(seconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h) return `${h}h ${m}m`;
  return `${m}m ${String(sec).padStart(2, '0')}s`;
}

export { makeCreature };
