/* ════════════════════════════════════════════════════════════════
   game.js — the beating heart of Bloom & Bond
   ════════════════════════════════════════════════════════════════ */

import {
  MAP, MAP_W, MAP_H, TILE, SPECIES, STARTERS, TRAINERS, NPCS, SIGNS, BUILDINGS, PROPS, ITEMS,
  TYPE_META, TYPE_CHART, QUEST_SEALS, MOVES, regionName, pickEncounter, makeCreature, statsFor,
  xpToNext, TIPS, clamp,
} from './data.js';
import {
  freshState, saveGame, loadGame, hasSave, deleteSave, healParty, addCreature, activeCreature,
  leadIndex, statsOf, sealCount, evolvable, evolveCreature, formatTime, SAVE_KEY,
} from './state.js';
import { monsterSVG, portraitSVG, typeColors } from './art.js';
import {
  $, $$, showDialogue, advanceDialogue, isDialogueOpen, closeDialogue, openModal, closeModal,
  isModalOpen, toast, bigToast, transition, typeChip, typeChipSmall, hpClass,
} from './ui.js';
import { Overworld } from './overworld.js';
import { Battle } from './battle.js';
import { audio } from './audio.js';

const wait = ms => new Promise(r => setTimeout(r, ms));

export class Game {
  constructor() {
    this.state = null;
    this.screen = 'title';
    this.busy = false;
    this.evolving = false;
    this.evoSkipResolve = null;
    this.battle = null;
    this.overworld = null;
    this.currentTarget = null;
    this.musicMode = 'title';
    this.lastSealCount = 0;
    this.playTimer = null;
    this._bindUI();
    this.initAudioPreference();
    this.buildTitle();
    this.startClock();
  }

  /* ─────────────── boot & title ─────────────── */

  initAudioPreference() {
    const pref = localStorage.getItem('bloom-and-bond-sound');
    if (pref === 'off') {
      audio.enabled = false;
      audio.setEnabled(false);
      $('#btn-sound').classList.add('muted');
      $('#btn-sound-title').classList.add('muted');
    }
    const kick = () => {
      audio.ensure();
      audio.mode = null;
      audio.setMusic(this.musicMode);
    };
    window.addEventListener('pointerdown', kick, { once: true });
    window.addEventListener('keydown', kick, { once: true });
  }

  startClock() {
    this.playTimer = setInterval(() => {
      if (this.state && this.screen !== 'title') {
        this.state.playSeconds++;
        if (this.state.playSeconds % 20 === 0) saveGame(this.state);
      }
    }, 1000);
  }

  buildTitle() {
    if (this.overworld) { this.overworld.setPaused(true); this.overworld.stop(); }
    const box = $('#title-starters');
    box.innerHTML = STARTERS.map(id => `<div class="mini-mon">${monsterSVG(SPECIES[id])}</div>`).join('');
    const petals = $('#title-petals');
    for (let i = 0; i < 20; i++) {
      const p = document.createElement('div');
      p.className = 'petal';
      p.style.left = Math.random() * 100 + '%';
      p.style.animationDuration = (8 + Math.random() * 9) + 's';
      p.style.animationDelay = (-Math.random() * 14) + 's';
      p.style.setProperty('--drift', (Math.random() * 22 - 11) + 'vw');
      p.style.width = (7 + Math.random() * 9) + 'px';
      p.style.height = (5 + Math.random() * 6) + 'px';
      p.style.opacity = (.35 + Math.random() * .5).toFixed(2);
      petals.appendChild(p);
    }
    if (hasSave()) $('#btn-continue').classList.remove('hidden');
    this.setScreen('title');
    this.musicMode = 'title';
  }

  setScreen(name) {
    this.screen = name;
    const map = {
      title: '#title-screen', starter: '#starter-screen', game: '#game-screen',
      battle: '#battle-screen', evolution: '#evolution-screen', ending: '#ending-screen',
    };
    for (const [key, sel] of Object.entries(map)) {
      const el = $(sel);
      if (!el) continue;
      el.classList.toggle('hidden', key !== name);
    }
    if (name === 'game' && this.overworld) {
      setTimeout(() => this.overworld.resize(), 40);
    }
  }

  /* ─────────────── UI binding ─────────────── */

  _bindUI() {
    $('#btn-new').addEventListener('click', () => { audio.sfx('select'); this.requestNewGame(); });
    $('#btn-continue').addEventListener('click', () => { audio.sfx('select'); this.continueGame(); });
    $('#btn-howto').addEventListener('click', () => { audio.sfx('open'); this.openHowTo(); });
    $('#btn-starter-back').addEventListener('click', () => { audio.sfx('click'); this.setScreen('title'); this.musicMode = 'title'; audio.setMusic('title'); });
    $('#btn-sound-title').addEventListener('click', () => this.toggleSound());
    $('#btn-sound').addEventListener('click', () => this.toggleSound());
    $('#btn-party').addEventListener('click', () => { audio.sfx('open'); this.openParty(); });
    $('#btn-bag').addEventListener('click', () => { audio.sfx('open'); this.openBag(); });
    $('#btn-quest').addEventListener('click', () => { audio.sfx('open'); this.openQuest(); });
    $('#btn-map').addEventListener('click', () => { audio.sfx('open'); this.openMap(); });
    $('#btn-interact').addEventListener('click', () => this.pressA());
    $('#btn-back').addEventListener('click', () => { audio.sfx('open'); this.openPauseMenu(); });
    $('#modal-close').addEventListener('click', () => { audio.sfx('click'); closeModal(); });
    $('#evo-skip').addEventListener('click', () => { if (this.evoSkipResolve) this.evoSkipResolve(); });

    $('#modal').addEventListener('click', e => this.onModalClick(e));

    $('#btn-ending-continue').addEventListener('click', () => { audio.sfx('select'); this.resumeExploring(); });
    $('#btn-ending-title').addEventListener('click', () => { audio.sfx('click'); this.buildTitle(); saveGame(this.state); });

    // dialogue advance by tapping it
    $('#dialogue').addEventListener('pointerdown', e => { e.preventDefault(); advanceDialogue(); });
    $('#interact-prompt').addEventListener('pointerdown', e => { e.preventDefault(); this.pressA(); });

    this.bindTouchDpad();
    this.bindKeyboard();
    window.addEventListener('beforeunload', () => { if (this.state) saveGame(this.state); });
  }

  bindTouchDpad() {
    const dirs = ['up', 'down', 'left', 'right'];
    for (const dir of dirs) {
      const btn = document.querySelector(`.dp[data-dir="${dir}"]`);
      if (!btn) continue;
      const down = e => {
        e.preventDefault();
        if (this.overworld) this.overworld.setDirection(dir, true);
      };
      const up = e => {
        e.preventDefault();
        if (this.overworld) this.overworld.setDirection(dir, false);
      };
      btn.addEventListener('pointerdown', down);
      btn.addEventListener('pointerup', up);
      btn.addEventListener('pointercancel', up);
      btn.addEventListener('pointerleave', up);
      btn.addEventListener('lostpointercapture', up);
    }
  }

  bindKeyboard() {
    const map = { ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right', w: 'up', s: 'down', a: 'left', d: 'right', W: 'up', S: 'down', A: 'left', D: 'right' };
    window.addEventListener('keydown', e => {
      if (e.target && /input|textarea/i.test(e.target.tagName)) return;
      if (this.screen === 'title') {
        if (e.key === 'Enter') { if (hasSave()) this.continueGame(); else this.requestNewGame(); }
        if (e.key === '?') this.openHowTo();
        return;
      }
      if (this.screen === 'starter') {
        const n = Number(e.key);
        if (n >= 1 && n <= STARTERS.length) this.chooseStarter(STARTERS[n - 1]);
        return;
      }
      if (this.screen !== 'game' && this.screen !== 'battle') return;

      const dir = map[e.key];
      if (dir) {
        e.preventDefault();
        if (this.screen === 'game' && !isDialogueOpen() && !isModalOpen()) {
          this.overworld?.setDirection(dir, true);
        }
        return;
      }
      if (e.key === 'e' || e.key === 'E' || e.key === 'Enter' || e.key === ' ' || e.key === 'Spacebar') {
        if (this.screen !== 'game') return;
        e.preventDefault();
        this.pressA();
        return;
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        if (isModalOpen()) closeModal();
        else if (this.screen === 'game' && !isDialogueOpen()) this.openPauseMenu();
        return;
      }
      if (e.key === 'b' || e.key === 'B') { if (this.screen === 'game' && !isDialogueOpen()) this.openBag(); }
      if (e.key === 't' || e.key === 'T') { if (this.screen === 'game' && !isDialogueOpen()) this.openParty(); }
      if (e.key === 'm' || e.key === 'M') { if (this.screen === 'game' && !isDialogueOpen()) this.openMap(); }
      if (e.key === 'q' || e.key === 'Q') { if (this.screen === 'game' && !isDialogueOpen()) this.openQuest(); }
    });
    window.addEventListener('keyup', e => {
      const map2 = { ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right', w: 'up', s: 'down', a: 'left', d: 'right', W: 'up', S: 'down', A: 'left', D: 'right' };
      const dir = map2[e.key];
      if (dir && this.overworld) this.overworld.setDirection(dir, false);
    });
  }

  toggleSound() {
    const on = audio.toggle();
    localStorage.setItem('bloom-and-bond-sound', on ? 'on' : 'off');
    $('#btn-sound').classList.toggle('muted', !on);
    $('#btn-sound-title').classList.toggle('muted', !on);
    if (on) { audio.ensure(); audio.mode = null; audio.setMusic(this.musicMode); toast('Sound on ♪'); }
    else toast('Sound off');
  }

  /* ─────────────── new / continue ─────────────── */

  requestNewGame() {
    if (!hasSave()) { this.openStarterPicker(); return; }
    openModal({
      title: 'Start a new journey?',
      body: `<p style="margin:4px 0;font-size:.88rem;line-height:1.55">A saved journey already exists. Starting over will replace it with a brand-new adventure.</p>
        <p class="hint" style="margin-top:6px">Your old party and seals will be lost.</p>`,
      foot: `<button class="btn ghost" data-action="cancel">Cancel</button><button class="btn primary" data-action="new-confirm">Start Over</button>`,
    });
  }

  openStarterPicker() {
    this.setScreen('starter');
    this.musicMode = 'title';
    audio.setMusic('title');
    const grid = $('#starter-grid');
    grid.innerHTML = STARTERS.map((id, i) => {
      const sp = SPECIES[id];
      const evo = SPECIES[sp.evolvesTo];
      const c = TYPE_META[sp.type];
      const statBar = (label, val, max) => `<div class="s-bar"><span>${label}</span><i><b style="width:${clamp(val / max * 100, 8, 100)}%;background:${c.color}"></b></i></div>`;
      return `<article class="starter-card" data-starter="${id}" style="--glow:${c.color}55">
        <div class="starter-art">${monsterSVG(sp)}</div>
        <span class="s-type" style="background:${c.color}">${c.icon} ${sp.type}</span>
        <h3>${sp.name}</h3>
        <p class="s-sub">${sp.title}</p>
        <p class="s-desc">${sp.desc}</p>
        <div class="s-bars">
          ${statBar('HP', sp.base.hp, 40)}
          ${statBar('ATK', sp.base.atk, 14)}
          ${statBar('SPD', sp.base.spd, 16)}
        </div>
        <div class="s-evo">Evolves at <b>Lv. ${sp.evolveLevel}</b> → <b>${evo.name}</b></div>
        <button class="btn primary" data-choose="${id}">Choose ${sp.name}</button>
      </article>`;
    }).join('');
    grid.onclick = e => {
      const b = e.target.closest('[data-choose]');
      if (!b) return;
      const id = b.dataset.choose;
      grid.querySelectorAll('.starter-card').forEach(c => c.classList.toggle('selected', c.dataset.starter === id));
      audio.sfx('select');
      this.chooseStarter(id);
    };
  }

  async chooseStarter(id) {
    if (this.busy) return;
    this.busy = true;
    const sp = SPECIES[id];
    const state = freshState();
    state.party.push(makeCreature(id, 5));
    state.seen[id] = true;
    state.flags.starterChosen = true;
    this.state = state;
    this.lastSealCount = 0;
    saveGame(state);
    audio.sfx('victory');
    await transition(300);
    this.enterWorld(true);
    this.busy = false;
    $('#btn-continue').classList.remove('hidden');
    showDialogue({
      name: 'Professor Lila', portrait: 'professor',
      lines: [
        `Oh, ${sp.name}! A wonderful choice. Look at those little cheeks — she's still a chibi.`,
        `Every Bloomkin grows when her bond matures. ${sp.name} will evolve at level 6, and she will grow into a grown-up ${SPECIES[sp.evolvesTo].name}.`,
        `Earn three Bloom Seals from Mira, Rowan, and Elowen. Then the Briar Shrine will open for you.`,
        `Walk through tall grass to meet wild Bloomkin. Weaken them, then use a Bond Orb to make a friend. Off you go, Wren!`,
      ],
      onDone: () => {
        saveGame(this.state);
        toast('Tip: press A or tap the action button to talk.', 'gold');
      },
    });
  }

  continueGame() {
    const state = loadGame();
    if (!state) { toast('No save found.'); return; }
    if (!state.party || !state.party.length) {
      state.party = [makeCreature('nia', 5)];
      state.seen.nia = true;
    }
    this.state = state;
    this.lastSealCount = sealCount(state);
    this.enterWorld(false);
    bigToast(`Welcome back, Wren`, 1400);
    if (state.flags.ending) toast('The vale is at peace. You can still explore!', 'gold');
  }

  enterWorld(isNew) {
    this.setScreen('game');
    this.musicMode = 'world';
    audio.setMusic('world');
    if (!this.overworld) {
      this.overworld = new Overworld($('#world'), this);
      this.battle = new Battle(this);
    }
    this.overworld.setState(this.state);
    this.overworld.start();
    this.overworld.setPaused(false);
    this.updateHUD();
    if (isNew) {
      setTimeout(() => this.overworld.resize(), 60);
    }
  }

  /* ─────────────── overworld hooks ─────────────── */

  overlayBlocking() {
    return this.screen !== 'game' || isDialogueOpen() || isModalOpen() || this.evolving || this.busy;
  }

  onStep() {
    if (!this.state) return;
    if (this.state.player.steps % 14 === 0) saveGame(this.state);
  }

  onRegionChange(name) {
    if (!this.state) return;
    this.state.location = name;
    $('#hud-loc').textContent = name;
    this.state.flags.visited = this.state.flags.visited || {};
    if (!this.state.flags.visited[name]) {
      this.state.flags.visited[name] = true;
      bigToast(name, 1200);
      saveGame(this.state);
    }
  }

  updatePrompt(target) {
    this.currentTarget = target;
    const prompt = $('#interact-prompt');
    const text = $('#interact-text');
    if (!target || this.screen !== 'game' || isDialogueOpen() || isModalOpen() || this.evolving) {
      prompt.classList.add('hidden');
      return;
    }
    prompt.classList.remove('hidden');
    text.textContent = target.label;
  }

  pressA() {
    if (isDialogueOpen()) { advanceDialogue(); return; }
    if (isModalOpen()) return;
    if (this.screen !== 'game' || this.busy || this.evolving) return;
    const t = this.currentTarget;
    if (t) this.interactWith(t);
  }

  sealCount() { return this.state ? sealCount(this.state) : 0; }

  /* ─────────────── interacting ─────────────── */

  async interactWith(target) {
    if (!this.state) return;
    audio.sfx('select');
    this.overworld.clearHeld();
    if (target.kind === 'sign') {
      showDialogue({ name: 'Weathered Sign', portrait: 'villager', lines: [target.sign.text] });
      return;
    }
    if (target.kind === 'building') {
      const lines = {
        cottage: ['A cozy cottage with rose vines around the door. Someone inside is humming.', 'The doorknob is warm. You feel welcome here.'],
        shop: ['Pip\'s Petals smells of honey and fresh soil. Talk to Pip outside to shop.'],
        hall: ['Lumen Hall. The town\'s Bloom Seals are awarded on its steps each spring.'],
        inn: ['The Sleeping Fern Inn. A sign reads: "Bloomkin welcome. Muddy paws welcome too."'],
        cabin: ['The grove cabin is quiet. A kettle whistles somewhere inside.'],
        shrine: ['The Briar Shrine hums with old magic. Queen Briar waits in the courtyard.'],
      };
      showDialogue({ name: target.building.name, portrait: 'villager', lines: (lines[target.building.kind] || ['The door is shut, but you hear gentle singing inside.']) });
      return;
    }
    if (target.kind === 'heal') {
      healParty(this.state);
      saveGame(this.state);
      this.updateHUD();
      audio.sfx('heal');
      bigToast('✿ Your team is fully rested! ✿', 1500);
      toast(target.prop.name + ' restores every Bloomkin.', 'gold');
      return;
    }
    if (target.kind === 'gate') {
      if (this.state.flags.gateOpened) {
        showDialogue({ name: 'Shrine Gate', portrait: 'queen', lines: ['The gate stands open. Petals drift down the steps like an invitation.'] });
      } else if (this.sealCount() >= 3) {
        this.state.flags.gateOpened = true;
        saveGame(this.state);
        audio.sfx('victory');
        bigToast('The Shrine Gate opens!', 1800);
        showDialogue({ name: 'Queen Briar', portrait: 'queen', lines: ['Three seals. Three bonds. The gate knows you now.', 'Come up to the shrine, bond-keeper. Let us see what you have grown.'] });
        this.updateHUD();
      } else {
        const n = this.sealCount();
        showDialogue({
          name: 'Sealed Gate', portrait: 'queen',
          lines: [`Ancient glyphs glow across the gate. ${n} of 3 seal sockets are filled.`, 'Mira keeps the meadow seal. Rowan keeps the town seal. Elowen keeps the grove seal.', 'Return when all three are yours.'],
        });
      }
      return;
    }
    if (target.kind === 'prop') {
      if (target.prop.kind === 'altar') {
        showDialogue({ name: 'Bloom Altar', portrait: 'queen', lines: ['A crown of living flowers floats above the altar.', 'It waits for the sovereign. Speak with Queen Briar to begin the final trial.'] });
      }
      return;
    }
    if (target.kind === 'npc') {
      const n = target.npc;
      if (n.shop) { this.openShop(); return; }
      if (n.trainer) { await this.talkToTrainer(n.trainer); return; }
      showDialogue({ name: n.name, portrait: n.portrait, lines: n.lines });
      return;
    }
  }

  async talkToTrainer(id) {
    const t = TRAINERS[id];
    if (!t) return;
    const done = !!this.state.flags.defeated[id];
    this.overworld.setPaused(true);
    if (done) {
      const lines = id === 'briar'
        ? ['The vale is brighter with you in it, Wren. Go on — grow more bonds.']
        : [`You've already earned my seal, and my friendship. Come visit anytime.`];
      showDialogue({ name: t.name, portrait: t.portrait, lines, onDone: () => this.overworld.setPaused(false) });
      return;
    }
    showDialogue({
      name: t.name, portrait: t.portrait, lines: t.intro,
      onDone: () => this.startTrainerBattle(id),
    });
  }

  /* ─────────────── battles ─────────────── */

  async startWildEncounter(zone) {
    if (this.busy || this.screen !== 'game' || isDialogueOpen() || isModalOpen()) return;
    const enc = pickEncounter(zone);
    const level = enc.min + Math.floor(Math.random() * (enc.max - enc.min + 1));
    this.state.seen[enc.species] = true;
    this.busy = true;
    this.overworld.setPaused(true);
    audio.sfx('open');
    await transition(260);
    this.overworld.stop();
    this.screen = 'battle';
    this.musicMode = 'battle';
    audio.setMusic('battle');
    this.battle.start({
      enemyTeam: [{ species: enc.species, level }],
      wild: true,
      zone,
    });
    this.busy = false;
  }

  async startTrainerBattle(id) {
    const t = TRAINERS[id];
    if (!t || this.busy) return;
    this.busy = true;
    this.overworld.setPaused(true);
    audio.sfx('open');
    await transition(300);
    this.overworld.stop();
    this.screen = 'battle';
    this.musicMode = 'battle';
    audio.setMusic('battle');
    this.state.stats.battles++;
    this.battle.start({
      enemyTeam: t.team.map(c => makeCreature(c.species, c.level)),
      wild: false,
      trainer: t,
      trainerId: id,
      zone: id === 'briar' ? 'shrine' : id === 'elowen' ? 'forest' : 'meadow',
    });
    this.busy = false;
  }

  async onBattleEnd(result) {
    if (!this.state) return;
    if (result.result === 'win') {
      this.state.stats.wins++;
      if (!result.wild && result.trainerId) {
        const t = TRAINERS[result.trainerId];
        const first = !this.state.flags.defeated[result.trainerId];
        this.state.flags.defeated[result.trainerId] = true;
        if (first && t.reward && t.reward.seal !== undefined) {
          this.state.player.seals[t.reward.seal] = true;
          this.lastSealCount = this.sealCount();
          setTimeout(() => audio.sfx('victory'), 300);
          bigToast('✿ Bloom Seal earned! ✿', 1800);
          this.hudSealPop();
        }
        if (t.reward && t.reward.finale) this.state.flags.ending = true;
      }
      saveGame(this.state);
    } else if (result.result === 'lose') {
      this.state.player.coins = Math.max(0, this.state.player.coins - 30);
      healParty(this.state);
      this.state.player.x = 10;
      this.state.player.y = 29;
      this.state.player.dir = 'up';
      saveGame(this.state);
    } else if (result.result === 'catch') {
      saveGame(this.state);
      toast('A new bond joins your team!', 'rose');
    } else if (result.result === 'run') {
      saveGame(this.state);
    }

    await transition(200);
    this.setScreen('game');
    if (this.overworld) {
      this.overworld.setState(this.state);
      this.overworld.start();
      this.overworld.setPaused(true);
    }
    this.musicMode = 'world';
    audio.setMusic('world');
    this.updateHUD();
    this.busy = false;

    if (result.result === 'lose') {
      showDialogue({
        name: 'Professor Lila', portrait: 'professor',
        lines: ['There you are! I found you dozing in the meadow with your Bloomkin piled on top of you.', 'I healed everyone and carried you home. Take a breath, then try again. The vale is patient.'],
        onDone: () => { saveGame(this.state); this.overworld.setPaused(false); this.updateHUD(); },
      });
      return;
    }

    if (result.result === 'win' && result.trainerId) {
      const t = TRAINERS[result.trainerId];
      const wasFinale = t.reward && t.reward.finale;
      const lines = wasFinale
        ? [t.defeat, 'The crown dissolves into petals. The shrine fills with light, and every Bloomkin in the vale lifts her head.', 'You did not conquer the vale, Wren. You helped it bloom.']
        : [t.defeat];
      showDialogue({
        name: t.name, portrait: t.portrait, lines,
        onDone: async () => {
          this.overworld.setPaused(false);
          saveGame(this.state);
          if (wasFinale) { this.showEnding(); return; }
          await this.checkEvolutions();
        },
      });
      return;
    }

    this.overworld.setPaused(false);
    const evo = await this.checkEvolutions();
    if (result.result === 'win' || result.result === 'catch') {
      if (Math.random() < .35) setTimeout(() => toast(pick(TIPS)), 1200);
    }
  }

  hudSealPop() {
    const seals = $$('#hud-seals .seal');
    seals.forEach((el, i) => {
      el.classList.toggle('filled', !!this.state.player.seals[i]);
      if (this.state.player.seals[i]) {
        el.classList.add('pop');
        setTimeout(() => el.classList.remove('pop'), 700);
      }
    });
  }

  /* ─────────────── evolution ─────────────── */

  async checkEvolutions() {
    if (!this.state) return false;
    let did = false;
    for (const c of this.state.party) {
      if (evolvable(c)) {
        await this.runEvolution(c);
        did = true;
      }
    }
    return did;
  }

  async runEvolution(c) {
    const old = SPECIES[c.species];
    const to = SPECIES[old.evolvesTo];
    if (!to) return;
    this.evolving = true;
    this.overworld?.setPaused(true);
    this.overworld?.stop();
    const beforeHp = statsOf(c).maxHp;
    const beforeAtk = statsOf(c).atk;
    this.setScreen('evolution');
    $('#evolution-screen').classList.remove('hidden');
    $('#evo-old').className = 'evo-figure old';
    $('#evo-new').className = 'evo-figure new';
    $('#evo-old').innerHTML = monsterSVG(old);
    $('#evo-new').innerHTML = monsterSVG(to);
    $('#evo-title').textContent = `${old.name} is evolving!`;
    $('#evo-sub').textContent = `Her bond is blooming. She's growing into her true self…`;
    const stars = $('#evo-sparkles');
    stars.innerHTML = '';
    for (let i = 0; i < 26; i++) {
      const s = document.createElement('div');
      s.className = 'evo-star';
      s.style.left = Math.random() * 100 + '%';
      s.style.bottom = (Math.random() * 30) + '%';
      s.style.animationDelay = (-Math.random() * 3) + 's';
      s.style.animationDuration = (1.8 + Math.random() * 2.2) + 's';
      stars.appendChild(s);
    }
    this.musicMode = 'evolve';
    audio.setMusic('evolve');
    audio.sfx('evolve');

    let skipped = false;
    const skipPromise = new Promise(res => { this.evoSkipResolve = () => { skipped = true; res(); }; });
    const delay = ms => Promise.race([wait(ms), skipPromise]);

    await delay(1700);
    $('#evo-old').classList.add('gone');
    const sil = $('#evo-silhouette');
    sil.classList.remove('flash');
    void sil.offsetWidth;
    sil.classList.add('flash');
    audio.sfx('level');
    await delay(650);
    evolveCreature(c);
    this.state.stats.evolutions++;
    this.state.seen[to.id] = true;
    const afterHp = statsOf(c).maxHp;
    const afterAtk = statsOf(c).atk;
    $('#evo-new').classList.add('reveal');
    $('#evo-title').textContent = `${old.name} evolved into ${to.name}!`;
    $('#evo-sub').textContent = `She grew from a chibi into her grown-up form!  HP ${beforeHp} → ${afterHp} · ATK ${beforeAtk} → ${afterAtk}`;
    audio.sfx('victory');
    bigToast(`✿ ${to.name} blossomed! ✿`, 1900);
    await delay(skipped ? 900 : 2600);
    this.setScreen('game');
    this.overworld.setState(this.state);
    this.overworld.start();
    this.overworld.setPaused(false);
    this.updateHUD();
    saveGame(this.state);
    this.evolving = false;
    this.evoSkipResolve = null;
    this.musicMode = 'world';
    audio.setMusic('world');
    toast(`${to.name} is all grown up!`, 'gold');
  }

  /* ─────────────── HUD / quest ─────────────── */

  updateHUD() {
    if (!this.state) return;
    const lead = this.state.party.find(c => c.hp > 0) || this.state.party[0];
    if (lead) {
      const sp = SPECIES[lead.species];
      $('#hud-player-lv').textContent = 'Lv. ' + lead.level;
      $('#hud-avatar').textContent = TYPE_META[sp.type].icon;
      $('#hud-avatar').style.background = `radial-gradient(circle at 35% 28%, ${TYPE_META[sp.type].color}, ${TYPE_META[sp.type].deep} 72%)`;
    }
    $('#hud-loc').textContent = this.state.location || regionName(this.state.player.x, this.state.player.y);
    const seals = $$('#hud-seals .seal');
    seals.forEach((el, i) => {
      el.classList.toggle('filled', !!this.state.player.seals[i]);
    });
    const n = this.sealCount();
    const qTitle = $('#quest-title');
    const qText = $('#quest-text');
    if (this.state.flags.ending) {
      qTitle.textContent = 'A Vale at Peace';
      qText.textContent = 'The Bloom Court is restored. Keep exploring and raising your team.';
    } else if (n >= 3) {
      qTitle.textContent = 'The Shrine Awaits';
      qText.textContent = 'All three seals are yours. Climb to Briar Shrine and challenge Queen Briar.';
    } else {
      qTitle.textContent = 'The Bloom Trials';
      const next = QUEST_SEALS.find(q => !this.state.flags.defeated[q.id]);
      qText.textContent = next
        ? `Earn Bloom Seals from the keepers. (${n}/3) · Next: ${next.person}, ${next.place}.`
        : `Earn Bloom Seals from the keepers. (${n}/3)`;
    }
  }

  /* ─────────────── modals ─────────────── */

  openParty() {
    if (!this.state) return;
    this.openPartyModal();
  }

  openPartyModal() {
    const lead = this.state.party.findIndex(c => c.hp > 0);
    const rows = this.state.party.map((c, i) => {
      const sp = SPECIES[c.species];
      const st = statsOf(c);
      const ratio = clamp(c.hp / st.maxHp, 0, 1);
      const hearts = '♥'.repeat(Math.min(5, c.bond || 1)) + '♡'.repeat(Math.max(0, 5 - (c.bond || 1)));
      return `<div class="party-row ${i === lead ? 'active' : ''}">
        <div class="party-art">${monsterSVG(sp)}</div>
        <div class="party-main">
          <div class="party-name">${sp.name} <small>Lv. ${c.level}</small></div>
          <div class="party-sub">${typeChipSmall(sp.type)}<span class="hint">${sp.title}</span></div>
          <div class="party-bar"><i class="${hpClass(ratio)}" style="width:${ratio * 100}%"></i></div>
          <div class="party-hp">${Math.round(c.hp)} / ${st.maxHp} HP · ${c.xp}/${xpToNext(c.level)} XP</div>
          <div class="party-hp" style="color:#c95f7c">${hearts} bond · ATK ${st.atk} · DEF ${st.def} · SPD ${st.spd}</div>
        </div>
        <div class="party-actions">
          ${i === lead ? '<span class="hint" style="font-size:.58rem;font-weight:900;color:#a8792a">LEAD</span>' : `<button class="btn ghost" data-lead="${i}" ${c.hp <= 0 ? 'disabled' : ''}>Lead</button>`}
        </div>
      </div>`;
    }).join('');
    const reserve = this.state.box.length
      ? `<p class="party-note">Reserve meadow: ${this.state.box.map(c => SPECIES[c.species].name + ' Lv.' + c.level).join(' · ')}</p>`
      : '';
    openModal({
      title: 'Your Bloomkin',
      wide: true,
      body: `<div class="party-list">${rows}</div>${reserve}
        <p class="party-note">The lead Bloomkin fights first and walks beside you in the vale. Choose another lead to change the order.</p>`,
      foot: `<button class="btn ghost" data-action="know-types">Type Guide</button><button class="btn primary" data-action="close">Done</button>`,
    });
  }

  setLead(index) {
    if (!this.state) return;
    const c = this.state.party[index];
    if (!c || c.hp <= 0) return;
    this.state.party.splice(index, 1);
    this.state.party.unshift(c);
    audio.sfx('select');
    saveGame(this.state);
    this.updateHUD();
    this.openPartyModal();
    toast(`${SPECIES[c.species].name} is now your lead.`);
  }

  openBag() {
    if (!this.state) return;
    this.openBagModal();
  }

  openBagModal() {
    const items = this.state.player.items;
    const lead = this.state.party.find(c => c.hp > 0) || this.state.party[0];
    const phase = this.screen === 'battle' ? 'battle' : 'field';
    const rows = Object.values(ITEMS).map(item => {
      const count = items[item.id] || 0;
      const usable = (item.id === 'potion' || item.id === 'tea') && phase === 'field' && lead && lead.hp < statsOf(lead).maxHp && count > 0;
      let why = item.desc;
      if (item.id === 'orb') why = phase === 'battle' ? 'Use from the battle Bag tab.' : 'Used in wild battles.';
      else if (count <= 0) why = 'None left.';
      else if (lead && lead.hp >= statsOf(lead).maxHp) why = 'Lead is already full.';
      else why = 'Restores your lead Bloomkin.';
      return `<div class="bag-row">
        <div class="bag-ic">${item.icon}</div>
        <div class="bag-main">
          <div class="bag-name">${item.name}</div>
          <div class="bag-desc">${item.desc}</div>
        </div>
        <span class="bag-count">×${count}</span>
        ${usable ? `<button class="btn primary" data-use="${item.id}" style="padding:8px 12px;font-size:.65rem">Use</button>` : `<span class="hint" style="font-size:.58rem;max-width:74px;text-align:right">${why}</span>`}
      </div>`;
    }).join('');
    openModal({
      title: 'Your Bag',
      body: `<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:9px">
          <span class="hint">Satchel of small kindnesses</span>
          <span class="coin-pill">✦ ${this.state.player.coins} coins</span>
        </div><div class="bag-list">${rows}</div>`,
      foot: `<button class="btn primary" data-action="close">Done</button>`,
    });
  }

  useFieldItem(id) {
    const lead = this.state.party.find(c => c.hp > 0) || this.state.party[0];
    if (!lead) return;
    if ((this.state.player.items[id] || 0) <= 0) { toast('You are out of those.'); return; }
    const max = statsOf(lead).maxHp;
    if (lead.hp >= max) { toast(`${SPECIES[lead.species].name} is already full of beans.`); return; }
    const heal = Math.min(ITEMS[id].heal, max - lead.hp);
    lead.hp += heal;
    this.state.player.items[id]--;
    audio.sfx('heal');
    toast(`${SPECIES[lead.species].name} recovered ${heal} HP.`, 'rose');
    saveGame(this.state);
    this.updateHUD();
    this.openBagModal();
  }

  openQuest() {
    if (!this.state) return;
    const n = this.sealCount();
    const rows = QUEST_SEALS.map((q, i) => {
      const done = !!this.state.flags.defeated[q.id];
      return `<div class="quest-row ${done ? 'done' : ''}">
        <div class="q-badge">${done ? '✓' : i + 1}</div>
        <div>
          <h4>${q.name} — ${q.person}</h4>
          <p>${done ? 'Earned! ' : ''}${q.hint}</p>
        </div>
      </div>`;
    }).join('');
    const finalRow = `<div class="quest-row ${this.state.flags.ending ? 'done' : ''}">
      <div class="q-badge">${this.state.flags.ending ? '✓' : '✿'}</div>
      <div><h4>The Bloom Sovereign</h4><p>${this.state.flags.ending ? 'Queen Briar has lowered her crown. The vale is at peace.' : 'Open the shrine gate with 3 seals, then defeat Queen Briar at Briar Shrine.'}</p></div>
    </div>`;
    openModal({
      title: 'Quest Log',
      body: `<p class="hint" style="margin:0 0 9px">${n}/3 Bloom Seals · ${this.state.stats.battles} battles · ${this.state.stats.caught} bonds made · ${formatTime(this.state.playSeconds)} roaming</p>
        <div class="quest-list">${rows}${finalRow}</div>
        <p class="party-note">Bloomkin evolve as they grow: starters at Lv. 6, wild Bloomkin at Lv. 9–10. Evolution also makes them visibly taller and more human-shaped.</p>`,
      foot: `<button class="btn primary" data-action="close">Done</button>`,
    });
  }

  openMap() {
    if (!this.state) return;
    openModal({
      title: 'Verdant Vale',
      wide: true,
      body: `<div class="map-wrap">
        <canvas class="map-canvas" id="mini-map" width="336" height="238"></canvas>
        <div class="map-legend">
          <span><i class="you"></i> You</span>
          <span><i class="npc"></i> Keepers</span>
          <span><i class="seal"></i> Seals</span>
          <span><i class="shrine"></i> Shrine</span>
          <span style="margin-top:6px" class="hint">${this.state.location}</span>
        </div>
      </div>
      <p class="party-note">Verdant Hollow → Sunbeam Route → Lumen Town → Whisperwood → Briar Shrine. Tall grass hides wild Bloomkin.</p>`,
      foot: `<button class="btn primary" data-action="close">Close Map</button>`,
    });
    this.drawMiniMap();
  }

  drawMiniMap() {
    const canvas = $('#mini-map');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const sx = canvas.width / MAP_W, sy = canvas.height / MAP_H;
    const colors = { '.': '#629f66', ',': '#68a96c', '#': '#d9c48f', '=': '#b6c0a9', H: '#3f8852', T: '#2d7447', W: '#3d8fbe', R: '#8d968e' };
    for (let y = 0; y < MAP_H; y++) for (let x = 0; x < MAP_W; x++) {
      ctx.fillStyle = colors[MAP[y][x]] || '#5c9c63';
      ctx.fillRect(x * sx, y * sy, sx + .5, sy + .5);
    }
    // buildings
    for (const b of BUILDINGS) {
      ctx.fillStyle = b.roof;
      ctx.fillRect(b.x * sx, b.y * sy, b.w * sx, b.h * sy);
    }
    // trainers
    for (const n of NPCS) {
      if (!n.trainer) continue;
      const done = !!this.state.flags.defeated[n.trainer];
      ctx.fillStyle = done ? 'rgba(255,255,255,.35)' : '#ff8fab';
      ctx.beginPath(); ctx.arc(n.x * sx + sx / 2, n.y * sy + sy / 2, Math.max(2.4, sx * .65), 0, 6.3); ctx.fill();
      if (!done) { ctx.strokeStyle = '#fff3b8'; ctx.lineWidth = 1; ctx.stroke(); }
    }
    // shop
    for (const n of NPCS) {
      if (!n.shop) continue;
      ctx.fillStyle = '#ffb84d';
      ctx.fillRect(n.x * sx - 1, n.y * sy - 1, sx + 2, sy + 2);
    }
    // shrine
    ctx.fillStyle = '#c7a4ff';
    ctx.beginPath(); ctx.arc(40 * sx, 8 * sy, Math.max(2.5, sx * .8), 0, 6.3); ctx.fill();
    // gate
    if (!this.state.flags.gateOpened) {
      ctx.fillStyle = '#e8e0bd';
      ctx.fillRect(35 * sx - 1, 10 * sy - 2, 3, sy + 4);
    }
    // player
    const px = this.state.player.x * sx + sx / 2, py = this.state.player.y * sy + sy / 2;
    ctx.fillStyle = 'rgba(255, 245, 190, .35)';
    ctx.beginPath(); ctx.arc(px, py, 7, 0, 6.3); ctx.fill();
    ctx.fillStyle = '#fff5be';
    ctx.strokeStyle = '#7a5a1c';
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.arc(px, py, 3.6, 0, 6.3); ctx.fill(); ctx.stroke();
  }

  openShop() {
    if (!this.state) return;
    this.openShopModal();
  }

  openShopModal() {
    const coins = this.state.player.coins;
    const rows = Object.values(ITEMS).map(item => `<div class="shop-row">
      <div class="bag-ic">${item.icon}</div>
      <div class="bag-main"><div class="bag-name">${item.name}</div><div class="bag-desc">${item.desc}</div></div>
      <button class="buy" data-buy="${item.id}" ${coins < item.price ? 'disabled' : ''}>✦ ${item.price}</button>
    </div>`).join('');
    openModal({
      title: "Pip's Petals",
      body: `<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:9px">
          <p class="hint" style="margin:0">"Everything a bond-keeper needs, and a few things she doesn't!"</p>
          <span class="coin-pill">✦ ${coins}</span>
        </div><div class="shop-grid">${rows}</div>`,
      foot: `<button class="btn ghost" data-action="close">Leave</button>`,
    });
  }

  buyItem(id) {
    const item = ITEMS[id];
    if (!item) return;
    if (this.state.player.coins < item.price) { toast('Not enough coins.'); return; }
    this.state.player.coins -= item.price;
    this.state.player.items[id] = (this.state.player.items[id] || 0) + 1;
    audio.sfx('catch');
    toast(`${item.name} purchased!`, 'gold');
    saveGame(this.state);
    this.openShopModal();
  }

  openHowTo() {
    openModal({
      title: 'How to Play',
      wide: true,
      body: `<div class="quest-list">
        <div class="quest-row"><div class="q-badge">1</div><div><h4>Explore</h4><p>Use the arrow keys / WASD, or the on-screen D-pad. Press A (or E / Enter / Space) to talk, read signs, heal, and open gates.</p></div></div>
        <div class="quest-row"><div class="q-badge">2</div><div><h4>Befriend</h4><p>Walk through tall grass to meet wild Bloomkin. Weaken them in battle, then throw a Bond Orb. A weakened Bloomkin is much easier to befriend.</p></div></div>
        <div class="quest-row"><div class="q-badge">3</div><div><h4>Bloom</h4><p>Your starter is a chibi at first. Reach Lv. 6 and she will evolve — growing visibly taller and more human-shaped. Wild lines evolve at Lv. 9–10.</p></div></div>
        <div class="quest-row"><div class="q-badge">4</div><div><h4>Triumph</h4><p>Defeat Mira, Rowan, and Elowen for three Bloom Seals. The shrine gate opens when all three are yours. Then challenge Queen Briar.</p></div></div>
      </div>
      <div style="display:flex;flex-wrap:wrap;gap:6px;margin-top:12px">
        <span class="tchip" style="background:#58b978">❧ Leaf beats Water</span>
        <span class="tchip" style="background:#5eb7de">❉ Water beats Flame</span>
        <span class="tchip" style="background:#f0845d">✹ Flame beats Leaf</span>
        <span class="tchip" style="background:#e7bc4a">✦ Spark beats Water</span>
      </div>
      <p class="party-note">Phone/tablet: tap the D-pad to walk and the large A button to interact. Progress saves automatically. Use the ☰ button for Team, Bag, Quests, Map, Sound, and Save.</p>`,
      foot: `<button class="btn primary" data-action="close">Got it</button>`,
    });
  }

  openPauseMenu() {
    if (!this.state) return;
    openModal({
      title: 'Pause',
      body: `<div class="quest-list">
        <button class="quest-row" data-action="party" style="cursor:pointer;width:100%;text-align:left"><div class="q-badge">☘</div><div><h4>Team</h4><p>Check your Bloomkin, HP, levels, and set a new lead.</p></div></button>
        <button class="quest-row" data-action="bag" style="cursor:pointer;width:100%;text-align:left"><div class="q-badge">◈</div><div><h4>Bag</h4><p>Use potions, inspect Bond Orbs, count your coins.</p></div></button>
        <button class="quest-row" data-action="quest" style="cursor:pointer;width:100%;text-align:left"><div class="q-badge">✧</div><div><h4>Quest Log</h4><p>See your seals and the next step of the journey.</p></div></button>
        <button class="quest-row" data-action="map" style="cursor:pointer;width:100%;text-align:left"><div class="q-badge">▦</div><div><h4>Map</h4><p>A hand-drawn map of Verdant Vale.</p></div></button>
        <button class="quest-row" data-action="howto" style="cursor:pointer;width:100%;text-align:left"><div class="q-badge">?</div><div><h4>How to Play</h4><p>Controls, catching, evolution, and type matchups.</p></div></button>
        <button class="quest-row" data-action="sound" style="cursor:pointer;width:100%;text-align:left"><div class="q-badge">${audio.enabled ? '♪' : '—'}</div><div><h4>Sound: ${audio.enabled ? 'On' : 'Off'}</h4><p>Toggle the vale's music and sound effects.</p></div></button>
      </div>`,
      foot: `<button class="btn ghost" data-action="save">Save Game</button><button class="btn ghost" data-action="title">Title Screen</button><button class="btn primary" data-action="close">Resume</button>`,
    });
  }

  onModalClick(e) {
    const leadBtn = e.target.closest('[data-lead]');
    if (leadBtn) { this.setLead(Number(leadBtn.dataset.lead)); return; }
    const useBtn = e.target.closest('[data-use]');
    if (useBtn) { audio.sfx('click'); this.useFieldItem(useBtn.dataset.use); return; }
    const buyBtn = e.target.closest('[data-buy]');
    if (buyBtn) { audio.sfx('click'); this.buyItem(buyBtn.dataset.buy); return; }
    const action = e.target.closest('[data-action]');
    if (!action) return;
    const a = action.dataset.action;
    audio.sfx('click');
    if (a === 'close' || a === 'cancel') { closeModal(); return; }
    if (a === 'new-confirm') { closeModal(); deleteSave(); this.openStarterPicker(); return; }
    if (a === 'party') { this.openPartyModal(); return; }
    if (a === 'bag') { this.openBagModal(); return; }
    if (a === 'quest') { this.openQuest(); return; }
    if (a === 'map') { this.openMap(); return; }
    if (a === 'howto') { this.openHowTo(); return; }
    if (a === 'know-types') { this.openHowTo(); return; }
    if (a === 'sound') { this.toggleSound(); this.openPauseMenu(); return; }
    if (a === 'save') { saveGame(this.state); toast('Journey saved.', 'gold'); return; }
    if (a === 'title') { saveGame(this.state); closeModal(); this.buildTitle(); return; }
  }

  /* ─────────────── ending ─────────────── */

  showEnding() {
    if (!this.state) return;
    this.state.flags.ending = true;
    saveGame(this.state);
    this.overworld?.setPaused(true);
    this.overworld?.stop();
    this.musicMode = 'ending';
    audio.setMusic('ending');
    this.setScreen('ending');
    $('#ending-lede').textContent = 'Queen Briar lowers her crown. Verdant Vale blooms brighter than ever, and every bond you made is part of it.';
    $('#ending-team').innerHTML = this.state.party.map(c => `<div class="ending-mon">${monsterSVG(SPECIES[c.species])}</div>`).join('');
    const evoCount = this.state.stats.evolutions;
    $('#ending-stats').innerHTML = [
      `<span class="ending-stat"><b>${this.state.stats.wins}</b> battles won</span>`,
      `<span class="ending-stat"><b>${this.state.stats.caught}</b> bonds made</span>`,
      `<span class="ending-stat"><b>${evoCount}</b> evolution${evoCount === 1 ? '' : 's'}</span>`,
      `<span class="ending-stat"><b>${formatTime(this.state.playSeconds)}</b> together</span>`,
      `<span class="ending-stat"><b>3/3</b> Bloom Seals</span>`,
    ].join('');
    const petals = $('#ending-petals');
    petals.innerHTML = '';
    for (let i = 0; i < 20; i++) {
      const p = document.createElement('div');
      p.className = 'petal';
      p.style.left = Math.random() * 100 + '%';
      p.style.animationDuration = (8 + Math.random() * 8) + 's';
      p.style.animationDelay = (-Math.random() * 12) + 's';
      p.style.setProperty('--drift', (Math.random() * 16 - 8) + 'vw');
      petals.appendChild(p);
    }
    audio.sfx('victory');
  }

  resumeExploring() {
    this.setScreen('game');
    this.musicMode = 'world';
    audio.setMusic('world');
    if (this.overworld) {
      this.overworld.setState(this.state);
      this.overworld.start();
      this.overworld.setPaused(false);
    }
    this.updateHUD();
    toast('The vale is yours to wander.', 'gold');
  }
}

/* helper used by onBattleEnd for random tips */
function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
