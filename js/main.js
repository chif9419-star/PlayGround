/* ════════════════════════════════════════════════════════════════
   main.js — boot Bloom & Bond
   ════════════════════════════════════════════════════════════════ */

import { Game } from './game.js';
import { SPECIES, makeCreature } from './data.js';
import { saveGame, statsOf } from './state.js';

const game = new Game();
window.__bloom = {
  game,
  get state() { return game.state; },
  save() { if (game.state) saveGame(game.state); },
  teleport(x, y) {
    if (!game.state) return;
    game.state.player.x = x;
    game.state.player.y = y;
    game.overworld?.setState(game.state);
  },
  setSeals(n = 3) {
    if (!game.state) return;
    game.state.player.seals = [0, 1, 2].map(i => i < n);
    game.state.flags.gateOpened = n >= 3;
    game.updateHUD();
    saveGame(game.state);
  },
  addCoins(n = 500) {
    if (!game.state) return;
    game.state.player.coins += n;
    game.updateHUD();
  },
  evolveLead() {
    if (!game.state || !game.state.party.length) return;
    const c = game.state.party[0];
    const sp = SPECIES[c.species];
    c.level = Math.max(c.level, sp.evolveLevel);
    c.xp = 0;
    game.checkEvolutions();
  },
  async battle(species = 'poppy', level = 5, trainerId = null) {
    if (!game.state) return;
    game.overworld?.setPaused(true);
    game.overworld?.stop();
    game.setScreen('battle');
    game.screen = 'battle';
    game.musicMode = 'battle';
    const trainer = trainerId ? (await import('./data.js')).TRAINERS[trainerId] : null;
    game.battle.start({
      enemyTeam: trainer ? trainer.team.map(t => makeCreature(t.species, t.level)) : [{ species, level }],
      wild: !trainerId,
      trainer,
      trainerId,
      zone: trainerId === 'briar' ? 'shrine' : trainerId === 'elowen' ? 'forest' : 'meadow',
    });
  },
  ending() { if (game.state) game.showEnding(); },
  heal() {
    if (!game.state) return;
    game.state.party.forEach(c => { c.hp = statsOf(c).maxHp; });
    saveGame(game.state);
  },
};

// A gentle nudge for players arriving through a fresh link.
window.addEventListener('load', () => {
  document.body.classList.add('loaded');
});
