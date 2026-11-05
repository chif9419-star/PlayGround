/* ════════════════════════════════════════════════════════════════
   overworld.js — canvas world, movement, people & little wonders
   ════════════════════════════════════════════════════════════════ */

import { MAP, MAP_W, MAP_H, TILE, WORLD_OBJECTS, BUILDINGS, PROPS, NPCS, SIGNS, SPECIES, regionName, encounterZone } from './data.js';

const DIRS = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
};

const hash = (x, y, s = 1) => {
  const n = Math.sin(x * 127.1 + y * 311.7 + s * 74.7) * 43758.5453;
  return n - Math.floor(n);
};

function roundRect(ctx, x, y, w, h, r) {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

export class Overworld {
  constructor(canvas, game) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d', { alpha: false });
    this.game = game;
    this.state = null;
    this.running = false;
    this.paused = true;
    this.time = 0;
    this.last = 0;
    this.dpr = 1;
    this.w = 1; this.h = 1;
    this.ts = 48;
    this.camX = 0; this.camY = 0;
    this.px = 10; this.py = 29;
    this.vx = 10; this.vy = 29;
    this.dir = 'up';
    this.moving = false;
    this.moveT = 0;
    this.moveDur = 0.15;
    this.fromX = 10; this.fromY = 29;
    this.held = [];
    this.walkPhase = 0;
    this.bump = 0;
    this.trail = [];
    this.compX = 10; this.compY = 29;
    this.ambient = [];
    this.stepCooldown = 0;
    this.grassSteps = 0;
    this.nearest = null;
    this.frame = 0;
    this.resize();
    this._onResize = () => this.resize();
    window.addEventListener('resize', this._onResize);
    window.addEventListener('orientationchange', () => setTimeout(() => this.resize(), 120));
    this._loop = this._loop.bind(this);
  }

  setState(state) {
    this.state = state;
    this.px = state.player.x;
    this.py = state.player.y;
    this.vx = this.px; this.vy = this.py;
    this.dir = state.player.dir || 'up';
    this.compX = this.px; this.compY = this.py;
    this.trail = [];
    this.nearest = null;
    this.updateCamera(true);
  }

  resize() {
    const rect = this.canvas.getBoundingClientRect();
    this.w = Math.max(1, rect.width);
    this.h = Math.max(1, rect.height);
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.canvas.width = Math.round(this.w * this.dpr);
    this.canvas.height = Math.round(this.h * this.dpr);
    // camera zoom: keep the phone view intimate but not claustrophobic
    const fit = Math.min(this.w / 11, this.h / 8.4);
    this.ts = Math.max(34, Math.min(68, fit));
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    this.ctx.imageSmoothingEnabled = true;
    this.updateCamera(true);
    this.makeAmbient();
  }

  makeAmbient() {
    this.ambient = [];
    const count = Math.round(Math.min(26, (this.w * this.h) / 52000));
    for (let i = 0; i < count; i++) {
      this.ambient.push({
        x: Math.random() * this.w,
        y: Math.random() * this.h,
        s: 2 + Math.random() * 4,
        vy: 4 + Math.random() * 12,
        vx: -6 + Math.random() * 18,
        rot: Math.random() * 6.28,
        vr: (Math.random() - .5) * 2,
        a: .22 + Math.random() * .4,
        kind: Math.random() < .55 ? 'petal' : 'mote',
        ph: Math.random() * 6.28,
      });
    }
  }

  start() {
    if (this.running) return;
    this.running = true;
    this.last = performance.now();
    requestAnimationFrame(this._loop);
  }

  stop() {
    this.running = false;
    this.paused = true;
  }

  setPaused(p) {
    this.paused = p;
    if (!p) this.last = performance.now();
    if (p) this.held = [];
  }

  setDirection(dir, down) {
    const i = this.held.indexOf(dir);
    if (down && i < 0) this.held.push(dir);
    if (!down && i >= 0) this.held.splice(i, 1);
    if (down) this.dir = dir;
  }

  clearHeld() { this.held = []; }

  get targetDir() {
    if (!this.held.length) return null;
    return this.held[this.held.length - 1];
  }

  _loop(now) {
    if (!this.running) return;
    const dt = Math.min(.05, (now - this.last) / 1000 || 0);
    this.last = now;
    this.time += dt;
    this.frame++;
    if (!this.paused && this.state) this.update(dt);
    this.render();
    requestAnimationFrame(this._loop);
  }

  update(dt) {
    if (this.stepCooldown > 0) this.stepCooldown -= dt;
    if (this.bump > 0) this.bump = Math.max(0, this.bump - dt * 5);

    if (this.moving) {
      this.moveT += dt / this.moveDur;
      if (this.moveT >= 1) {
        this.moving = false;
        this.moveT = 0;
        this.vx = this.px; this.vy = this.py;
        this.arrive();
      } else {
        const t = this.moveT;
        const e = t * t * (3 - 2 * t);
        this.vx = this.fromX + (this.px - this.fromX) * e;
        this.vy = this.fromY + (this.py - this.fromY) * e;
        this.walkPhase += dt * 12;
      }
    } else {
      const d = this.targetDir;
      if (d && !this.game.overlayBlocking()) this.tryMove(d);
    }

    // companion glide
    const tx = this.trail.length ? this.trail[0].x : this.px;
    const ty = this.trail.length ? this.trail[0].y : this.py;
    const k = 1 - Math.exp(-dt * 8.5);
    this.compX += (tx - this.compX) * k;
    this.compY += (ty - this.compY) * k;

    // ambient
    for (const p of this.ambient) {
      p.x += (p.vx + Math.sin(this.time * .8 + p.ph) * 4) * dt;
      p.y += p.vy * dt;
      p.rot += p.vr * dt;
      if (p.y > this.h + 10) { p.y = -10; p.x = Math.random() * this.w; }
      if (p.x < -12) p.x = this.w + 10;
      if (p.x > this.w + 12) p.x = -10;
    }

    this.updateCamera(false);
    const near = this.getInteractable();
    if ((near && near.key) !== (this.nearest && this.nearest.key)) {
      this.nearest = near;
      this.game.updatePrompt(near);
    }
    // refresh prompt when trainer is defeated etc.
    if (this.frame % 30 === 0 && near) {
      this.nearest = near;
      this.game.updatePrompt(near);
    }
  }

  tryMove(dir) {
    if (this.moving) return;
    const d = DIRS[dir];
    if (!d) return;
    this.dir = dir;
    const nx = this.px + d.x, ny = this.py + d.y;
    if (!this.canWalk(nx, ny)) {
      this.bump = 1;
      // face even when blocked
      this.state.player.dir = dir;
      return;
    }
    this.fromX = this.px; this.fromY = this.py;
    this.trail.unshift({ x: this.px, y: this.py });
    if (this.trail.length > 5) this.trail.pop();
    this.px = nx; this.py = ny;
    this.moving = true;
    this.moveT = 0;
    this.moveDur = 0.145;
    this.state.player.x = nx;
    this.state.player.y = ny;
    this.state.player.dir = dir;
    this.state.player.steps++;
    this.state.stats.steps++;
    const region = regionName(nx, ny);
    if (this.state.location !== region) {
      this.state.location = region;
      this.game.onRegionChange(region);
    }
    this.game.onStep();
  }

  arrive() {
    const c = MAP[this.py] && MAP[this.py][this.px];
    if (c === 'H') {
      this.grassSteps++;
      if (this.stepCooldown <= 0 && this.grassSteps > 1 && Math.random() < .145) {
        this.grassSteps = 0;
        this.stepCooldown = 8;
        this.game.startWildEncounter(encounterZone(this.px, this.py));
      }
    } else {
      this.grassSteps = 0;
    }
    if (this.state.flags.ending) return;
    if (this.px === 35 && this.py === 10 && this.game.sealCount() >= 3 && !this.state.flags.gateOpened) {
      this.state.flags.gateOpened = true;
      this.game.openGate();
    }
  }

  canWalk(x, y) {
    if (x < 0 || y < 0 || x >= MAP_W || y >= MAP_H) return false;
    const c = MAP[y][x];
    if (c === 'T' || c === 'W' || c === 'R') return false;
    for (const b of BUILDINGS) {
      if (x >= b.x && x < b.x + b.w && y >= b.y && y < b.y + b.h) return false;
    }
    for (const p of PROPS) {
      if (p.gate && this.state.flags.gateOpened) continue;
      if (p.x === x && p.y === y) return false;
    }
    for (const n of NPCS) if (n.x === x && n.y === y) return false;
    for (const s of SIGNS) if (s.x === x && s.y === y) return false;
    return true;
  }

  getInteractable() {
    const front = { x: this.px + DIRS[this.dir].x, y: this.py + DIRS[this.dir].y };
    // NPC first (front, then adjacent for friendliness)
    for (const n of NPCS) {
      if (n.x === front.x && n.y === front.y) return this.npcTarget(n, 'npc');
    }
    for (const n of NPCS) {
      const dist = Math.abs(n.x - this.px) + Math.abs(n.y - this.py);
      if (dist === 1) return this.npcTarget(n, 'npc');
    }
    for (const s of SIGNS) if (s.x === front.x && s.y === front.y) return { kind: 'sign', key: 'sign-' + s.id, label: 'Read sign', sign: s };
    for (const p of PROPS) {
      if (p.x === front.x && p.y === front.y) {
        if (p.gate && this.state.flags.gateOpened) return { kind: 'gate', key: 'gate-open', label: 'Shrine Gate', prop: p };
        if (p.gate) return { kind: 'gate', key: 'gate', label: this.game.sealCount() >= 3 ? 'Open the gate' : 'Shrine Gate', prop: p };
        if (p.heal) return { kind: 'heal', key: 'heal-' + p.name, label: p.kind === 'moonwell' ? 'Bathe in the Moonwell' : 'Heal your team', prop: p };
        return { kind: 'prop', key: 'prop-' + p.name, label: p.name, prop: p };
      }
    }
    // doors: interact when facing into a building footprint
    for (const b of BUILDINGS) {
      const facingInside = front.x >= b.x && front.x < b.x + b.w && front.y >= b.y && front.y < b.y + b.h;
      if (facingInside) {
        return { kind: 'building', key: 'b-0' + b.kind, label: b.name, building: b };
      }
    }
    return null;
  }

  npcTarget(n, kind) {
    if (n.trainer) {
      const done = !!this.state.flags.defeated[n.trainer];
      return { kind: 'npc', key: 'npc-' + n.id + '-' + (done ? 'done' : 'ready'), label: done ? `Talk to ${n.name}` : `Challenge ${n.name}`, npc: n };
    }
    return { kind: 'npc', key: 'npc-' + n.id, label: n.shop ? 'Shop at Pip\'s Petals' : `Talk to ${n.name}`, npc: n };
  }

  updateCamera(instant = false) {
    const targetX = this.vx * this.ts + this.ts / 2 - this.w / 2;
    const targetY = this.vy * this.ts + this.ts * .62 - this.h / 2;
    const maxX = MAP_W * this.ts - this.w;
    const maxY = MAP_H * this.ts - this.h;
    const cx = Math.max(0, Math.min(maxX, targetX));
    const cy = Math.max(0, Math.min(maxY, targetY));
    if (instant) { this.camX = cx; this.camY = cy; }
    else {
      this.camX += (cx - this.camX) * .18;
      this.camY += (cy - this.camY) * .18;
    }
  }

  /* ══════════════════════════════ RENDER ══════════════════════════════ */

  render() {
    if (!this.state) return;
    const ctx = this.ctx;
    const { w, h, ts } = this;
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    ctx.fillStyle = '#4d9159';
    ctx.fillRect(0, 0, w, h);

    const ox = -this.camX;
    const oy = -this.camY;
    const x0 = Math.max(0, Math.floor(this.camX / ts) - 1);
    const x1 = Math.min(MAP_W - 1, Math.ceil((this.camX + w) / ts) + 1);
    const y0 = Math.max(0, Math.floor(this.camY / ts) - 1);
    const y1 = Math.min(MAP_H - 1, Math.ceil((this.camY + h) / ts) + 2);

    // ground pass
    for (let y = y0; y <= y1; y++) {
      for (let x = x0; x <= x1; x++) {
        this.drawGround(ctx, x, y, ox + x * ts, oy + y * ts, ts);
      }
    }

    // build sorted drawables
    const items = [];
    for (let y = y0; y <= y1; y++) {
      for (let x = x0; x <= x1; x++) {
        const c = MAP[y][x];
        if (c === 'T') items.push({ d: y + .84, f: () => this.drawTree(ctx, ox + x * ts, oy + y * ts, ts, x, y) });
        else if (c === 'R') items.push({ d: y + .5, f: () => this.drawRock(ctx, ox + x * ts, oy + y * ts, ts, x, y) });
      }
    }
    for (const b of BUILDINGS) {
      if (b.x + b.w < x0 || b.x > x1 || b.y + b.h < y0 || b.y > y1) continue;
      items.push({ d: b.y + b.h - .1, f: () => this.drawBuilding(ctx, b, ox, oy, ts) });
    }
    for (const p of PROPS) {
      if (p.x < x0 - 1 || p.x > x1 + 1 || p.y < y0 - 1 || p.y > y1 + 1) continue;
      items.push({ d: p.y + .7, f: () => this.drawProp(ctx, p, ox, oy, ts) });
    }
    for (const s of SIGNS) {
      if (s.x < x0 || s.x > x1 || s.y < y0 || s.y > y1) continue;
      items.push({ d: s.y + .6, f: () => this.drawSign(ctx, s, ox, oy, ts) });
    }
    for (const n of NPCS) {
      if (n.x < x0 - 1 || n.x > x1 + 1 || n.y < y0 - 1 || n.y > y1 + 1) continue;
      items.push({ d: n.y + .82, f: () => this.drawNPC(ctx, n, ox, oy, ts) });
    }
    items.push({ d: this.compY + .8, f: () => this.drawCompanion(ctx, ox, oy, ts) });
    items.push({ d: this.vy + .86, f: () => this.drawPlayer(ctx, ox, oy, ts) });
    items.sort((a, b) => a.d - b.d);
    for (const it of items) it.f();

    // foreground grass when standing inside it
    if (MAP[this.py] && MAP[this.py][this.px] === 'H') {
      const sx = ox + this.vx * ts, sy = oy + this.vy * ts;
      this.drawGrassOverlay(ctx, sx, sy, ts, this.px, this.py, .9);
    }

    // ambient petals / motes (screen space)
    this.drawAmbient(ctx, w, h);

    // soft map-edge fade
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, 'rgba(12,40,26,.16)');
    grad.addColorStop(.15, 'rgba(12,40,26,0)');
    ctx.fillStyle = grad; ctx.fillRect(0, 0, w, h);
  }

  drawGround(ctx, x, y, sx, sy, ts) {
    const c = MAP[y][x];
    const n = hash(x, y);
    if (c === 'W') { this.drawWater(ctx, sx, sy, ts, x, y); return; }
    if (c === '#') { this.drawPath(ctx, sx, sy, ts, x, y); return; }
    if (c === '=') { this.drawStone(ctx, sx, sy, ts, x, y); return; }

    // grass base
    const shades = ['#63aa68', '#5fa564', '#68b06d', '#5ba260'];
    ctx.fillStyle = shades[Math.floor(n * shades.length)];
    ctx.fillRect(sx, sy, ts + 1, ts + 1);

    // subtle patch
    if (n > .55) {
      ctx.fillStyle = 'rgba(122, 194, 120, .18)';
      ctx.beginPath();
      ctx.ellipse(sx + ts * (.3 + n * .3), sy + ts * (.4 + n * .2), ts * .38, ts * .22, n * 3, 0, 6.3);
      ctx.fill();
    }

    // grass blades
    ctx.strokeStyle = 'rgba(43, 112, 60, .38)';
    ctx.lineWidth = Math.max(1, ts * .022);
    ctx.lineCap = 'round';
    const blades = 2 + Math.floor(hash(x, y, 3) * 3);
    for (let i = 0; i < blades; i++) {
      const bx = sx + hash(x, y, i + 4) * ts;
      const by = sy + ts * (.45 + hash(x, y, i + 9) * .52);
      const len = ts * (.1 + hash(x, y, i + 14) * .1);
      const lean = (hash(x, y, i + 20) - .5) * ts * .16;
      ctx.beginPath();
      ctx.moveTo(bx, by);
      ctx.quadraticCurveTo(bx + lean * .4, by - len * .6, bx + lean, by - len);
      ctx.stroke();
    }

    if (c === 'H') {
      this.drawTallGrassBase(ctx, sx, sy, ts, x, y);
    } else if (c === ',') {
      this.drawFlowers(ctx, sx, sy, ts, x, y);
    }
  }

  drawFlowers(ctx, sx, sy, ts, x, y) {
    const palette = ['#ffe6f0', '#ffd166', '#ffb3c8', '#e6e0ff', '#fff8d8'];
    const count = 2 + Math.floor(hash(x, y, 2) * 3);
    for (let i = 0; i < count; i++) {
      const fx = sx + ts * (.16 + hash(x, y, i + 31) * .68);
      const fy = sy + ts * (.2 + hash(x, y, i + 41) * .62);
      const col = palette[Math.floor(hash(x, y, i + 51) * palette.length)];
      const r = ts * .045;
      ctx.fillStyle = 'rgba(40, 100, 58, .35)';
      ctx.fillRect(fx - .7, fy, 1.4, ts * .09);
      ctx.fillStyle = col;
      for (let k = 0; k < 5; k++) {
        const a = k / 5 * 6.283 + hash(x, y, i) * 3;
        ctx.beginPath();
        ctx.arc(fx + Math.cos(a) * r * 1.35, fy + Math.sin(a) * r * 1.35, r, 0, 6.3);
        ctx.fill();
      }
      ctx.fillStyle = '#ffd166';
      ctx.beginPath(); ctx.arc(fx, fy, r * .7, 0, 6.3); ctx.fill();
    }
  }

  drawTallGrassBase(ctx, sx, sy, ts, x, y) {
    ctx.fillStyle = 'rgba(30, 94, 50, .34)';
    ctx.beginPath();
    ctx.ellipse(sx + ts * .5, sy + ts * .7, ts * .52, ts * .34, 0, 0, 6.3);
    ctx.fill();
    ctx.strokeStyle = '#2f7d4b';
    ctx.lineWidth = Math.max(1.4, ts * .035);
    ctx.lineCap = 'round';
    for (let i = 0; i < 5; i++) {
      const bx = sx + ts * (.12 + i * .19 + hash(x, y, i) * .05);
      const by = sy + ts * (.94 - hash(x, y, i + 6) * .08);
      const len = ts * (.36 + hash(x, y, i + 11) * .18);
      const sway = Math.sin(this.time * 2.2 + x * .7 + y * .5 + i) * ts * .06;
      ctx.beginPath();
      ctx.moveTo(bx, by);
      ctx.quadraticCurveTo(bx + sway * .5, by - len * .55, bx + sway, by - len);
      ctx.stroke();
      ctx.strokeStyle = i % 2 ? '#3b9157' : '#2f7d4b';
    }
  }

  drawGrassOverlay(ctx, sx, sy, ts, x, y, opacity = 1) {
    ctx.save();
    ctx.globalAlpha = opacity;
    ctx.strokeStyle = '#255f3a';
    ctx.lineWidth = Math.max(1.6, ts * .038);
    ctx.lineCap = 'round';
    for (let i = 0; i < 6; i++) {
      const bx = sx + ts * (.08 + i * .17 + hash(x, y, i + 70) * .06);
      const by = sy + ts * .98;
      const len = ts * (.4 + hash(x, y, i + 80) * .2);
      const sway = Math.sin(this.time * 2.4 + i * 1.3 + x) * ts * .07;
      ctx.beginPath();
      ctx.moveTo(bx, by);
      ctx.quadraticCurveTo(bx + sway * .5, by - len * .6, bx + sway, by - len);
      ctx.stroke();
    }
    ctx.restore();
  }

  drawPath(ctx, sx, sy, ts, x, y) {
    ctx.fillStyle = '#d9c48f';
    ctx.fillRect(sx, sy, ts + 1, ts + 1);
    ctx.fillStyle = 'rgba(255, 248, 214, .18)';
    ctx.fillRect(sx, sy, ts + 1, ts * .5);
    // pebbles
    for (let i = 0; i < 3; i++) {
      const px = sx + ts * (.14 + hash(x, y, i + 4) * .7);
      const py = sy + ts * (.15 + hash(x, y, i + 9) * .7);
      ctx.fillStyle = 'rgba(150, 128, 82, .3)';
      ctx.beginPath(); ctx.ellipse(px, py, ts * .04, ts * .025, hash(x, y, i) * 3, 0, 6.3); ctx.fill();
    }
    // edges against non-path
    ctx.strokeStyle = 'rgba(126, 107, 64, .38)';
    ctx.lineWidth = Math.max(1.5, ts * .03);
    const N = (dx, dy) => {
      const c = (MAP[y + dy] && MAP[y + dy][x + dx]) || 'T';
      return c !== '#' && c !== '=';
    };
    ctx.beginPath();
    if (N(0, -1)) { ctx.moveTo(sx, sy + 1); ctx.lineTo(sx + ts, sy + 1); }
    if (N(0, 1)) { ctx.moveTo(sx, sy + ts - 1); ctx.lineTo(sx + ts, sy + ts - 1); }
    if (N(-1, 0)) { ctx.moveTo(sx + 1, sy); ctx.lineTo(sx + 1, sy + ts); }
    if (N(1, 0)) { ctx.moveTo(sx + ts - 1, sy); ctx.lineTo(sx + ts - 1, sy + ts); }
    ctx.stroke();
    // occasional tuft
    if (hash(x, y, 5) > .8) {
      ctx.strokeStyle = 'rgba(60, 130, 72, .5)';
      ctx.beginPath();
      ctx.moveTo(sx + ts * .8, sy + ts * .88);
      ctx.quadraticCurveTo(sx + ts * .82, sy + ts * .72, sx + ts * .88, sy + ts * .68);
      ctx.stroke();
    }
  }

  drawStone(ctx, sx, sy, ts, x, y) {
    const v = hash(x, y);
    ctx.fillStyle = v > .5 ? '#b9c3ac' : '#b1bca4';
    ctx.fillRect(sx, sy, ts + 1, ts + 1);
    ctx.strokeStyle = 'rgba(90, 105, 82, .32)';
    ctx.lineWidth = Math.max(1, ts * .02);
    ctx.strokeRect(sx + 2, sy + 2, ts - 4, ts - 4);
    if (hash(x, y, 7) > .65) {
      ctx.strokeStyle = 'rgba(90, 105, 82, .2)';
      ctx.beginPath();
      ctx.moveTo(sx + ts * .2, sy + ts * .5);
      ctx.lineTo(sx + ts * .5, sy + ts * .3);
      ctx.lineTo(sx + ts * .8, sy + ts * .55);
      ctx.stroke();
    }
  }

  drawWater(ctx, sx, sy, ts, x, y) {
    const grad = ctx.createLinearGradient(sx, sy, sx, sy + ts);
    grad.addColorStop(0, '#58b6d6');
    grad.addColorStop(1, '#3d8fbe');
    ctx.fillStyle = grad;
    ctx.fillRect(sx, sy, ts + 1, ts + 1);
    // animated waves
    ctx.strokeStyle = 'rgba(220, 252, 255, .4)';
    ctx.lineWidth = Math.max(1, ts * .025);
    const off = Math.sin(this.time * 1.2 + x * .8 + y * .6) * ts * .08;
    ctx.beginPath();
    ctx.moveTo(sx + ts * .1, sy + ts * .3 + off);
    ctx.quadraticCurveTo(sx + ts * .35, sy + ts * .21 + off, sx + ts * .58, sy + ts * .32 + off);
    ctx.quadraticCurveTo(sx + ts * .76, sy + ts * .4 + off, sx + ts * .92, sy + ts * .3 + off);
    ctx.stroke();
    ctx.strokeStyle = 'rgba(220, 252, 255, .22)';
    ctx.beginPath();
    ctx.moveTo(sx + ts * .2, sy + ts * .72 - off);
    ctx.quadraticCurveTo(sx + ts * .45, sy + ts * .64 - off, sx + ts * .7, sy + ts * .74 - off);
    ctx.stroke();
    // shoreline
    ctx.strokeStyle = 'rgba(240, 226, 170, .55)';
    ctx.lineWidth = Math.max(2, ts * .045);
    const isLand = (dx, dy) => {
      const c = (MAP[y + dy] && MAP[y + dy][x + dx]) || 'W';
      return c !== 'W';
    };
    ctx.beginPath();
    if (isLand(0, -1)) { ctx.moveTo(sx, sy + 2); ctx.lineTo(sx + ts, sy + 2); }
    if (isLand(0, 1)) { ctx.moveTo(sx, sy + ts - 2); ctx.lineTo(sx + ts, sy + ts - 2); }
    if (isLand(-1, 0)) { ctx.moveTo(sx + 2, sy); ctx.lineTo(sx + 2, sy + ts); }
    if (isLand(1, 0)) { ctx.moveTo(sx + ts - 2, sy); ctx.lineTo(sx + ts - 2, sy + ts); }
    ctx.stroke();
    // lily pad
    if (hash(x, y, 3) > .9) {
      const lx = sx + ts * (.3 + hash(x, y, 5) * .4), ly = sy + ts * .55;
      ctx.fillStyle = '#5faa6c';
      ctx.beginPath(); ctx.ellipse(lx, ly, ts * .11, ts * .07, .3, 0, 6.3); ctx.fill();
      ctx.fillStyle = '#ffd1e0';
      ctx.beginPath(); ctx.arc(lx + ts * .02, ly - ts * .01, ts * .025, 0, 6.3); ctx.fill();
    }
  }

  drawTree(ctx, sx, sy, ts, x, y) {
    const n = hash(x, y, 5);
    const cx = sx + ts * .5 + (n - .5) * ts * .1;
    const base = sy + ts * .92;
    const scale = .92 + n * .16;
    ctx.save();
    // shadow
    ctx.fillStyle = 'rgba(20, 58, 34, .22)';
    ctx.beginPath();
    ctx.ellipse(cx + ts * .05, base + ts * .02, ts * .34 * scale, ts * .12 * scale, 0, 0, 6.3);
    ctx.fill();
    // trunk
    ctx.fillStyle = '#7b5539';
    ctx.beginPath();
    ctx.moveTo(cx - ts * .06, base);
    ctx.quadraticCurveTo(cx - ts * .04, base - ts * .3, cx - ts * .03, base - ts * .45);
    ctx.lineTo(cx + ts * .03, base - ts * .45);
    ctx.quadraticCurveTo(cx + ts * .04, base - ts * .3, cx + ts * .06, base);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = 'rgba(50, 70, 40, .22)';
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(cx - ts * .015, base - ts * .05); ctx.lineTo(cx - ts * .01, base - ts * .4); ctx.stroke();
    // canopy — layered blobs
    const sway = Math.sin(this.time * 1.1 + x * .5 + y) * ts * .015;
    const cy = base - ts * .72;
    const r = ts * .42 * scale;
    const blobs = [
      [cx + sway, cy, r, '#2f7d4b'],
      [cx - r * .52 + sway, cy + r * .2, r * .68, '#358a53'],
      [cx + r * .55 + sway, cy + r * .16, r * .62, '#2b7447'],
      [cx - r * .2 + sway, cy - r * .46, r * .6, '#439c5e'],
      [cx + r * .22 + sway, cy - r * .5, r * .52, '#4aa866'],
    ];
    for (const [bx, by, br, col] of blobs) {
      ctx.fillStyle = col;
      ctx.beginPath(); ctx.arc(bx, by, br, 0, 6.3); ctx.fill();
    }
    // highlights
    ctx.fillStyle = 'rgba(163, 229, 150, .36)';
    ctx.beginPath(); ctx.ellipse(cx - r * .25 + sway, cy - r * .45, r * .32, r * .2, -.6, 0, 6.3); ctx.fill();
    if (n > .86) {
      ctx.fillStyle = 'rgba(255, 194, 214, .8)';
      for (let i = 0; i < 4; i++) {
        ctx.beginPath();
        ctx.arc(cx + Math.cos(i * 1.7) * r * .55 + sway, cy + Math.sin(i * 1.7) * r * .4, ts * .022, 0, 6.3);
        ctx.fill();
      }
    }
    ctx.restore();
  }

  drawRock(ctx, sx, sy, ts, x, y) {
    const n = hash(x, y, 2);
    ctx.fillStyle = 'rgba(20, 58, 34, .2)';
    ctx.beginPath(); ctx.ellipse(sx + ts * .5, sy + ts * .72, ts * .3, ts * .11, 0, 0, 6.3); ctx.fill();
    ctx.fillStyle = n > .5 ? '#9aa39a' : '#8d968e';
    ctx.beginPath();
    ctx.ellipse(sx + ts * .5, sy + ts * .55, ts * .28, ts * .22, n * .4, 0, 6.3);
    ctx.fill();
    ctx.fillStyle = 'rgba(230, 238, 226, .34)';
    ctx.beginPath();
    ctx.ellipse(sx + ts * .42, sy + ts * .46, ts * .13, ts * .075, -.4, 0, 6.3);
    ctx.fill();
    ctx.fillStyle = 'rgba(60, 80, 62, .3)';
    ctx.beginPath(); ctx.arc(sx + ts * .6, sy + ts * .62, ts * .025, 0, 6.3); ctx.fill();
  }

  /* ───────────────── buildings ───────────────── */

  drawBuilding(ctx, b, ox, oy, ts) {
    const bx = ox + b.x * ts;
    const bw = b.w * ts;
    const baseY = oy + (b.y + b.h) * ts;
    const wallH = Math.min(b.h * ts * .92, ts * 2.25);
    const roofH = ts * (b.kind === 'shop' ? .78 : 1.02);
    const wallTop = baseY - wallH;
    const roofTop = wallTop - roofH;
    const doorW = ts * .52;
    const doorH = ts * .92;
    const doorX = bx + bw / 2 - doorW / 2;
    const doorY = baseY - doorH;

    ctx.save();
    // ground shadow
    ctx.fillStyle = 'rgba(18, 52, 31, .24)';
    ctx.beginPath();
    ctx.ellipse(bx + bw / 2, baseY + ts * .04, bw * .52, ts * .16, 0, 0, 6.3);
    ctx.fill();

    // wall
    ctx.fillStyle = b.wall || '#f4e5c8';
    ctx.strokeStyle = 'rgba(92, 70, 47, .35)';
    ctx.lineWidth = Math.max(1.5, ts * .03);
    roundRect(ctx, bx + ts * .06, wallTop, bw - ts * .12, wallH, ts * .08);
    ctx.fill(); ctx.stroke();

    // wall texture
    ctx.strokeStyle = 'rgba(150, 118, 76, .13)';
    ctx.lineWidth = 1;
    for (let i = 0; i < 3; i++) {
      const yy = wallTop + wallH * (.3 + i * .2);
      ctx.beginPath(); ctx.moveTo(bx + ts * .12, yy); ctx.lineTo(bx + bw - ts * .12, yy); ctx.stroke();
    }

    // beams
    ctx.fillStyle = 'rgba(120, 86, 54, .32)';
    ctx.fillRect(bx + ts * .08, wallTop, ts * .06, wallH);
    ctx.fillRect(bx + bw - ts * .14, wallTop, ts * .06, wallH);

    // roof
    const roofColor = b.roof || '#c86858';
    ctx.fillStyle = roofColor;
    ctx.strokeStyle = 'rgba(60, 40, 30, .25)';
    ctx.lineWidth = Math.max(1.5, ts * .03);
    ctx.beginPath();
    ctx.moveTo(bx - ts * .08, wallTop + 2);
    ctx.quadraticCurveTo(bx + bw * .18, roofTop + roofH * .1, bx + bw * .5, roofTop);
    ctx.quadraticCurveTo(bx + bw * .82, roofTop + roofH * .1, bx + bw + ts * .08, wallTop + 2);
    ctx.lineTo(bx + bw + ts * .04, wallTop + ts * .14);
    ctx.quadraticCurveTo(bx + bw * .8, roofTop + roofH * .28, bx + bw * .5, roofTop + roofH * .30);
    ctx.quadraticCurveTo(bx + bw * .2, roofTop + roofH * .28, bx - ts * .04, wallTop + ts * .14);
    ctx.closePath();
    ctx.fill(); ctx.stroke();

    // shingles / roof highlights
    ctx.strokeStyle = 'rgba(255, 255, 255, .18)';
    ctx.lineWidth = 1;
    for (let i = 1; i < 4; i++) {
      const yy = wallTop - roofH * (i / 5);
      ctx.beginPath();
      ctx.moveTo(bx + bw * (.08 + i * .04), yy);
      ctx.quadraticCurveTo(bx + bw * .5, yy - roofH * .12, bx + bw * (.92 - i * .04), yy);
      ctx.stroke();
    }
    ctx.fillStyle = 'rgba(255, 255, 255, .25)';
    ctx.beginPath();
    ctx.ellipse(bx + bw * .32, roofTop + roofH * .28, bw * .18, ts * .06, -.2, 0, 6.3);
    ctx.fill();

    if (b.kind === 'cottage' || b.kind === 'inn' || b.kind === 'cabin') {
      // chimney
      ctx.fillStyle = '#9d8272';
      ctx.fillRect(bx + bw * .73, roofTop + roofH * .18, ts * .17, ts * .28);
      ctx.fillStyle = '#c7b3a0';
      ctx.fillRect(bx + bw * .73, roofTop + roofH * .18, ts * .17, ts * .06);
      // smoke
      ctx.fillStyle = 'rgba(255,255,255,.35)';
      for (let i = 0; i < 3; i++) {
        const sy = roofTop - i * ts * .17 + Math.sin(this.time * 1.2 + i) * ts * .02;
        ctx.beginPath();
        ctx.arc(bx + bw * .815 + i * ts * .04, sy, ts * (.04 + i * .012), 0, 6.3);
        ctx.fill();
      }
    }

    if (b.kind === 'shop') {
      // striped awning
      const ay = wallTop + ts * .16;
      const ay2 = wallTop + ts * .48;
      ctx.save();
      ctx.beginPath(); ctx.rect(bx + ts * .04, ay, bw - ts * .08, ay2 - ay); ctx.clip();
      for (let i = 0; i < 7; i++) {
        ctx.fillStyle = i % 2 ? '#fff2d0' : '#e5895b';
        const sw = (bw - ts * .08) / 7;
        ctx.fillRect(bx + ts * .04 + i * sw, ay, sw + 1, ay2 - ay);
      }
      ctx.restore();
      ctx.beginPath();
      ctx.moveTo(bx + ts * .02, ay2);
      for (let i = 0; i < 7; i++) {
        const sw = (bw - ts * .04) / 7;
        const xx = bx + ts * .02 + i * sw;
        ctx.quadraticCurveTo(xx + sw * .5, ay2 + ts * .13, xx + sw, ay2);
      }
      ctx.closePath();
      ctx.fillStyle = 'rgba(229, 137, 91, .55)';
      ctx.fill();
    }

    if (b.kind === 'hall') {
      // clock / emblem
      ctx.fillStyle = '#ffe9a8';
      ctx.beginPath(); ctx.arc(bx + bw / 2, wallTop + wallH * .18, ts * .18, 0, 6.3); ctx.fill();
      ctx.strokeStyle = '#7d6bb0'; ctx.lineWidth = Math.max(1.4, ts * .03);
      ctx.beginPath(); ctx.arc(bx + bw / 2, wallTop + wallH * .18, ts * .18, 0, 6.3); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(bx + bw / 2, wallTop + wallH * .18); ctx.lineTo(bx + bw / 2, wallTop + wallH * .18 - ts * .1); ctx.moveTo(bx + bw / 2, wallTop + wallH * .18); ctx.lineTo(bx + bw / 2 + ts * .07, wallTop + wallH * .18 + ts * .03); ctx.stroke();
    }

    if (b.kind === 'shrine') {
      // second tier
      const t2 = roofTop - roofH * .32;
      ctx.fillStyle = '#4f8464';
      ctx.beginPath();
      ctx.moveTo(bx - ts * .22, roofTop + roofH * .18);
      ctx.quadraticCurveTo(bx + bw * .5, t2 - ts * .2, bx + bw + ts * .22, roofTop + roofH * .18);
      ctx.lineTo(bx + bw + ts * .12, roofTop + roofH * .34);
      ctx.quadraticCurveTo(bx + bw * .5, t2 + ts * .12, bx - ts * .12, roofTop + roofH * .34);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#f0d883'; ctx.lineWidth = Math.max(1.5, ts * .028); ctx.stroke();
      // lanterns
      for (const side of [-1, 1]) {
        const lx = bx + bw / 2 + side * (bw * .34);
        const ly = wallTop + ts * .2;
        ctx.fillStyle = '#ffdf8a';
        ctx.beginPath(); ctx.arc(lx, ly, ts * .075, 0, 6.3); ctx.fill();
        ctx.strokeStyle = '#7d6b43'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(lx, ly - ts * .1); ctx.lineTo(lx, ly - ts * .18); ctx.stroke();
        ctx.fillStyle = 'rgba(255, 223, 138, .28)';
        ctx.beginPath(); ctx.arc(lx, ly, ts * .15, 0, 6.3); ctx.fill();
      }
      // hanging banner
      ctx.fillStyle = '#d45d86';
      ctx.fillRect(bx + bw * .5 - ts * .12, wallTop + ts * .34, ts * .24, ts * .38);
      ctx.fillStyle = '#ffe9a8';
      ctx.beginPath(); ctx.arc(bx + bw * .5, wallTop + ts * .52, ts * .045, 0, 6.3); ctx.fill();
    }

    // windows
    const winY = wallTop + wallH * .34;
    const winW = ts * .34, winH = ts * .3;
    const winXs = b.kind === 'shop' ? [bx + bw * .2, bx + bw * .62] : [bx + bw * .22, bx + bw * .64];
    for (const wx of winXs) {
      const wy = b.kind === 'shop' ? wallTop + wallH * .58 : winY;
      ctx.fillStyle = '#5b87a0';
      roundRect(ctx, wx, wy, winW, winH, ts * .04);
      ctx.fill();
      ctx.strokeStyle = 'rgba(255, 248, 218, .8)'; ctx.lineWidth = Math.max(1.2, ts * .024); ctx.stroke();
      ctx.fillStyle = 'rgba(255, 244, 186, .55)';
      ctx.fillRect(wx + winW * .1, wy + winH * .12, winW * .32, winH * .3);
      ctx.strokeStyle = 'rgba(255, 248, 218, .7)'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(wx + winW / 2, wy); ctx.lineTo(wx + winW / 2, wy + winH); ctx.moveTo(wx, wy + winH / 2); ctx.lineTo(wx + winW, wy + winH / 2); ctx.stroke();
    }

    // door
    ctx.fillStyle = '#7a5537';
    roundRect(ctx, doorX, doorY, doorW, doorH, ts * .06);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 238, 200, .28)'; ctx.lineWidth = 1.4; ctx.stroke();
    ctx.fillStyle = 'rgba(255, 238, 200, .22)';
    ctx.fillRect(doorX + doorW * .16, doorY + doorH * .12, doorW * .68, doorH * .28);
    ctx.fillStyle = '#ffd166';
    ctx.beginPath(); ctx.arc(doorX + doorW * .8, doorY + doorH * .58, ts * .035, 0, 6.3); ctx.fill();
    // step
    ctx.fillStyle = 'rgba(180, 160, 120, .8)';
    ctx.fillRect(doorX - ts * .08, baseY - ts * .03, doorW + ts * .16, ts * .06);

    // flower boxes
    if (b.kind !== 'shrine') {
      ctx.fillStyle = '#8a5f3f';
      ctx.fillRect(bx + bw * .14, winY + winH + ts * .02, winW, ts * .06);
      const cols = ['#ff9ab8', '#ffd166', '#ffb3d1'];
      for (let i = 0; i < 4; i++) {
        ctx.fillStyle = cols[i % cols.length];
        ctx.beginPath();
        ctx.arc(bx + bw * .14 + winW * (.15 + i * .23), winY + winH + ts * .005, ts * .026, 0, 6.3);
        ctx.fill();
      }
    }

    // name plaque for shop/hall
    if (b.kind === 'shop' || b.kind === 'hall') {
      ctx.fillStyle = 'rgba(255, 249, 227, .88)';
      roundRect(ctx, bx + bw * .5 - ts * .52, wallTop + wallH * .08, ts * 1.04, ts * .17, ts * .05);
      ctx.fill();
      ctx.fillStyle = '#7a5537';
      ctx.font = `700 ${Math.max(6, ts * .11)}px "Trebuchet MS", sans-serif`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(b.name.replace('Lumen Hall', 'LUMEN HALL').replace("Pip's Petals", "PIP'S"), bx + bw * .5, wallTop + wallH * .16);
    }
    ctx.restore();
  }

  /* ───────────────── props ───────────────── */

  drawProp(ctx, p, ox, oy, ts) {
    const cx = ox + p.x * ts + ts / 2;
    const cy = oy + p.y * ts + ts / 2;
    if (p.kind === 'fountain') return this.drawFountain(ctx, cx, cy, ts);
    if (p.kind === 'moonwell') return this.drawMoonwell(ctx, cx, cy, ts);
    if (p.kind === 'gate') return this.drawGate(ctx, p, ox, oy, ts);
    if (p.kind === 'altar') return this.drawAltar(ctx, cx, cy, ts);
  }

  drawFountain(ctx, cx, cy, ts) {
    const r = ts * .52;
    ctx.save();
    ctx.fillStyle = 'rgba(18, 52, 31, .22)';
    ctx.beginPath(); ctx.ellipse(cx, cy + ts * .26, r * 1.05, ts * .12, 0, 0, 6.3); ctx.fill();
    // base
    ctx.fillStyle = '#aab5a5';
    ctx.beginPath(); ctx.ellipse(cx, cy + ts * .2, r, r * .46, 0, 0, 6.3); ctx.fill();
    ctx.fillStyle = '#c4cdbb';
    ctx.beginPath(); ctx.ellipse(cx, cy + ts * .13, r, r * .45, 0, 0, 6.3); ctx.fill();
    // water
    const waterGrad = ctx.createRadialGradient(cx - r * .2, cy, r * .1, cx, cy, r);
    waterGrad.addColorStop(0, '#a9f0e8');
    waterGrad.addColorStop(.7, '#59c3cf');
    waterGrad.addColorStop(1, '#338fa9');
    ctx.fillStyle = waterGrad;
    ctx.beginPath(); ctx.ellipse(cx, cy + ts * .1, r * .8, r * .32, 0, 0, 6.3); ctx.fill();
    // ripples
    ctx.strokeStyle = 'rgba(255,255,255,.45)'; ctx.lineWidth = 1.2;
    for (let i = 0; i < 2; i++) {
      const ph = (this.time * .5 + i * .5) % 1;
      ctx.globalAlpha = 1 - ph;
      ctx.beginPath(); ctx.ellipse(cx, cy + ts * .1, r * .2 + r * .55 * ph, (r * .08 + r * .22 * ph), 0, 0, 6.3); ctx.stroke();
    }
    ctx.globalAlpha = 1;
    // center statue
    ctx.fillStyle = '#8e9b8d';
    ctx.fillRect(cx - ts * .035, cy - ts * .3, ts * .07, ts * .42);
    ctx.fillStyle = '#b8c6b4';
    ctx.beginPath(); ctx.arc(cx, cy - ts * .34, ts * .09, 0, 6.3); ctx.fill();
    // little bloom
    ctx.fillStyle = '#ffc2d4';
    for (let i = 0; i < 5; i++) {
      ctx.beginPath(); ctx.arc(cx + Math.cos(i * 1.256) * ts * .07, cy - ts * .34 + Math.sin(i * 1.256) * ts * .07, ts * .035, 0, 6.3); ctx.fill();
    }
    ctx.fillStyle = '#ffd166'; ctx.beginPath(); ctx.arc(cx, cy - ts * .34, ts * .032, 0, 6.3); ctx.fill();
    // sparkle
    ctx.fillStyle = 'rgba(255, 247, 190, .9)';
    const sp = Math.sin(this.time * 2) * .5 + .5;
    ctx.beginPath(); ctx.arc(cx + r * .5, cy - ts * .02, 1.5 + sp * 1.5, 0, 6.3); ctx.fill();
    ctx.restore();
  }

  drawMoonwell(ctx, cx, cy, ts) {
    const r = ts * .5;
    ctx.save();
    ctx.fillStyle = 'rgba(12, 36, 28, .3)';
    ctx.beginPath(); ctx.ellipse(cx, cy + ts * .24, r * 1.08, ts * .13, 0, 0, 6.3); ctx.fill();
    ctx.fillStyle = '#7f9285';
    ctx.beginPath(); ctx.ellipse(cx, cy + ts * .16, r, r * .5, 0, 0, 6.3); ctx.fill();
    ctx.fillStyle = '#9db4a1';
    ctx.beginPath(); ctx.ellipse(cx, cy + ts * .08, r * .92, r * .44, 0, 0, 6.3); ctx.fill();
    const g = ctx.createRadialGradient(cx, cy + ts * .03, 2, cx, cy + ts * .03, r * .8);
    g.addColorStop(0, '#d8fbff'); g.addColorStop(.45, '#7adbe8'); g.addColorStop(1, '#2e7e9f');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.ellipse(cx, cy + ts * .03, r * .74, r * .31, 0, 0, 6.3); ctx.fill();
    // moon reflection
    ctx.fillStyle = 'rgba(255, 249, 216, .8)';
    ctx.beginPath(); ctx.arc(cx + Math.sin(this.time * .5) * ts * .06, cy + ts * .02, ts * .09, 0, 6.3); ctx.fill();
    ctx.fillStyle = 'rgba(46,126,159,.55)';
    ctx.beginPath(); ctx.arc(cx + Math.sin(this.time * .5) * ts * .06 + ts * .035, cy + ts * .005, ts * .07, 0, 6.3); ctx.fill();
    // runes
    ctx.strokeStyle = 'rgba(230, 255, 255, .4)'; ctx.lineWidth = 1;
    for (let i = 0; i < 3; i++) {
      const a = this.time * .4 + i * 2.1;
      ctx.beginPath(); ctx.arc(cx + Math.cos(a) * r * .85, cy + ts * .12 + Math.sin(a) * r * .35, 1.6, 0, 6.3); ctx.stroke();
    }
    // stone posts
    for (const side of [-1, 1]) {
      ctx.fillStyle = '#7b8d7f';
      ctx.fillRect(cx + side * r * .9 - ts * .045, cy - ts * .18, ts * .09, ts * .34);
      ctx.fillStyle = '#a4b6a6';
      ctx.fillRect(cx + side * r * .9 - ts * .05, cy - ts * .21, ts * .1, ts * .06);
    }
    ctx.restore();
  }

  drawGate(ctx, p, ox, oy, ts) {
    const cx = ox + p.x * ts + ts / 2;
    const by = oy + p.y * ts + ts * .92;
    const open = this.state.flags.gateOpened;
    ctx.save();
    ctx.fillStyle = 'rgba(18, 52, 31, .25)';
    ctx.beginPath(); ctx.ellipse(cx, by, ts * .8, ts * .16, 0, 0, 6.3); ctx.fill();
    // pillars
    for (const side of [-1, 1]) {
      const px = cx + side * ts * .46;
      ctx.fillStyle = '#8e9c8a';
      roundRect(ctx, px - ts * .1, by - ts * 1.45, ts * .2, ts * 1.42, ts * .04);
      ctx.fill();
      ctx.fillStyle = '#b6c4b0';
      ctx.fillRect(px - ts * .13, by - ts * 1.55, ts * .26, ts * .13);
      ctx.fillStyle = '#6f7f6d';
      ctx.fillRect(px - ts * .12, by - ts * .08, ts * .24, ts * .1);
      ctx.fillStyle = 'rgba(255, 233, 168, .8)';
      ctx.beginPath(); ctx.arc(px, by - ts * 1.16, ts * .035, 0, 6.3); ctx.fill();
    }
    // arch
    ctx.strokeStyle = '#8e9c8a';
    ctx.lineWidth = ts * .11;
    ctx.beginPath(); ctx.arc(cx, by - ts * 1.42, ts * .55, Math.PI, 0); ctx.stroke();
    ctx.strokeStyle = '#b6c4b0';
    ctx.lineWidth = ts * .035;
    ctx.beginPath(); ctx.arc(cx, by - ts * 1.46, ts * .56, Math.PI, 0); ctx.stroke();
    // seal sockets
    const n = this.game.sealCount();
    for (let i = 0; i < 3; i++) {
      const sx = cx + (i - 1) * ts * .24;
      ctx.fillStyle = i < n ? '#ffd166' : 'rgba(255,255,255,.18)';
      ctx.beginPath(); ctx.arc(sx, by - ts * 1.52, ts * .045, 0, 6.3); ctx.fill();
      if (i < n) {
        ctx.fillStyle = 'rgba(255, 209, 102, .3)';
        ctx.beginPath(); ctx.arc(sx, by - ts * 1.52, ts * .09, 0, 6.3); ctx.fill();
      }
    }
    if (!open) {
      // shimmer barrier
      const gl = ctx.createLinearGradient(cx, by - ts * 1.4, cx, by);
      gl.addColorStop(0, 'rgba(160, 240, 220, .05)');
      gl.addColorStop(.5, 'rgba(160, 240, 220, .22)');
      gl.addColorStop(1, 'rgba(160, 240, 220, .06)');
      ctx.fillStyle = gl;
      ctx.fillRect(cx - ts * .42, by - ts * 1.4, ts * .84, ts * 1.4);
      ctx.strokeStyle = 'rgba(210, 255, 240, .45)';
      ctx.lineWidth = 1.4;
      for (let i = 0; i < 4; i++) {
        const yy = by - ts * .2 - ((this.time * 18 + i * 34) % (ts * 1.2));
        ctx.beginPath(); ctx.moveTo(cx - ts * .38, yy); ctx.lineTo(cx + ts * .38, yy - ts * .05); ctx.stroke();
      }
      ctx.fillStyle = 'rgba(10, 40, 28, .72)';
      roundRect(ctx, cx - ts * .42, by - ts * .68, ts * .84, ts * .2, ts * .05);
      ctx.fill();
      ctx.fillStyle = '#ffe9a8';
      ctx.font = `900 ${Math.max(6, ts * .095)}px "Trebuchet MS", sans-serif`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(`${n} / 3 SEALS`, cx, by - ts * .575);
    } else {
      ctx.fillStyle = 'rgba(255, 233, 168, .18)';
      ctx.beginPath(); ctx.ellipse(cx, by, ts * .6, ts * .2, 0, 0, 6.3); ctx.fill();
    }
    ctx.restore();
  }

  drawAltar(ctx, cx, cy, ts) {
    ctx.save();
    const glow = .5 + Math.sin(this.time * 1.6) * .15;
    ctx.fillStyle = `rgba(255, 226, 140, ${.16 + glow * .15})`;
    ctx.beginPath(); ctx.arc(cx, cy - ts * .3, ts * .55, 0, 6.3); ctx.fill();
    ctx.fillStyle = 'rgba(18, 52, 31, .25)';
    ctx.beginPath(); ctx.ellipse(cx, cy + ts * .3, ts * .46, ts * .12, 0, 0, 6.3); ctx.fill();
    // pedestal
    ctx.fillStyle = '#a4b09c';
    ctx.beginPath();
    ctx.moveTo(cx - ts * .25, cy + ts * .3);
    ctx.lineTo(cx - ts * .18, cy - ts * .1);
    ctx.lineTo(cx + ts * .18, cy - ts * .1);
    ctx.lineTo(cx + ts * .25, cy + ts * .3);
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#c3cdb8';
    ctx.fillRect(cx - ts * .3, cy + ts * .25, ts * .6, ts * .08);
    ctx.fillStyle = '#fff3b8';
    ctx.beginPath(); ctx.arc(cx, cy - ts * .42 + Math.sin(this.time * 1.6) * ts * .03, ts * .1, 0, 6.3); ctx.fill();
    ctx.fillStyle = '#ffb3c8';
    for (let i = 0; i < 6; i++) {
      const a = i / 6 * 6.283 + this.time * .2;
      ctx.beginPath(); ctx.arc(cx + Math.cos(a) * ts * .15, cy - ts * .42 + Math.sin(a) * ts * .15, ts * .06, 0, 6.3); ctx.fill();
    }
    ctx.fillStyle = '#ffd166';
    ctx.beginPath(); ctx.arc(cx, cy - ts * .42, ts * .075, 0, 6.3); ctx.fill();
    ctx.restore();
  }

  drawSign(ctx, s, ox, oy, ts) {
    const cx = ox + s.x * ts + ts / 2;
    const by = oy + s.y * ts + ts * .88;
    ctx.save();
    ctx.fillStyle = 'rgba(18, 52, 31, .2)';
    ctx.beginPath(); ctx.ellipse(cx, by, ts * .24, ts * .07, 0, 0, 6.3); ctx.fill();
    ctx.fillStyle = '#8a6244';
    ctx.fillRect(cx - ts * .035, by - ts * .48, ts * .07, ts * .5);
    ctx.fillStyle = '#b48558';
    roundRect(ctx, cx - ts * .27, by - ts * .82, ts * .54, ts * .38, ts * .05);
    ctx.fill();
    ctx.strokeStyle = '#7b5335'; ctx.lineWidth = 2; ctx.stroke();
    ctx.strokeStyle = 'rgba(110, 78, 50, .5)'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(cx - ts * .18, by - ts * .71); ctx.lineTo(cx + ts * .17, by - ts * .71); ctx.moveTo(cx - ts * .18, by - ts * .62); ctx.lineTo(cx + ts * .1, by - ts * .62); ctx.stroke();
    ctx.restore();
  }

  /* ───────────────── characters ───────────────── */

  drawNPC(ctx, n, ox, oy, ts) {
    const cx = ox + n.x * ts + ts / 2;
    const by = oy + n.y * ts + ts * .94;
    const done = n.trainer && this.state.flags.defeated[n.trainer];
    const bob = Math.sin(this.time * 2 + n.x) * ts * .012;
    this.drawPerson(ctx, cx, by + bob, ts * (n.trainer ? .95 : .88), {
      hair: n.hair, dress: n.dress, dir: n.dir || 'down',
      scarf: n.portrait === 'queen' ? '#ffd166' : null,
      queen: n.portrait === 'queen',
    });
    // marker
    if (n.trainer && !done) {
      const my = by - ts * 1.28 + Math.sin(this.time * 3) * 3;
      ctx.fillStyle = 'rgba(20, 50, 35, .18)';
      ctx.beginPath(); ctx.arc(cx, my, ts * .15, 0, 6.3); ctx.fill();
      ctx.fillStyle = '#ffe08a';
      ctx.beginPath(); ctx.arc(cx, my, ts * .13, 0, 6.3); ctx.fill();
      ctx.fillStyle = '#6b4511';
      ctx.font = `900 ${Math.round(ts * .18)}px "Trebuchet MS", sans-serif`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('!', cx, my + 1);
    } else if (n.shop) {
      const my = by - ts * 1.26 + Math.sin(this.time * 3 + 1) * 2;
      ctx.fillStyle = '#ffe08a';
      ctx.beginPath(); ctx.arc(cx, my, ts * .13, 0, 6.3); ctx.fill();
      ctx.fillStyle = '#6b4511';
      ctx.font = `900 ${Math.round(ts * .17)}px "Trebuchet MS", sans-serif`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('$', cx, my + 1);
    } else if (n.portrait === 'queen') {
      const my = by - ts * 1.35;
      ctx.fillStyle = '#ffe08a';
      ctx.beginPath();
      ctx.moveTo(cx - ts * .13, my + ts * .06);
      ctx.lineTo(cx - ts * .15, my - ts * .08);
      ctx.lineTo(cx - ts * .06, my - ts * .02);
      ctx.lineTo(cx, my - ts * .12);
      ctx.lineTo(cx + ts * .06, my - ts * .02);
      ctx.lineTo(cx + ts * .15, my - ts * .08);
      ctx.lineTo(cx + ts * .13, my + ts * .06);
      ctx.closePath(); ctx.fill();
    }
  }

  drawPerson(ctx, cx, by, s, opts) {
    const hair = opts.hair || '#7a5a44';
    const dress = opts.dress || '#6f8a72';
    const dir = opts.dir || 'down';
    const skin = '#f5c9a9';
    ctx.save();
    // shadow
    ctx.fillStyle = 'rgba(18, 52, 31, .24)';
    ctx.beginPath(); ctx.ellipse(cx, by, s * .32, s * .1, 0, 0, 6.3); ctx.fill();
    // legs
    ctx.fillStyle = '#5f4a3a';
    ctx.fillRect(cx - s * .13, by - s * .28, s * .1, s * .26);
    ctx.fillRect(cx + s * .03, by - s * .28, s * .1, s * .26);
    // body
    ctx.fillStyle = dress;
    ctx.beginPath();
    ctx.moveTo(cx - s * .2, by - s * .65);
    ctx.quadraticCurveTo(cx - s * .26, by - s * .4, cx - s * .23, by - s * .25);
    ctx.lineTo(cx + s * .23, by - s * .25);
    ctx.quadraticCurveTo(cx + s * .26, by - s * .4, cx + s * .2, by - s * .65);
    ctx.closePath(); ctx.fill();
    // sash
    ctx.fillStyle = 'rgba(255, 250, 220, .5)';
    ctx.fillRect(cx - s * .2, by - s * .42, s * .4, s * .07);
    // arms
    ctx.fillStyle = skin;
    ctx.beginPath(); ctx.arc(cx - s * .23, by - s * .4, s * .055, 0, 6.3); ctx.fill();
    ctx.beginPath(); ctx.arc(cx + s * .23, by - s * .4, s * .055, 0, 6.3); ctx.fill();
    // head
    ctx.fillStyle = skin;
    ctx.beginPath(); ctx.arc(cx, by - s * .86, s * .22, 0, 6.3); ctx.fill();
    // hair
    ctx.fillStyle = hair;
    ctx.beginPath();
    ctx.arc(cx, by - s * .92, s * .235, Math.PI * .95, Math.PI * 2.05);
    ctx.lineTo(cx + s * .22, by - s * .78);
    ctx.quadraticCurveTo(cx + s * .12, by - s * .88, cx, by - s * .86);
    ctx.quadraticCurveTo(cx - s * .12, by - s * .88, cx - s * .22, by - s * .78);
    ctx.closePath(); ctx.fill();
    // side locks
    ctx.beginPath(); ctx.ellipse(cx - s * .22, by - s * .82, s * .05, s * .13, 0, 0, 6.3); ctx.fill();
    ctx.beginPath(); ctx.ellipse(cx + s * .22, by - s * .82, s * .05, s * .13, 0, 0, 6.3); ctx.fill();
    // face
    if (dir !== 'up') {
      ctx.fillStyle = '#3a2a2a';
      const ex = dir === 'left' ? -.07 : dir === 'right' ? .07 : 0;
      if (dir === 'left' || dir === 'right') {
        ctx.beginPath(); ctx.arc(cx + ex * s * 1.6, by - s * .85, s * .024, 0, 6.3); ctx.fill();
      } else {
        ctx.beginPath(); ctx.arc(cx - s * .075, by - s * .85, s * .025, 0, 6.3); ctx.fill();
        ctx.beginPath(); ctx.arc(cx + s * .075, by - s * .85, s * .025, 0, 6.3); ctx.fill();
      }
      ctx.fillStyle = 'rgba(255, 147, 170, .45)';
      ctx.beginPath(); ctx.arc(cx - s * .14, by - s * .8, s * .035, 0, 6.3); ctx.fill();
      ctx.beginPath(); ctx.arc(cx + s * .14, by - s * .8, s * .035, 0, 6.3); ctx.fill();
    }
    // scarf / cape
    if (opts.scarf) {
      ctx.fillStyle = opts.scarf;
      roundRect(ctx, cx - s * .18, by - s * .68, s * .36, s * .1, s * .05);
      ctx.fill();
    }
    if (opts.queen) {
      ctx.fillStyle = 'rgba(255, 209, 102, .3)';
      ctx.beginPath();
      ctx.moveTo(cx - s * .22, by - s * .66);
      ctx.lineTo(cx - s * .38, by - s * .22);
      ctx.lineTo(cx + s * .38, by - s * .22);
      ctx.lineTo(cx + s * .22, by - s * .66);
      ctx.closePath(); ctx.fill();
    }
    ctx.restore();
  }

  drawPlayer(ctx, ox, oy, ts) {
    const cx = ox + this.vx * ts + ts / 2;
    const by = oy + this.vy * ts + ts * .94;
    const moving = this.moving;
    const bob = moving ? Math.abs(Math.sin(this.walkPhase)) * -ts * .035 : Math.sin(this.time * 2.4) * ts * .008;
    const legSwing = moving ? Math.sin(this.walkPhase) * ts * .07 : 0;
    const dir = this.dir;
    const s = ts * .92;
    ctx.save();
    // shadow
    ctx.fillStyle = 'rgba(18, 52, 31, .25)';
    ctx.beginPath(); ctx.ellipse(cx + this.bump * (dir === 'left' ? 3 : dir === 'right' ? -3 : 0), by, s * .33, s * .105, 0, 0, 6.3); ctx.fill();
    ctx.translate(cx, by + bob);
    if (this.bump > 0) ctx.translate(dir === 'left' ? -this.bump * 3 : dir === 'right' ? this.bump * 3 : 0, dir === 'up' ? -this.bump * 2 : this.bump * 2);
    // legs
    ctx.strokeStyle = '#5d4a3c';
    ctx.lineWidth = s * .1;
    ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(-s * .09, -s * .28); ctx.lineTo(-s * .09 + legSwing, -s * .03); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(s * .09, -s * .28); ctx.lineTo(s * .09 - legSwing, -s * .03); ctx.stroke();
    // boots
    ctx.fillStyle = '#43352c';
    ctx.beginPath(); ctx.ellipse(-s * .09 + legSwing, -s * .02, s * .075, s * .035, 0, 0, 6.3); ctx.fill();
    ctx.beginPath(); ctx.ellipse(s * .09 - legSwing, -s * .02, s * .075, s * .035, 0, 0, 6.3); ctx.fill();
    // backpack behind
    if (dir === 'up') {
      ctx.fillStyle = '#9a6a3f';
      roundRect(ctx, -s * .16, -s * .65, s * .32, s * .3, s * .06); ctx.fill();
      ctx.fillStyle = '#c18b58';
      roundRect(ctx, -s * .12, -s * .61, s * .24, s * .12, s * .04); ctx.fill();
    }
    // body (green tunic)
    ctx.fillStyle = '#4fae72';
    ctx.beginPath();
    ctx.moveTo(-s * .19, -s * .66);
    ctx.quadraticCurveTo(-s * .24, -s * .4, -s * .2, -s * .26);
    ctx.lineTo(s * .2, -s * .26);
    ctx.quadraticCurveTo(s * .24, -s * .4, s * .19, -s * .66);
    ctx.closePath(); ctx.fill();
    // belt
    ctx.fillStyle = '#7b5537';
    ctx.fillRect(-s * .19, -s * .44, s * .38, s * .06);
    ctx.fillStyle = '#ffd166';
    ctx.beginPath(); ctx.arc(0, -s * .41, s * .035, 0, 6.3); ctx.fill();
    // scarf
    ctx.fillStyle = '#f2a93b';
    roundRect(ctx, -s * .17, -s * .7, s * .34, s * .09, s * .04); ctx.fill();
    if (dir !== 'up') {
      ctx.beginPath();
      ctx.moveTo(s * .1, -s * .66);
      ctx.quadraticCurveTo(s * .28 + Math.sin(this.time * 4) * s * .03, -s * .55, s * .22, -s * .38);
      ctx.lineTo(s * .14, -s * .45);
      ctx.closePath(); ctx.fill();
    }
    // arms
    ctx.strokeStyle = '#f3c6a3'; ctx.lineWidth = s * .08;
    const armSwing = moving ? Math.sin(this.walkPhase + Math.PI) * s * .05 : 0;
    ctx.beginPath(); ctx.moveTo(-s * .18, -s * .61); ctx.lineTo(-s * .23, -s * .38 + armSwing); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(s * .18, -s * .61); ctx.lineTo(s * .23, -s * .38 - armSwing); ctx.stroke();
    // head
    ctx.fillStyle = '#f7ceac';
    ctx.beginPath(); ctx.arc(0, -s * .86, s * .215, 0, 6.3); ctx.fill();
    // hair
    ctx.fillStyle = '#5a4030';
    ctx.beginPath();
    ctx.arc(0, -s * .91, s * .23, Math.PI * .92, Math.PI * 2.08);
    ctx.lineTo(s * .21, -s * .78);
    ctx.quadraticCurveTo(s * .12, -s * .9, 0, -s * .88);
    ctx.quadraticCurveTo(-s * .12, -s * .9, -s * .21, -s * .78);
    ctx.closePath(); ctx.fill();
    // fringe
    ctx.beginPath();
    ctx.moveTo(-s * .2, -s * .84);
    ctx.quadraticCurveTo(-s * .1, -s * .74, 0, -s * .82);
    ctx.quadraticCurveTo(s * .1, -s * .74, s * .2, -s * .84);
    ctx.lineTo(s * .2, -s * .92);
    ctx.quadraticCurveTo(0, -s * 1.05, -s * .2, -s * .92);
    ctx.closePath(); ctx.fill();
    // hat / leaf
    ctx.fillStyle = '#7cbf5e';
    ctx.beginPath();
    ctx.ellipse(s * .12, -s * 1.04, s * .09, s * .045, -.5, 0, 6.3); ctx.fill();
    // face
    if (dir !== 'up') {
      ctx.fillStyle = '#3a2a2a';
      if (dir === 'left') {
        ctx.beginPath(); ctx.arc(-s * .11, -s * .85, s * .027, 0, 6.3); ctx.fill();
      } else if (dir === 'right') {
        ctx.beginPath(); ctx.arc(s * .11, -s * .85, s * .027, 0, 6.3); ctx.fill();
      } else {
        ctx.beginPath(); ctx.arc(-s * .08, -s * .85, s * .027, 0, 6.3); ctx.fill();
        ctx.beginPath(); ctx.arc(s * .08, -s * .85, s * .027, 0, 6.3); ctx.fill();
      }
      ctx.fillStyle = 'rgba(255, 147, 170, .45)';
      ctx.beginPath(); ctx.arc(-s * .14, -s * .79, s * .035, 0, 6.3); ctx.fill();
      ctx.beginPath(); ctx.arc(s * .14, -s * .79, s * .035, 0, 6.3); ctx.fill();
    }
    ctx.restore();
  }

  drawCompanion(ctx, ox, oy, ts) {
    const lead = this.state.party.find(c => c.hp > 0) || this.state.party[0];
    if (!lead) return;
    const sp = SPECIES[lead.species];
    const cx = ox + this.compX * ts + ts / 2;
    const by = oy + this.compY * ts + ts * .93;
    const adult = sp.stage > 1;
    const bob = Math.sin(this.time * 3 + 1) * ts * .012;
    const s = ts * (adult ? .74 : .62);
    const hair = sp.art.hairDark;
    const hairLight = sp.art.hair;
    const dress = sp.art.dressDark;
    ctx.save();
    ctx.fillStyle = 'rgba(18, 52, 31, .2)';
    ctx.beginPath(); ctx.ellipse(cx, by, s * .33, s * .1, 0, 0, 6.3); ctx.fill();
    ctx.translate(cx, by + bob);
    if (adult) {
      // long dress + slim body
      ctx.fillStyle = dress;
      ctx.beginPath();
      ctx.moveTo(-s * .16, -s * .66);
      ctx.quadraticCurveTo(-s * .13, -s * .38, -s * .24, -s * .15);
      ctx.lineTo(s * .24, -s * .15);
      ctx.quadraticCurveTo(s * .13, -s * .38, s * .16, -s * .66);
      ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#f7ceac';
      ctx.fillRect(-s * .065, -s * .15, s * .05, s * .14);
      ctx.fillRect(s * .015, -s * .15, s * .05, s * .14);
      ctx.fillStyle = sp.art.trim || '#fff4d6';
      ctx.fillRect(-s * .22, -s * .28, s * .44, s * .035);
    } else {
      ctx.fillStyle = dress;
      ctx.beginPath();
      ctx.moveTo(-s * .18, -s * .55);
      ctx.quadraticCurveTo(-s * .24, -s * .3, -s * .2, -s * .13);
      ctx.lineTo(s * .2, -s * .13);
      ctx.quadraticCurveTo(s * .24, -s * .3, s * .18, -s * .55);
      ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#f7ceac';
      ctx.fillRect(-s * .09, -s * .13, s * .06, s * .12);
      ctx.fillRect(s * .03, -s * .13, s * .06, s * .12);
    }
    // head
    ctx.fillStyle = '#f7ceac';
    ctx.beginPath(); ctx.arc(0, -s * (adult ? .75 : .69), s * (adult ? .18 : .23), 0, 6.3); ctx.fill();
    // hair
    ctx.fillStyle = hair;
    if (adult) {
      ctx.beginPath(); ctx.arc(0, -s * .79, s * .2, Math.PI * .92, Math.PI * 2.08); ctx.fill();
      ctx.fillRect(-s * .19, -s * .8, s * .07, s * .38);
      ctx.fillRect(s * .12, -s * .8, s * .07, s * .38);
    } else {
      ctx.beginPath(); ctx.arc(0, -s * .73, s * .25, Math.PI * .92, Math.PI * 2.08); ctx.fill();
      // twin tails
      ctx.beginPath(); ctx.ellipse(-s * .25, -s * .62, s * .06, s * .16, -.2, 0, 6.3); ctx.fill();
      ctx.beginPath(); ctx.ellipse(s * .25, -s * .62, s * .06, s * .16, .2, 0, 6.3); ctx.fill();
    }
    // fringe highlight
    ctx.fillStyle = hairLight;
    ctx.beginPath(); ctx.arc(-s * .05, -s * (adult ? .87 : .83), s * .09, Math.PI * .9, Math.PI * 1.8); ctx.fill();
    // eyes
    ctx.fillStyle = '#3a2a2a';
    const ey = -s * (adult ? .76 : .7);
    ctx.beginPath(); ctx.arc(-s * .065, ey, s * .026, 0, 6.3); ctx.fill();
    ctx.beginPath(); ctx.arc(s * .065, ey, s * .026, 0, 6.3); ctx.fill();
    ctx.fillStyle = 'rgba(255, 147, 170, .4)';
    ctx.beginPath(); ctx.arc(-s * .12, ey + s * .06, s * .03, 0, 6.3); ctx.fill();
    ctx.beginPath(); ctx.arc(s * .12, ey + s * .06, s * .03, 0, 6.3); ctx.fill();
    // tiny elemental sparkle
    const sc = sp.type === 'Leaf' ? '#b9f7c3' : sp.type === 'Flame' ? '#ffd08a' : sp.type === 'Water' ? '#bff0ff' : '#fff3a0';
    ctx.fillStyle = sc;
    const spx = Math.sin(this.time * 2 + 2) * s * .25;
    ctx.beginPath(); ctx.arc(spx, -s * (adult ? 1.02 : .98), s * .025, 0, 6.3); ctx.fill();
    ctx.restore();
  }

  drawAmbient(ctx, w, h) {
    ctx.save();
    for (const p of this.ambient) {
      ctx.globalAlpha = p.a;
      if (p.kind === 'petal') {
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.fillStyle = '#ffd0dc';
        ctx.beginPath();
        ctx.ellipse(0, 0, p.s, p.s * .6, 0, 0, 6.3);
        ctx.fill();
        ctx.restore();
      } else {
        ctx.fillStyle = '#fff6c9';
        ctx.beginPath(); ctx.arc(p.x, p.y, p.s * .42, 0, 6.3); ctx.fill();
      }
    }
    ctx.restore();
  }
}
