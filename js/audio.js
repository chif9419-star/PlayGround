/* ════════════════════════════════════════════════════════════════
   audio.js — tiny WebAudio score & SFX (no external assets)
   ════════════════════════════════════════════════════════════════ */

export class AudioEngine {
  constructor() {
    this.ctx = null;
    this.enabled = true;
    this.musicOn = true;
    this.mode = null;
    this.master = null;
    this.musicGain = null;
    this.sfxGain = null;
    this.timer = null;
    this.step = 0;
  }

  ensure() {
    if (!this.enabled) return null;
    if (!this.ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      this.ctx = new AC();
      this.master = this.ctx.createGain();
      this.master.gain.value = 0.9;
      this.master.connect(this.ctx.destination);
      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.value = 0.16;
      this.musicGain.connect(this.master);
      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.value = 0.3;
      this.sfxGain.connect(this.master);
    }
    if (this.ctx.state === 'suspended') this.ctx.resume();
    return this.ctx;
  }

  setEnabled(on) {
    this.enabled = on;
    if (this.master) this.master.gain.value = on ? 0.9 : 0;
    if (on) this.ensure();
  }

  toggle() {
    this.setEnabled(!this.enabled);
    return this.enabled;
  }

  note(freq, when, dur, vol, type = 'sine', dest = this.musicGain) {
    if (!this.ctx) return;
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, when);
    g.gain.setValueAtTime(0.0001, when);
    g.gain.exponentialRampToValueAtTime(vol, when + 0.04);
    g.gain.exponentialRampToValueAtTime(0.0001, when + dur);
    o.connect(g); g.connect(dest);
    o.start(when); o.stop(when + dur + 0.05);
  }

  noise(when, dur, vol, filterFreq = 900) {
    if (!this.ctx) return;
    const len = Math.floor(this.ctx.sampleRate * dur);
    const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = this.ctx.createBufferSource();
    src.buffer = buf;
    const f = this.ctx.createBiquadFilter();
    f.type = 'lowpass'; f.frequency.value = filterFreq;
    const g = this.ctx.createGain();
    g.gain.value = vol;
    src.connect(f); f.connect(g); g.connect(this.sfxGain);
    src.start(when);
  }

  setMusic(mode) {
    if (mode === this.mode) return;
    this.mode = mode;
    this.step = 0;
    if (this.timer) { clearInterval(this.timer); this.timer = null; }
    if (!mode) return;
    this.ensure();
    const tempos = { title: 640, world: 560, battle: 320, evolve: 480, ending: 600 };
    const ms = tempos[mode] || 560;
    const tick = () => {
      if (!this.ctx || !this.enabled || this.mode !== mode) return;
      this.playBar(mode);
      this.timer = setTimeout(tick, ms * 4);
    };
    tick();
  }

  playBar(mode) {
    if (!this.ctx) return;
    const t = this.ctx.currentTime + 0.02;
    const chords = {
      title: [[261.6, 329.6, 392], [246.9, 311.1, 369.9], [220, 277.2, 329.6], [196, 246.9, 293.7]],
      world: [[261.6, 329.6, 392], [293.7, 370, 440], [220, 277.2, 329.6], [246.9, 311.1, 392]],
      battle: [[220, 277.2, 329.6], [196, 246.9, 293.7], [174.6, 220, 261.6], [196, 246.9, 311.1]],
      evolve: [[261.6, 329.6, 392], [329.6, 415.3, 493.9], [349.2, 440, 523.3], [392, 493.9, 587.3]],
      ending: [[261.6, 329.6, 392], [293.7, 370, 440], [349.2, 440, 523.3], [392, 493.9, 587.3]],
    };
    const prog = chords[mode] || chords.world;
    const chord = prog[this.step % prog.length];
    const vol = mode === 'battle' ? 0.05 : 0.07;
    chord.forEach((f, i) => {
      this.note(f / (mode === 'battle' ? 2 : 1), t + i * 0.06, 1.6, vol, i === 0 ? 'triangle' : 'sine');
      this.note(f * 2, t + 1.4 + i * 0.05, 0.9, vol * 0.45, 'sine');
    });
    if (mode === 'world' || mode === 'title') {
      const melody = [523.3, 587.3, 659.3, 587.3, 523.3, 493.9, 440, 493.9];
      this.note(melody[this.step % melody.length], t + 0.7, 0.8, 0.035, 'triangle');
    }
    this.step++;
  }

  sfx(name) {
    if (!this.enabled) return;
    const ctx = this.ensure();
    if (!ctx) return;
    const t = ctx.currentTime + 0.01;
    const s = this.sfxGain;
    switch (name) {
      case 'click':
        this.note(740, t, 0.08, 0.12, 'triangle', s); break;
      case 'select':
        this.note(523, t, 0.09, 0.13, 'triangle', s);
        this.note(784, t + 0.07, 0.12, 0.12, 'triangle', s); break;
      case 'open':
        this.note(392, t, 0.12, 0.1, 'sine', s);
        this.note(587, t + 0.06, 0.16, 0.09, 'sine', s); break;
      case 'hit':
        this.noise(t, 0.18, 0.22, 1200);
        this.note(120, t, 0.22, 0.2, 'square', s); break;
      case 'super':
        this.noise(t, 0.3, 0.25, 1800);
        this.note(90, t, 0.32, 0.25, 'sawtooth', s);
        this.note(180, t + 0.06, 0.26, 0.15, 'square', s); break;
      case 'weak':
        this.noise(t, 0.12, 0.12, 500); break;
      case 'heal':
        [523, 659, 784, 1047].forEach((f, i) => this.note(f, t + i * 0.08, 0.4, 0.09, 'sine', s)); break;
      case 'catch':
        this.note(659, t, 0.12, 0.14, 'triangle', s);
        this.note(880, t + 0.12, 0.18, 0.14, 'triangle', s);
        this.note(1319, t + 0.3, 0.3, 0.12, 'sine', s); break;
      case 'fail':
        this.note(330, t, 0.15, 0.12, 'square', s);
        this.note(247, t + 0.13, 0.25, 0.12, 'square', s); break;
      case 'level':
        [523, 659, 784, 1047].forEach((f, i) => this.note(f, t + i * 0.07, 0.3, 0.13, 'triangle', s)); break;
      case 'evolve':
        [392, 523, 659, 784, 1047, 1319].forEach((f, i) => this.note(f, t + i * 0.12, 0.6, 0.1, 'sine', s));
        this.note(261.6, t, 1.8, 0.08, 'triangle', s); break;
      case 'faint':
        this.note(392, t, 0.2, 0.12, 'sine', s);
        this.note(261, t + 0.16, 0.4, 0.11, 'sine', s);
        this.note(174, t + 0.38, 0.5, 0.09, 'sine', s); break;
      case 'victory':
        [523, 659, 784, 1047, 1319].forEach((f, i) => this.note(f, t + i * 0.1, 0.5, 0.12, 'triangle', s)); break;
      case 'step':
        this.noise(t, 0.05, 0.05, 400); break;
      default:
        this.note(660, t, 0.1, 0.08, 'sine', s);
    }
  }
}

export const audio = new AudioEngine();
