/* ════════════════════════════════════════════════════════════════
   battle.js — turn-based Bloomkin duels
   ════════════════════════════════════════════════════════════════ */

import { MOVES, SPECIES, TYPE_CHART, TYPE_META, ITEMS, statsFor, makeCreature, xpToNext, clamp, pick } from './data.js';
import { monsterSVG } from './art.js';
import { statsOf, addXp, addCreature } from './state.js';
import { $, typeChipSmall, hpClass, teamGridHTML, toast, bigToast } from './ui.js';
import { audio } from './audio.js';

const wait = ms => new Promise(res => setTimeout(res, ms));

export class Battle {
  constructor(game) {
    this.game = game;
    this.root = $('#battle-screen');
    this.zone = 'route';
    this.busy = false;
    this.battleOver = false;
    this.wild = true;
    this.trainer = null;
    this.trainerId = null;
    this.enemyTeam = [];
    this.enemyIndex = 0;
    this.playerIndex = 0;
    this.turn = 0;
    this.forcedSwitch = false;
    this.xpEarned = 0;
    this.coinsEarned = 0;
    this.logLines = [];
    this.tab = 'fight';
    this._bound = false;
    this.bindEvents();
  }

  get state() { return this.game.state; }
  activePlayer() { return this.state.party[this.playerIndex]; }
  activeEnemy() { return this.enemyTeam[this.enemyIndex]; }

  bindEvents() {
    if (this._bound) return;
    this._bound = true;
    $('#battle-tabs').addEventListener('click', e => {
      const b = e.target.closest('.btab');
      if (!b || this.busy || this.forcedSwitch) return;
      audio.sfx('click');
      const tab = b.dataset.tab;
      if (tab === 'run') { this.tryRun(); return; }
      this.tab = tab;
      this.renderActions();
    });
    $('#battle-actions').addEventListener('click', e => {
      if (this.busy) return;
      const move = e.target.closest('[data-move]');
      if (move) { this.useMove(move.dataset.move); return; }
      const item = e.target.closest('[data-item]');
      if (item) { this.useBag(item.dataset.item); return; }
      const team = e.target.closest('[data-team]');
      if (team) { this.selectTeam(Number(team.dataset.team)); return; }
    });
    $('#battle-log-toggle').addEventListener('click', () => {
      $('#battle-log').classList.toggle('hidden');
      audio.sfx('click');
    });
  }

  /* ─────────────── setup ─────────────── */

  async start({ enemyTeam, wild = true, trainer = null, trainerId = null, zone = 'route' }) {
    this.wild = wild;
    this.trainer = trainer;
    this.trainerId = trainerId;
    this.zone = zone;
    this.enemyTeam = enemyTeam.map(c => {
      if (typeof c === 'string') return makeCreature(c, 5);
      if (c.species) return { species: c.species, level: c.level, xp: 0, hp: statsFor(c.species, c.level).maxHp, bond: 1 };
      return c;
    });
    this.enemyIndex = 0;
    this.playerIndex = this.state.party.findIndex(c => c.hp > 0);
    if (this.playerIndex < 0) this.playerIndex = 0;
    this.busy = true;
    this.battleOver = false;
    this.forcedSwitch = false;
    this.turn = 0;
    this.xpEarned = 0;
    this.coinsEarned = 0;
    this.logLines = [];
    this.tab = 'fight';

    this.root.classList.remove('hidden');
    this.root.classList.remove('zone-forest', 'zone-shrine', 'zone-meadow', 'zone-town', 'zone-route');
    this.root.classList.add('zone-' + zone);
    $('#battle-log').classList.add('hidden');
    $('#battle-log').innerHTML = '';
    $('#battle-log-toggle').classList.remove('hidden');
    $('#battle-banner').classList.add('hidden');
    $('#damage-layer').innerHTML = '';

    this.setPlayer(this.activePlayer(), true);
    this.setEnemy(this.activeEnemy(), true);
    this.updateBars();
    this.renderActions();

    const lead = this.activePlayer();
    const en = this.activeEnemy();
    if (!lead || !en) { this.game.onBattleEnd({ result: 'lose' }); return; }

    if (this.trainer) {
      this.say(`${this.trainer.name} challenges you!`);
      this.log(`${this.trainer.name} challenges you!`);
    } else {
      this.say(`A wild ${SPECIES[en.species].name} appeared!`);
      this.log(`A wild ${SPECIES[en.species].name} appeared!`);
    }
    await wait(650);
    this.say(`Go, ${SPECIES[lead.species].name}!`);
    this.log(`Go, ${SPECIES[lead.species].name}!`);
    await wait(500);
    this.say(`What will ${SPECIES[lead.species].name} do?`);
    this.busy = false;
    this.showActions();
  }

  setPlayer(c, enter = false) {
    if (!c) return;
    const sp = SPECIES[c.species];
    const max = statsOf(c).maxHp;
    $('#player-art').innerHTML = monsterSVG(sp);
    $('#battle-player-name').textContent = sp.name;
    $('#battle-player-lv').textContent = 'Lv. ' + c.level;
    $('#battle-player-types').innerHTML = typeChipSmall(sp.type);
    $('#battle-player-hp-num').textContent = `${Math.max(0, Math.round(c.hp))} / ${max}`;
    const pm = $('#player-mon');
    if (enter) {
      pm.classList.remove('faint', 'enter');
      void pm.offsetWidth;
      pm.classList.add('enter');
    }
  }

  setEnemy(c, enter = false) {
    if (!c) return;
    const sp = SPECIES[c.species];
    const max = statsOf(c).maxHp;
    $('#enemy-art').innerHTML = monsterSVG(sp);
    $('#enemy-name').textContent = sp.name;
    $('#enemy-lv').textContent = 'Lv. ' + c.level;
    $('#enemy-types').innerHTML = typeChipSmall(sp.type);
    $('#enemy-hp-num').textContent = `${Math.max(0, Math.round(c.hp))} / ${max}`;
    const em = $('#enemy-mon');
    if (enter) {
      em.classList.remove('faint', 'enter');
      void em.offsetWidth;
      em.classList.add('enter');
    }
  }

  updateBars() {
    const p = this.activePlayer();
    const e = this.activeEnemy();
    if (p) {
      const max = statsOf(p).maxHp;
      const ratio = clamp(p.hp / max, 0, 1);
      const fill = $('#battle-player-hp');
      fill.style.width = (ratio * 100) + '%';
      fill.className = 'hp-fill ' + hpClass(ratio);
      $('#battle-player-hp-num').textContent = `${Math.max(0, Math.round(p.hp))} / ${max}`;
      const need = xpToNext(p.level);
      $('#battle-player-xp').style.width = clamp(p.xp / need, 0, 1) * 100 + '%';
    }
    if (e) {
      const max = statsOf(e).maxHp;
      const ratio = clamp(e.hp / max, 0, 1);
      const fill = $('#enemy-hp');
      fill.style.width = (ratio * 100) + '%';
      fill.className = 'hp-fill ' + hpClass(ratio);
      $('#enemy-hp-num').textContent = `${Math.max(0, Math.round(e.hp))} / ${max}`;
    }
  }

  /* ─────────────── messaging ─────────────── */

  say(text) {
    $('#battle-msg').textContent = text;
  }

  log(text) {
    this.logLines.push(text);
    if (this.logLines.length > 40) this.logLines.shift();
    const el = $('#battle-log');
    el.innerHTML = this.logLines.map(t => `<p>${t}</p>`).join('');
    el.scrollTop = el.scrollHeight;
  }

  async pause(ms = 500) { await wait(ms); }

  /* ─────────────── actions ─────────────── */

  showActions() {
    if (this.battleOver) return;
    this.renderActions();
    this.updateBars();
  }

  renderActions() {
    if (this.forcedSwitch) {
      $('#battle-tabs').classList.add('hidden');
      this.renderForcedSwitch();
      return;
    }
    $('#battle-tabs').classList.remove('hidden');
    document.querySelectorAll('.btab').forEach(b => b.classList.toggle('active', b.dataset.tab === this.tab));
    if (this.tab === 'fight') this.renderMoves();
    else if (this.tab === 'bag') this.renderBag();
    else if (this.tab === 'team') this.renderTeam();
    else this.renderMoves();
  }

  renderMoves() {
    const p = this.activePlayer();
    const sp = SPECIES[p.species];
    $('#battle-actions').innerHTML = sp.moves.map(id => {
      const m = MOVES[id];
      const c = TYPE_META[m.type];
      const meta = m.power ? `Power ${m.power}` : 'Heals';
      return `<button class="move-btn" data-move="${id}" style="--mt:${c.color}">
        <span class="m-name">${m.name}</span>
        <span class="m-meta"><b>${c.icon} ${m.type}</b> · ${meta}</span>
      </button>`;
    }).join('');
  }

  renderBag() {
    const items = this.state.player.items;
    const p = this.activePlayer();
    const max = statsOf(p).maxHp;
    const rows = [];
    if (this.wild) {
      rows.push(this.bagButton('orb', items.orb || 0, max));
    }
    rows.push(this.bagButton('potion', items.potion || 0, max));
    rows.push(this.bagButton('tea', items.tea || 0, max));
    $('#battle-actions').innerHTML = `<div class="bag-grid">${rows.join('')}</div>`;
  }

  bagButton(id, count, max) {
    const item = ITEMS[id];
    const p = this.activePlayer();
    const full = p.hp >= max;
    const disabled = count <= 0 || ((id === 'potion' || id === 'tea') && full);
    const reason = count <= 0
      ? 'None left'
      : (id === 'potion' || id === 'tea') && full ? 'Already full HP' : item.desc;
    return `<button class="bag-item" data-item="${id}" ${disabled ? 'disabled' : ''}>
      <span class="ic">${item.icon}</span>
      <span><span>${item.name} ×${count}</span><small>${reason}</small></span>
    </button>`;
  }

  renderTeam() {
    const p = this.activePlayer();
    const inner = this.state.party.map((c, i) => {
      const sp = SPECIES[c.species];
      const max = statsOf(c).maxHp;
      const ratio = clamp(c.hp / max, 0, 1);
      const pct = Math.max(0, ratio * 100);
      return `<button class="team-card ${i === this.playerIndex ? 'active' : ''} ${c.hp <= 0 ? 'fainted' : ''}" data-team="${i}" ${c.hp <= 0 || i === this.playerIndex ? 'disabled' : ''}>
        <div class="tc-art">${monsterSVG(sp)}</div>
        <div>
          <div class="tc-name">${sp.name} <span class="hint">Lv.${c.level}</span></div>
          <div class="tc-sub">${sp.type}${c.hp <= 0 ? ' · fainted' : ''}</div>
          <div class="hp-mini"><i style="width:${pct}%;background:${ratio <= .22 ? '#d94747' : ratio <= .5 ? '#e6a92e' : '#3db765'}"></i></div>
        </div>
      </button>`;
    }).join('');
    $('#battle-actions').innerHTML = `<div class="team-grid">${inner}</div>`;
  }

  renderForcedSwitch() {
    this.say('Choose your next Bloomkin!');
    const inner = this.state.party.map((c, i) => {
      const sp = SPECIES[c.species];
      const max = statsOf(c).maxHp;
      const ratio = clamp(c.hp / max, 0, 1);
      return `<button class="team-card ${c.hp <= 0 ? 'fainted' : ''}" data-team="${i}" ${c.hp <= 0 ? 'disabled' : ''}>
        <div class="tc-art">${monsterSVG(sp)}</div>
        <div>
          <div class="tc-name">${sp.name} <span class="hint">Lv.${c.level}</span></div>
          <div class="tc-sub">${sp.type}${c.hp <= 0 ? ' · fainted' : ''}</div>
          <div class="hp-mini"><i style="width:${Math.max(0, ratio * 100)}%"></i></div>
        </div>
      </button>`;
    }).join('');
    const none = this.state.party.every(c => c.hp <= 0);
    $('#battle-actions').innerHTML = `<div class="team-grid">${inner}${none ? '<p class="hint" style="grid-column:1/-1">No one is able to fight…</p>' : ''}</div>`;
  }

  /* ─────────────── player choices ─────────────── */

  async useMove(moveId) {
    if (this.busy || this.battleOver) return;
    this.busy = true;
    this.tab = 'fight';
    const p = this.activePlayer();
    const e = this.activeEnemy();
    const move = MOVES[moveId];
    if (!p || !e || !move) { this.busy = false; return; }
    audio.sfx('click');
    await this.performRound({ type: 'move', moveId });
    if (this.battleOver) return;
    this.busy = false;
    if (this.forcedSwitch) { this.showActions(); return; }
    this.tab = 'fight';
    this.showActions();
  }

  async useBag(itemId) {
    if (this.busy || this.battleOver) return;
    this.busy = true;
    audio.sfx('click');
    this.tab = 'bag';
    await this.performRound({ type: 'item', itemId });
    if (this.battleOver) return;
    this.busy = false;
    if (this.forcedSwitch) { this.showActions(); return; }
    this.tab = 'fight';
    this.showActions();
  }

  async selectTeam(index) {
    if (this.busy || this.battleOver) return;
    const c = this.state.party[index];
    if (!c || c.hp <= 0) return;
    if (index === this.playerIndex && !this.forcedSwitch) return;
    audio.sfx('select');

    if (this.forcedSwitch) {
      this.busy = true;
      this.playerIndex = index;
      this.forcedSwitch = false;
      this.setPlayer(c, true);
      this.updateBars();
      this.say(`Go, ${SPECIES[c.species].name}!`);
      this.log(`Go, ${SPECIES[c.species].name}!`);
      await wait(600);
      this.busy = false;
      this.tab = 'fight';
      this.showActions();
      return;
    }

    this.busy = true;
    this.tab = 'team';
    await this.performRound({ type: 'switch', index });
    if (this.battleOver) return;
    this.busy = false;
    if (this.forcedSwitch) { this.showActions(); return; }
    this.tab = 'fight';
    this.showActions();
  }

  async tryRun() {
    if (this.busy || this.battleOver) return;
    if (!this.wild) {
      this.say('There is no running from a keeper\'s challenge!');
      this.log('There is no running from a keeper\'s challenge!');
      audio.sfx('fail');
      return;
    }
    this.busy = true;
    audio.sfx('click');
    this.say('You slip away through the tall grass…');
    this.log('You slip away through the tall grass…');
    await wait(700);
    await this.finish({ result: 'run' });
  }

  /* ─────────────── round engine ─────────────── */

  async performRound(action) {
    const p = this.activePlayer();
    const e = this.activeEnemy();
    if (!p || !e) return;

    if (action.type === 'item') {
      if (action.itemId === 'orb') {
        if (!this.wild) {
          this.say('You can\'t bond with another keeper\'s Bloomkin!');
          this.log('You can\'t bond with another keeper\'s Bloomkin!');
          audio.sfx('fail');
          await wait(650);
          return;
        }
        await this.attemptCatch();
        if (this.battleOver) return;
        // failed catch: enemy gets a turn
        await this.enemyTurn();
        return;
      }
      this.state.player.items[action.itemId]--;
      const item = ITEMS[action.itemId];
      const max = statsOf(p).maxHp;
      const heal = Math.min(item.heal, max - p.hp);
      p.hp += heal;
      audio.sfx('heal');
      this.say(`${SPECIES[p.species].name} drank the ${item.name} and recovered ${heal} HP!`);
      this.log(`${SPECIES[p.species].name} recovered ${heal} HP.`);
      this.damageNumber('player', '+' + heal, false, true);
      this.updateBars();
      await wait(700);
      await this.enemyTurn();
      return;
    }

    if (action.type === 'switch') {
      this.playerIndex = action.index;
      this.setPlayer(this.activePlayer(), true);
      this.updateBars();
      this.say(`Go, ${SPECIES[this.activePlayer().species].name}!`);
      this.log(`Switched to ${SPECIES[this.activePlayer().species].name}.`);
      audio.sfx('select');
      await wait(650);
      await this.enemyTurn();
      return;
    }

    if (action.type === 'move') {
      const playerFirst = p.spd > e.spd || (p.spd === e.spd && Math.random() < .5);
      if (playerFirst) {
        await this.doMove('player', p, e, action.moveId);
        if (await this.checkFaint('enemy')) return;
        await this.enemyTurn();
      } else {
        await this.enemyTurn();
        if (this.battleOver || this.forcedSwitch) return;
        if (this.activePlayer() && this.activePlayer().hp > 0) {
          await this.doMove('player', this.activePlayer(), this.activeEnemy(), action.moveId);
          await this.checkFaint('enemy');
        }
      }
      return;
    }
  }

  async enemyTurn() {
    if (this.battleOver) return;
    const e = this.activeEnemy();
    const p = this.activePlayer();
    if (!e || !p || e.hp <= 0 || p.hp <= 0) return;
    const moveId = this.chooseEnemyMove(e, p);
    await this.doMove('enemy', e, p, moveId);
    await this.checkFaint('player');
  }

  chooseEnemyMove(e, p) {
    const sp = SPECIES[e.species];
    const moves = sp.moves;
    const healMove = moves.find(id => MOVES[id].heal && e.hp / statsOf(e).maxHp < .38);
    if (healMove && Math.random() < .55) return healMove;
    const scored = moves.filter(id => MOVES[id].power).map(id => {
      const m = MOVES[id];
      const eff = (TYPE_CHART[m.type] && TYPE_CHART[m.type][SPECIES[p.species].type]) || 1;
      return { id, score: m.power * eff + Math.random() * 4 };
    });
    scored.sort((a, b) => b.score - a.score);
    return scored.length ? scored[0].id : moves[0];
  }

  async doMove(side, attacker, defender, moveId) {
    const move = MOVES[moveId];
    if (!move) return;
    const aSp = SPECIES[attacker.species];
    const dSp = SPECIES[defender.species];
    this.say(`${aSp.name} used ${move.name}!`);
    this.log(`${aSp.name} used ${move.name}!`);
    audio.sfx('select');
    await wait(320);

    if (move.heal) {
      const max = statsOf(attacker).maxHp;
      const amount = Math.min(max - attacker.hp, Math.round(max * move.heal));
      attacker.hp += amount;
      audio.sfx('heal');
      this.animateAttack(side);
      if (side === 'player') this.floatHeal('player', amount); else this.floatHeal('enemy', amount);
      this.updateBars();
      this.say(`${aSp.name} glows softly and recovers ${amount} HP!`);
      this.log(`${aSp.name} recovered ${amount} HP.`);
      await wait(700);
      return;
    }

    this.animateAttack(side);
    await wait(160);
    const crit = Math.random() < .08;
    const eff = (TYPE_CHART[move.type] && TYPE_CHART[move.type][dSp.type]) || 1;
    const atk = statsOf(attacker).atk;
    const def = statsOf(defender).def;
    let dmg = (move.power + atk * .48 - def * .3) * (.9 + Math.random() * .2);
    dmg *= eff;
    if (crit) dmg *= 1.55;
    dmg = Math.max(1, Math.round(dmg));
    defender.hp = Math.max(0, defender.hp - dmg);

    if (crit || eff > 1.3) audio.sfx('super'); else if (eff < .8) audio.sfx('weak'); else audio.sfx('hit');
    this.hitAnim(side === 'player' ? 'enemy' : 'player');
    this.shakeScene();
    this.damageNumber(side === 'player' ? 'enemy' : 'player', String(dmg), crit);
    this.updateBars();
    await wait(340);
    if (crit) { this.say('A critical bloom!'); await wait(420); }
    if (eff > 1.3) { this.say('It\'s super effective!'); this.log('It\'s super effective!'); await wait(460); }
    else if (eff < .8) { this.say('It\'s not very effective…'); this.log('It\'s not very effective…'); await wait(460); }
    this.say(`${dSp.name} took ${dmg} damage!`);
  }

  animateAttack(side) {
    const el = side === 'player' ? $('#player-mon') : $('#enemy-mon');
    el.classList.remove('attack-player', 'attack-enemy');
    void el.offsetWidth;
    el.classList.add(side === 'player' ? 'attack-player' : 'attack-enemy');
    setTimeout(() => el.classList.remove('attack-player', 'attack-enemy'), 450);
    const target = side === 'player' ? $('#enemy-mon') : $('#player-mon');
    setTimeout(() => {
      target.classList.remove('hit');
      void target.offsetWidth;
      target.classList.add('hit');
      setTimeout(() => target.classList.remove('hit'), 480);
    }, 170);
  }

  hitAnim(side) {
    const el = side === 'player' ? $('#player-mon') : $('#enemy-mon');
    el.classList.remove('hit');
    void el.offsetWidth;
    el.classList.add('hit');
    setTimeout(() => el.classList.remove('hit'), 480);
  }

  shakeScene() {
    const scene = $('.battle-scene');
    scene.classList.remove('shake');
    void scene.offsetWidth;
    scene.classList.add('shake');
    setTimeout(() => scene.classList.remove('shake'), 320);
  }

  damageNumber(side, text, crit = false, heal = false) {
    const scene = $('.battle-scene');
    const target = side === 'player' ? $('#player-mon') : $('#enemy-mon');
    if (!scene || !target) return;
    const sr = scene.getBoundingClientRect();
    const tr = target.getBoundingClientRect();
    const el = document.createElement('div');
    el.className = `dmg ${crit ? 'crit' : ''} ${heal ? 'heal' : ''}`;
    el.textContent = text;
    el.style.left = (tr.left - sr.left + tr.width * .5 - 20) + 'px';
    el.style.top = (tr.top - sr.top + tr.height * .22) + 'px';
    $('#damage-layer').appendChild(el);
    setTimeout(() => el.remove(), 1050);
    if (crit) this.sparkleBurst(side, 10);
  }

  floatHeal(side, amount) {
    this.damageNumber(side, '+' + amount, false, true);
    this.sparkleBurst(side, 8);
  }

  sparkleBurst(side, count = 8) {
    const scene = $('.battle-scene');
    const target = side === 'player' ? $('#player-mon') : $('#enemy-mon');
    if (!scene || !target) return;
    const sr = scene.getBoundingClientRect();
    const tr = target.getBoundingClientRect();
    for (let i = 0; i < count; i++) {
      const s = document.createElement('div');
      s.className = 'spark-p';
      s.style.left = (tr.left - sr.left + tr.width * (.2 + Math.random() * .6)) + 'px';
      s.style.top = (tr.top - sr.top + tr.height * (.2 + Math.random() * .5)) + 'px';
      s.style.setProperty('--dx', (Math.random() - .5) * 120 + 'px');
      s.style.setProperty('--dy', (-30 - Math.random() * 90) + 'px');
      $('#battle-particles').appendChild(s);
      setTimeout(() => s.remove(), 800);
    }
  }

  /* ─────────────── catching ─────────────── */

  async attemptCatch() {
    const e = this.activeEnemy();
    const sp = SPECIES[e.species];
    if (!this.state.player.items.orb || this.state.player.items.orb <= 0) {
      this.say('You have no Bond Orbs left.');
      return;
    }
    this.state.player.items.orb--;
    const max = statsOf(e).maxHp;
    const hpRatio = e.hp / max;
    const lead = this.activePlayer();
    let chance = .16 + (1 - hpRatio) * .66 + (lead.level - e.level) * .02;
    chance = clamp(chance, .06, .95);
    audio.sfx('select');
    this.say('You toss a Bond Orb…');
    this.log('You tossed a Bond Orb…');
    this.throwOrb();
    await wait(900);
    this.say('…');
    for (let i = 0; i < 3; i++) {
      audio.sfx('click');
      this.hitAnim('enemy');
      await wait(420);
    }
    if (Math.random() < chance) {
      audio.sfx('catch');
      bigToast('✿ Bond formed! ✿');
      this.sparkleBurst('enemy', 18);
      const caught = makeCreature(e.species, e.level);
      const where = addCreature(this.state, caught);
      this.state.seen[e.species] = true;
      this.say(`Gotcha! ${sp.name} joins your ${where.where === 'party' ? 'team' : 'reserve'}!`);
      this.log(`Caught ${sp.name}!`);
      this.updateBars();
      await wait(1100);
      await this.finish({ result: 'catch', caught: caught.species });
    } else {
      audio.sfx('fail');
      this.say(`Oh no! ${sp.name} broke free!`);
      this.log(`${sp.name} broke free.`);
      await wait(700);
    }
  }

  throwOrb() {
    const scene = $('.battle-scene');
    if (!scene) return;
    const orb = document.createElement('div');
    orb.className = 'orb-toss';
    orb.textContent = '◉';
    scene.appendChild(orb);
    setTimeout(() => orb.remove(), 1000);
  }

  /* ─────────────── faints & ends ─────────────── */

  async checkFaint(side) {
    if (side === 'enemy') {
      const e = this.activeEnemy();
      if (!e || e.hp > 0) return false;
      const sp = SPECIES[e.species];
      this.xpEarned += 14 + e.level * 7;
      this.coinsEarned += 9 + e.level * 3;
      $('#enemy-mon').classList.add('faint');
      audio.sfx('faint');
      this.say(`${sp.name} fainted!`);
      this.log(`${sp.name} fainted!`);
      await wait(850);
      $('#enemy-mon').classList.remove('faint');
      if (this.enemyIndex < this.enemyTeam.length - 1) {
        this.enemyIndex++;
        const next = this.activeEnemy();
        this.setEnemy(next, true);
        this.updateBars();
        const line = this.trainer ? `${this.trainer.name} sent out ${SPECIES[next.species].name}!` : `A wild ${SPECIES[next.species].name} appeared!`;
        this.say(line);
        this.log(line);
        await wait(800);
        return true;
      }
      await this.winBattle();
      return true;
    }

    const p = this.activePlayer();
    if (!p || p.hp > 0) return false;
    const sp = SPECIES[p.species];
    $('#player-mon').classList.add('faint');
    audio.sfx('faint');
    this.say(`${sp.name} fainted!`);
    this.log(`${sp.name} fainted!`);
    await wait(850);
    $('#player-mon').classList.remove('faint');
    const alive = this.state.party.some(c => c.hp > 0);
    if (!alive) { await this.loseBattle(); return true; }
    this.forcedSwitch = true;
    this.say('Choose your next Bloomkin!');
    this.renderActions();
    return true;
  }

  async winBattle() {
    if (this.battleOver) return;
    this.battleOver = true;
    this.busy = true;
    audio.sfx('victory');
    bigToast('✿ Victory! ✿', 1500);
    const lead = this.activePlayer();
    this.say('You won the battle!');
    this.log('You won the battle!');
    await wait(600);

    // XP: lead gets full, the rest of the team shares half
    const xp = this.xpEarned;
    if (lead && xp > 0) {
      const res = addXp(lead, xp);
      this.say(`${SPECIES[lead.species].name} gained ${xp} XP!`);
      this.log(`${SPECIES[lead.species].name} gained ${xp} XP.`);
      this.updateBars();
      await wait(700);
      for (const lvl of res.levels) {
        this.state.stats.levelUps++;
        audio.sfx('level');
        bigToast(`${SPECIES[lead.species].name} grew to Lv. ${lvl}!`, 1300);
        this.say(`${SPECIES[lead.species].name} grew to Lv. ${lvl}!`);
        this.log(`Level up! Now Lv. ${lvl}.`);
        this.updateBars();
        await wait(900);
      }
    }
    for (let i = 0; i < this.state.party.length; i++) {
      if (i === this.playerIndex) continue;
      const c = this.state.party[i];
      if (c.hp > 0 && xp > 0) addXp(c, Math.round(xp * .45));
    }
    this.updateBars();

    if (this.trainer && this.trainer.reward) {
      this.state.player.coins += this.trainer.reward.coins;
      this.coinsEarned = this.trainer.reward.coins;
    } else {
      this.state.player.coins += this.coinsEarned;
    }
    this.say(`Found ${this.coinsEarned} coins!`);
    await wait(750);
    await this.finish({ result: 'win', wild: this.wild, trainerId: this.trainerId, xp: xp });
  }

  async loseBattle() {
    if (this.battleOver) return;
    this.battleOver = true;
    this.busy = true;
    this.say('All your Bloomkin are tuckered out…');
    audio.sfx('faint');
    await wait(1200);
    await this.finish({ result: 'lose' });
  }

  async finish(extra) {
    this.battleOver = true;
    this.busy = true;
    await wait(300);
    this.root.classList.add('hidden');
    this.game.onBattleEnd(extra);
  }
}
