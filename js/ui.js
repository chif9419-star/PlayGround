/* ════════════════════════════════════════════════════════════════
   ui.js — dialogue, modals, toasts, transitions & small renderers
   ════════════════════════════════════════════════════════════════ */

import { portraitSVG, typeColors, monsterSVG } from './art.js';
import { TYPE_META, SPECIES, statsFor } from './data.js';

export const $ = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

export function typeChip(type) {
  const m = TYPE_META[type] || TYPE_META.Leaf;
  return `<span class="tchip" style="background:${m.color}">${m.icon} ${m.label}</span>`;
}

export function typeChipSmall(type) {
  const m = TYPE_META[type] || TYPE_META.Leaf;
  return `<span class="tchip" style="background:${m.color};font-size:.46rem">${m.label}</span>`;
}

export function hpClass(ratio) { return ratio <= .22 ? 'low' : ratio <= .5 ? 'mid' : ''; }

/* ─────────────── dialogue ─────────────── */

const dialogue = {
  open: false, lines: [], index: 0, name: '', portrait: 'professor',
  typing: false, timer: null, onDone: null, text: '',
};

export function isDialogueOpen() { return dialogue.open; }

export function showDialogue({ name, portrait = 'professor', lines, onDone = null }) {
  const box = $('#dialogue');
  dialogue.open = true;
  dialogue.lines = Array.isArray(lines) ? lines.slice() : [lines];
  dialogue.index = 0;
  dialogue.name = name;
  dialogue.portrait = portrait;
  dialogue.onDone = onDone;
  $('#dialogue-name').textContent = name;
  $('#dialogue-portrait').innerHTML = portraitSVG(portrait);
  box.classList.remove('hidden');
  typeLine();
}

function typeLine() {
  clearInterval(dialogue.timer);
  const el = $('#dialogue-text');
  const full = dialogue.lines[dialogue.index] || '';
  dialogue.text = full;
  dialogue.full = full;
  dialogue.typing = true;
  el.textContent = '';
  let i = 0;
  dialogue.timer = setInterval(() => {
    i += 1;
    el.textContent = full.slice(0, i);
    if (i >= full.length) {
      clearInterval(dialogue.timer);
      dialogue.typing = false;
    }
  }, 14);
}

export function advanceDialogue() {
  if (!dialogue.open) return false;
  if (dialogue.typing) {
    clearInterval(dialogue.timer);
    $('#dialogue-text').textContent = dialogue.full || dialogue.text;
    dialogue.typing = false;
    return true;
  }
  if (dialogue.index < dialogue.lines.length - 1) {
    dialogue.index++;
    typeLine();
    return true;
  }
  closeDialogue();
  return true;
}

export function closeDialogue() {
  clearInterval(dialogue.timer);
  dialogue.open = false;
  $('#dialogue').classList.add('hidden');
  const cb = dialogue.onDone;
  dialogue.onDone = null;
  if (cb) setTimeout(cb, 60);
}

/* ─────────────── modal ─────────────── */

const modal = { open: false, onClose: null };

export function openModal({ title, body, foot = '', onClose = null, wide = false }) {
  modal.open = true;
  modal.onClose = onClose;
  $('#modal-title').textContent = title;
  $('#modal-body').innerHTML = body;
  $('#modal-foot').innerHTML = foot;
  $('#modal').style.width = wide ? 'min(880px, 100%)' : '';
  $('#modal-layer').classList.remove('hidden');
  dialogStackAdd();
}
export function isModalOpen() { return modal.open; }
export function closeModal() {
  if (!modal.open) return;
  modal.open = false;
  $('#modal-layer').classList.add('hidden');
  $('#modal-body').innerHTML = '';
  $('#modal-foot').innerHTML = '';
  const cb = modal.onClose;
  modal.onClose = null;
  dialogStackRemove();
  if (cb) cb();
}

/* simple stack so Escape/A knows an overlay is active */
let overlayDepth = 0;
function dialogStackAdd() { overlayDepth++; }
function dialogStackRemove() { overlayDepth = Math.max(0, overlayDepth - 1); }
export function overlayActive() { return modal.open || dialogue.open; }

/* ─────────────── toasts / big toast ─────────────── */

export function toast(text, kind = '') {
  const wrap = $('#toasts');
  const el = document.createElement('div');
  el.className = `toast ${kind}`;
  el.textContent = text;
  wrap.appendChild(el);
  setTimeout(() => el.remove(), 3200);
}

let bigTimer = null;
export function bigToast(text, ms = 1600) {
  const el = $('#big-toast');
  el.textContent = text;
  el.classList.remove('hidden');
  clearTimeout(bigTimer);
  bigTimer = setTimeout(() => el.classList.add('hidden'), ms);
}

/* ─────────────── transition ─────────────── */

export function transition(duration = 350) {
  return new Promise(resolve => {
    const el = $('#transition');
    el.classList.remove('hidden', 'out');
    void el.offsetWidth;
    setTimeout(() => {
      el.classList.add('out');
      setTimeout(() => {
        el.classList.add('hidden');
        el.classList.remove('out');
        resolve();
      }, 420);
    }, duration);
  });
}

/* ─────────────── small creature renderers ─────────────── */

export function creatureMini(sp, size = null) {
  const style = size ? ` style="width:${size}px;height:${Math.round(size * 1.25)}px"` : '';
  return `<div class="tc-art"${style}>${monsterSVG(sp)}</div>`;
}

export function partyRowHTML(c, index, active = false) {
  const sp = SPECIES[c.species];
  const max = statsFor(c.species, c.level).maxHp;
  const ratio = c.hp / max;
  const pct = Math.max(0, Math.min(100, ratio * 100));
  return `<div class="party-row ${active ? 'active' : ''}" data-index="${index}">
    <div class="party-art">${monsterSVG(sp)}</div>
    <div class="party-main">
      <div class="party-name">${sp.name} <small>Lv. ${c.level}</small></div>
      <div class="party-sub">${typeChipSmall(sp.type)}<span class="hint">${sp.title}</span></div>
      <div class="party-bar"><i class="${hpClass(ratio)}" style="width:${pct}%"></i></div>
      <div class="party-hp">${Math.max(0, Math.round(c.hp))} / ${max} HP · ${c.xp}/${xpNeeded(c)} XP</div>
    </div>
    <div class="party-actions">
      ${active ? '<span class="hint" style="font-size:.58rem;font-weight:900">LEAD</span>' : `<button class="btn ghost" data-lead="${index}">Lead</button>`}
    </div>
  </div>`;
}

function xpNeeded(c) {
  return 12 + c.level * 9;
}

export function teamGridHTML(state, mode = 'overworld') {
  return state.party.map((c, i) => {
    const sp = SPECIES[c.species];
    const max = Math.max(1, Math.round(c.hp));
    const ratio = c.hp / max;
    const pct = Math.max(0, Math.min(100, ratio * 100));
    return `<button class="team-card ${i === 0 ? 'active' : ''} ${c.hp <= 0 ? 'fainted' : ''}" data-team="${i}" ${c.hp <= 0 ? 'disabled' : ''}>
      <div class="tc-art">${monsterSVG(sp)}</div>
      <div>
        <div class="tc-name">${sp.name} <span class="hint">Lv.${c.level}</span></div>
        <div class="tc-sub">${sp.type}${c.hp <= 0 ? ' · fainted' : ''}</div>
        <div class="hp-mini"><i style="width:${pct}%"></i></div>
      </div>
    </button>`;
  }).join('');
}
