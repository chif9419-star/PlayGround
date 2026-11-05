/* ════════════════════════════════════════════════════════════════
   data.js — Bloomkin, moves, map, people & quests
   ════════════════════════════════════════════════════════════════ */

export const TYPE_CHART = {
  Leaf:  { Leaf: 1,   Flame: 0.6, Water: 1.6, Spark: 0.7 },
  Flame: { Leaf: 1.6, Flame: 1,   Water: 0.6, Spark: 1   },
  Water: { Leaf: 0.6, Flame: 1.6, Water: 1,   Spark: 0.7 },
  Spark: { Leaf: 1.3, Flame: 0.75, Water: 1.6, Spark: 1 },
};

export const MOVES = {
  // leaf
  petal_dart:  { name: 'Petal Dart',  type: 'Leaf',  power: 12, desc: 'A flutter of razor petals.' },
  sprout_poke: { name: 'Sprout Poke', type: 'Leaf',  power: 8,  desc: 'A tiny, determined headbonk.' },
  leaf_twirl:  { name: 'Leaf Twirl',  type: 'Leaf',  power: 17, desc: 'A spinning dance of leaves.' },
  bloom_burst: { name: 'Bloom Burst', type: 'Leaf',  power: 26, desc: 'A glorious explosion of petals.' },
  vine_snap:   { name: 'Vine Snap',   type: 'Leaf',  power: 21, desc: 'A whip-crack of springy vines.' },
  dew_kiss:    { name: 'Dew Kiss',    type: 'Leaf',  power: 0,  heal: 0.32, desc: 'Morning dew restores health.' },
  // flame
  ember_pop:   { name: 'Ember Pop',   type: 'Flame', power: 12, desc: 'A cheerful little firecracker.' },
  warm_hug:    { name: 'Warm Hug',    type: 'Flame', power: 8,  desc: 'Cozy, but surprisingly hot.' },
  cinder_puff: { name: 'Cinder Puff', type: 'Flame', power: 17, desc: 'A puff of stinging cinders.' },
  flare_kick:  { name: 'Flare Kick',  type: 'Flame', power: 21, desc: 'A blazing spinning kick.' },
  cinder_swirl:{ name: 'Cinder Swirl',type: 'Flame', power: 26, desc: 'A cyclone of dancing sparks.' },
  soothe:      { name: 'Soothe',      type: 'Flame', power: 0,  heal: 0.34, desc: 'Warmth mends what hurts.' },
  // water
  bubble_pop:  { name: 'Bubble Pop',  type: 'Water', power: 12, desc: 'A burst of fizzy bubbles.' },
  splash_tap:  { name: 'Splash Tap',  type: 'Water', power: 8,  desc: 'A playful little splash.' },
  tide_slap:   { name: 'Tide Slap',   type: 'Water', power: 18, desc: 'A wave with a wicked backhand.' },
  aqua_bloom:  { name: 'Aqua Bloom',  type: 'Water', power: 26, desc: 'A blossoming whirlpool.' },
  moon_tide:   { name: 'Moon Tide',   type: 'Water', power: 21, desc: 'A silver swell of moonlit water.' },
  dew_drop:    { name: 'Dew Drop',    type: 'Water', power: 0,  heal: 0.33, desc: 'Cool water closes her wounds.' },
  // spark
  static_tick: { name: 'Static Tick', type: 'Spark', power: 12, desc: 'A ticklish zap.' },
  zap_dash:    { name: 'Zap Dash',    type: 'Spark', power: 20, desc: 'A crackling lightning sprint.' },
  thunder_bloom:{ name:'Thunder Bloom',type:'Spark', power: 27, desc: 'A flower of pure lightning.' },
  glimmer:     { name: 'Glimmer',     type: 'Spark', power: 0,  heal: 0.32, desc: 'A soft glow restores her.' },
};

/* ─────────────── Bloomkin species ─────────────── */

export const SPECIES = {
  nia: {
    id: 'nia', name: 'Nia', title: 'Sprout Chibi', type: 'Leaf', stage: 1, evolveLevel: 6, evolvesTo: 'sylvie',
    base: { hp: 34, atk: 11, def: 9, spd: 12 },
    moves: ['petal_dart', 'sprout_poke', 'leaf_twirl', 'dew_kiss'],
    desc: 'A pocket-sized sprout girl. She hums to seedlings and hides in flowerpots.',
    art: { skin: '#ffdcc8', skinShade: '#f2b8a2', hair: '#8fe3a0', hairLight: '#b9f7c3', hairDark: '#3a9b63', eye: '#2d8d55', eyeLight: '#8fe3a4', dress: '#9be0aa', dressDark: '#3c8f62', trim: '#fff6d6', accent: '#ffd166', accentDeep: '#d99b34', accessory: 'flower', style: 'twin', adultStyle: 'long' },
  },
  sylvie: {
    id: 'sylvie', name: 'Sylvie', title: 'Bloom Guardian', type: 'Leaf', stage: 2, evolveLevel: 99,
    base: { hp: 54, atk: 19, def: 16, spd: 18 },
    moves: ['petal_dart', 'vine_snap', 'bloom_burst', 'dew_kiss'],
    desc: 'Nia all grown up: tall, serene, and followed by a perpetual drift of petals.',
    art: { skin: '#ffdcc8', skinShade: '#f2b8a2', hair: '#a6efb4', hairLight: '#d1ffd8', hairDark: '#2f8656', eye: '#237a48', eyeLight: '#a4eeb6', dress: '#c4f2cb', dressDark: '#2f7d51', trim: '#fff8dc', accent: '#ffe08a', accentDeep: '#c9972e', accessory: 'flower', style: 'long', adultStyle: 'long' },
  },
  coco: {
    id: 'coco', name: 'Coco', title: 'Ember Chibi', type: 'Flame', stage: 1, evolveLevel: 6, evolvesTo: 'cinna',
    base: { hp: 36, atk: 12, def: 8, spd: 11 },
    moves: ['ember_pop', 'warm_hug', 'cinder_puff', 'soothe'],
    desc: 'A toasty little firecracker. Her hair smells faintly of cinnamon buns.',
    art: { skin: '#ffd6bf', skinShade: '#ecac8e', hair: '#ffb27a', hairLight: '#ffd3a8', hairDark: '#c65a2e', eye: '#e8933e', eyeLight: '#ffd08a', dress: '#ffb98b', dressDark: '#c05a35', trim: '#fff2d8', accent: '#ffd166', accentDeep: '#d9862f', accessory: 'flame', style: 'pony', adultStyle: 'long' },
  },
  cinna: {
    id: 'cinna', name: 'Cinna', title: 'Cinder Dancer', type: 'Flame', stage: 2, evolveLevel: 99,
    base: { hp: 52, atk: 21, def: 13, spd: 17 },
    moves: ['ember_pop', 'flare_kick', 'cinder_swirl', 'soothe'],
    desc: 'Coco, grown into a graceful cinder dancer whose steps leave sparks in the air.',
    art: { skin: '#ffd6bf', skinShade: '#ecac8e', hair: '#ffc18f', hairLight: '#ffe0b8', hairDark: '#b84420', eye: '#ff9b45', eyeLight: '#ffd08a', dress: '#ffcf9f', dressDark: '#b84420', trim: '#fff3dd', accent: '#ffcf66', accentDeep: '#c97a20', accessory: 'flame', style: 'pony', adultStyle: 'pony' },
  },
  miri: {
    id: 'miri', name: 'Miri', title: 'Tide Chibi', type: 'Water', stage: 1, evolveLevel: 6, evolvesTo: 'marina',
    base: { hp: 38, atk: 10, def: 11, spd: 10 },
    moves: ['bubble_pop', 'splash_tap', 'tide_slap', 'dew_drop'],
    desc: 'A bubbly tide girl who keeps sea-glass in her pockets and puddles under her feet.',
    art: { skin: '#ffd9c9', skinShade: '#efb49e', hair: '#9ddff2', hairLight: '#c8f2ff', hairDark: '#3d86bd', eye: '#3d9bd6', eyeLight: '#a8e4ff', dress: '#a8e6f6', dressDark: '#3b86ad', trim: '#f4fdff', accent: '#bff0ff', accentDeep: '#4a9cbd', accessory: 'drop', style: 'bob', adultStyle: 'long' },
  },
  marina: {
    id: 'marina', name: 'Marina', title: 'Coral Songstress', type: 'Water', stage: 2, evolveLevel: 99,
    base: { hp: 56, atk: 19, def: 18, spd: 15 },
    moves: ['bubble_pop', 'moon_tide', 'aqua_bloom', 'dew_drop'],
    desc: 'Miri, grown into a coral songstress. Her voice can calm a storm — or start one.',
    art: { skin: '#ffd9c9', skinShade: '#efb49e', hair: '#b5eafa', hairLight: '#ddfaff', hairDark: '#2c6fa8', eye: '#2c7fb8', eyeLight: '#a8e4ff', dress: '#c9f2ff', dressDark: '#2f75a3', trim: '#f4fdff', accent: '#bff0ff', accentDeep: '#3d86ad', accessory: 'drop', style: 'long', adultStyle: 'long' },
  },
  poppy: {
    id: 'poppy', name: 'Poppy', title: 'Petal Chibi', type: 'Leaf', stage: 1, evolveLevel: 9, evolvesTo: 'rosalind',
    base: { hp: 33, atk: 10, def: 9, spd: 12 },
    moves: ['petal_dart', 'sprout_poke', 'leaf_twirl', 'dew_kiss'],
    desc: 'A shy petal girl. When startled she curls into a little rosebud.',
    art: { skin: '#ffe0d1', skinShade: '#f0b8a4', hair: '#ffc0d5', hairLight: '#ffe0eb', hairDark: '#d45d86', eye: '#ef6f9a', eyeLight: '#ffc0d4', dress: '#ffc1d6', dressDark: '#c94e77', trim: '#fff0f6', accent: '#ffe28a', accentDeep: '#c99b2e', accessory: 'heart', style: 'braid', adultStyle: 'long' },
  },
  rosalind: {
    id: 'rosalind', name: 'Rosalind', title: 'Rose Enchanter', type: 'Leaf', stage: 2, evolveLevel: 99,
    base: { hp: 50, atk: 18, def: 15, spd: 16 },
    moves: ['petal_dart', 'vine_snap', 'bloom_burst', 'dew_kiss'],
    desc: 'Poppy in full bloom — a rose enchanter with a crown of thorns and a kind heart.',
    art: { skin: '#ffe0d1', skinShade: '#f0b8a4', hair: '#ffd0e2', hairLight: '#ffeaf2', hairDark: '#b8416c', eye: '#d94d7c', eyeLight: '#ffc0d4', dress: '#ffd3e4', dressDark: '#b8416c', trim: '#fff3f8', accent: '#ffe28a', accentDeep: '#c99b2e', accessory: 'crown', style: 'braid', adultStyle: 'long' },
  },
  flick: {
    id: 'flick', name: 'Flick', title: 'Spark Chibi', type: 'Flame', stage: 1, evolveLevel: 9, evolvesTo: 'emberlyn',
    base: { hp: 33, atk: 11, def: 8, spd: 13 },
    moves: ['ember_pop', 'warm_hug', 'cinder_puff', 'soothe'],
    desc: 'A restless little flame girl. She cannot sit still for more than four seconds.',
    art: { skin: '#ffd8c2', skinShade: '#edb092', hair: '#ff9f74', hairLight: '#ffc8a8', hairDark: '#a83d24', eye: '#f27640', eyeLight: '#ffc08a', dress: '#ffb08a', dressDark: '#a83d24', trim: '#fff0dc', accent: '#ffd166', accentDeep: '#c97a20', accessory: 'flame', style: 'spiky', adultStyle: 'spiky' },
  },
  emberlyn: {
    id: 'emberlyn', name: 'Emberlyn', title: 'Wildfire Dancer', type: 'Flame', stage: 2, evolveLevel: 99,
    base: { hp: 48, atk: 20, def: 12, spd: 19 },
    moves: ['ember_pop', 'flare_kick', 'cinder_swirl', 'soothe'],
    desc: 'Flick, all grown up. Her wild hair trails embers and her laugh is a firework.',
    art: { skin: '#ffd8c2', skinShade: '#edb092', hair: '#ffb18a', hairLight: '#ffd8bc', hairDark: '#8f2f1a', eye: '#ff6b3d', eyeLight: '#ffc08a', dress: '#ffc09a', dressDark: '#8f2f1a', trim: '#fff0dc', accent: '#ffd166', accentDeep: '#c97a20', accessory: 'flame', style: 'spiky', adultStyle: 'long' },
  },
  dew: {
    id: 'dew', name: 'Dew', title: 'Dewdrop Chibi', type: 'Water', stage: 1, evolveLevel: 9, evolvesTo: 'coralia',
    base: { hp: 35, atk: 9, def: 10, spd: 9 },
    moves: ['bubble_pop', 'splash_tap', 'tide_slap', 'dew_drop'],
    desc: 'A drowsy dewdrop girl. She naps in clover and wakes up with snail friends.',
    art: { skin: '#ffdfd2', skinShade: '#efb8a4', hair: '#a8e8dd', hairLight: '#d2fff8', hairDark: '#2f9187', eye: '#35b0a2', eyeLight: '#a8fff2', dress: '#bdeee4', dressDark: '#2f9187', trim: '#f0fffb', accent: '#c8fff4', accentDeep: '#4a9c93', accessory: 'drop', style: 'buns', adultStyle: 'long' },
  },
  coralia: {
    id: 'coralia', name: 'Coralia', title: 'Tidekeeper', type: 'Water', stage: 2, evolveLevel: 99,
    base: { hp: 54, atk: 17, def: 17, spd: 14 },
    moves: ['bubble_pop', 'moon_tide', 'aqua_bloom', 'dew_drop'],
    desc: 'Dew, grown into a tidekeeper. She carries the hush of the deep sea in her hands.',
    art: { skin: '#ffdfd2', skinShade: '#efb8a4', hair: '#c2fff4', hairLight: '#e8fffb', hairDark: '#227f76', eye: '#2aa89a', eyeLight: '#a8fff2', dress: '#c9fff4', dressDark: '#227f76', trim: '#f0fffb', accent: '#c8fff4', accentDeep: '#3d9c91', accessory: 'crown', style: 'buns', adultStyle: 'long' },
  },
  zizi: {
    id: 'zizi', name: 'Zizi', title: 'Static Chibi', type: 'Spark', stage: 1, evolveLevel: 10, evolvesTo: 'voltessa',
    base: { hp: 30, atk: 12, def: 7, spd: 15 },
    moves: ['static_tick', 'zap_dash', 'thunder_bloom', 'glimmer'],
    desc: 'A rare static sprite. Her pigtails frizz when she is excited, which is always.',
    art: { skin: '#ffe2d0', skinShade: '#f0bda0', hair: '#ffe98a', hairLight: '#fff8c8', hairDark: '#b88b1e', eye: '#d8a01e', eyeLight: '#fff0a0', dress: '#ffe58a', dressDark: '#b88b1e', trim: '#fffbdc', accent: '#fff3a0', accentDeep: '#c9a32e', accessory: 'star', style: 'spiky', adultStyle: 'spiky' },
  },
  voltessa: {
    id: 'voltessa', name: 'Voltessa', title: 'Storm Princess', type: 'Spark', stage: 2, evolveLevel: 99,
    base: { hp: 46, atk: 21, def: 11, spd: 23 },
    moves: ['static_tick', 'zap_dash', 'thunder_bloom', 'glimmer'],
    desc: 'Zizi, matured into a storm princess. Thunder follows her like a loyal pet.',
    art: { skin: '#ffe2d0', skinShade: '#f0bda0', hair: '#fff3a8', hairLight: '#fffce0', hairDark: '#8d6a12', eye: '#e0a91f', eyeLight: '#fff3a0', dress: '#fff0a8', dressDark: '#8d6a12', trim: '#fffce8', accent: '#fff3a0', accentDeep: '#b88b1e', accessory: 'crown', style: 'spiky', adultStyle: 'spiky' },
  },
};

export const TYPE_META = {
  Leaf:  { color: '#58b978', deep: '#2f7d51', icon: '❧', label: 'Leaf' },
  Flame: { color: '#f0845d', deep: '#b94e2d', icon: '✹', label: 'Flame' },
  Water: { color: '#5eb7de', deep: '#2f75a3', icon: '❉', label: 'Water' },
  Spark: { color: '#e7bc4a', deep: '#9a7415', icon: '✦', label: 'Spark' },
};

export const STARTERS = ['nia', 'coco', 'miri'];

export const ITEMS = {
  orb:    { id: 'orb',    name: 'Bond Orb',     icon: '◉', price: 80,  desc: 'Befriends a weakened wild Bloomkin. Better when her HP is low.' },
  potion: { id: 'potion', name: 'Heart Potion', icon: '♥', price: 60,  desc: 'Restores 30 HP to one Bloomkin.', heal: 30 },
  tea:    { id: 'tea',    name: 'Moon Tea',     icon: '☕', price: 150, desc: 'Fully restores one Bloomkin.', heal: 999 },
};

/* ─────────────── helpers ─────────────── */

export const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
export const rnd = (a, b) => a + Math.random() * (b - a);
export const pick = arr => arr[Math.floor(Math.random() * arr.length)];
export const xpToNext = level => 12 + level * 9;

export function statsFor(speciesId, level) {
  const sp = SPECIES[speciesId];
  return {
    maxHp: Math.floor(sp.base.hp * 0.6 + level * 3.2 + 10),
    atk: Math.round(sp.base.atk + level * 1.45),
    def: Math.round(sp.base.def + level * 1.15),
    spd: Math.round(sp.base.spd + level * 1.05),
  };
}

export function makeCreature(speciesId, level, xp = 0) {
  const st = statsFor(speciesId, level);
  return { species: speciesId, level, xp, hp: st.maxHp, bond: 1 + Math.floor(level / 5) };
}

/* ─────────────── trainers & people ─────────────── */

export const TRAINERS = {
  mira: {
    id: 'mira', name: 'Mira', title: 'Meadow Keeper', portrait: 'mira',
    intro: [
      'Oh! A new face in Verdant Hollow. I\'m Mira, keeper of the west meadow.',
      'Every keeper carries a Bloom Seal. Beat me and the first one is yours!',
    ],
    defeat: 'Ha! You\'ve got real spark. The first Bloom Seal is yours, Wren.',
    win: 'Come back after a little training — the meadow will wait.',
    reward: { coins: 110, seal: 0 },
    team: [{ species: 'poppy', level: 5 }, { species: 'dew', level: 6 }],
  },
  rowan: {
    id: 'rowan', name: 'Rowan', title: 'Town Keeper', portrait: 'rowan',
    intro: [
      'Hmm. You have the look of someone who talks to flowers.',
      'I\'m Rowan. Show me a battle worth remembering and the second seal is yours.',
    ],
    defeat: 'A worthy bloom! The second seal belongs to you.',
    win: 'Not yet. Grow a little, then find me again.',
    reward: { coins: 150, seal: 1 },
    team: [{ species: 'flick', level: 8 }, { species: 'poppy', level: 8 }],
  },
  elowen: {
    id: 'elowen', name: 'Elowen', title: 'Grove Keeper', portrait: 'elowen',
    intro: [
      'The Whisperwood told me you were coming. It gossips terribly.',
      'I am Elowen, last of the trial keepers. Win, and the third seal is yours.',
    ],
    defeat: 'The wood approves. Take the third seal — and my respect.',
    win: 'The wild things are still singing your name. Train, and return.',
    reward: { coins: 210, seal: 2 },
    team: [{ species: 'rosalind', level: 10 }, { species: 'coralia', level: 11 }],
  },
  briar: {
    id: 'briar', name: 'Queen Briar', title: 'Bloom Sovereign', portrait: 'queen',
    intro: [
      'So the three seals have found their way to you. I wondered who the vale would choose.',
      'I am Briar, sovereign of the Bloom Court. One final battle, little bond-keeper.',
      'Show me that your bond can outshine my crown!',
    ],
    defeat: '…Beautiful. Truly. The crown was never the point — the bond was.',
    win: 'The vale still needs you. Rest, heal, and come back to me.',
    reward: { coins: 500, finale: true },
    team: [{ species: 'rosalind', level: 12 }, { species: 'voltessa', level: 12 }, { species: 'sylvie', level: 14 }],
  },
};

export const NPCS = [
  { id: 'professor', x: 10, y: 26, name: 'Professor Lila', portrait: 'professor', dir: 'down', hair: '#9b6b4c', dress: '#7ba986',
    lines: ['Every Bloomkin begins as a chibi — small, round, and full of potential.', 'When the bond is strong enough, she grows into her grown-up form. It is the loveliest thing you will ever see.', 'The three trial keepers hold Bloom Seals. The shrine gate will open only for someone who earns all three.'] },
  { id: 'villager1', x: 14, y: 29, name: 'Nell', portrait: 'villager', dir: 'left', hair: '#7f6a56', dress: '#8aa06a',
    lines: ['The fountain water here is special. One sip and your whole team feels brand new.', 'Wild Bloomkin hide in the tall grass. Walk through it and you might make a friend!'] },
  { id: 'villager2', x: 8, y: 30, name: 'Old Tam', portrait: 'villager', dir: 'right', hair: '#cfc2a8', dress: '#6f8a72',
    lines: ['I remember when Queen Briar was just a chibi with muddy knees.', 'She still keeps a flower from her first bond in her crown. Don\'t tell her I told you.'] },
  { id: 'professor2', x: 20, y: 26, name: 'Professor Lila', portrait: 'professor', dir: 'right', hair: '#9b6b4c', dress: '#7ba986',
    lines: ['The Bloomkin in your party grow stronger with every battle. They also grow up.', 'Some evolve at level 6. Others wait until level 9 or 10. Patience is part of the bond.'] },
  { id: 'shop', x: 16, y: 29, name: 'Pip', portrait: 'shop', dir: 'up', hair: '#c77a45', dress: '#d7954e', shop: true,
    lines: ['Pip\'s Petals is open! Bond Orbs, Heart Potions, and Moon Tea — everything a bond-keeper needs.'] },
  { id: 'villager3', x: 27, y: 28, name: 'Sable', portrait: 'villager', dir: 'down', hair: '#9c6c8f', dress: '#8d7bb5',
    lines: ['The tall grass east of town is full of lively girls. Zizi the static sprite is very rare.', 'If your Bond Orb fails, weaken her first. A tired Bloomkin is a friendlier Bloomkin.'] },
  { id: 'rowan2', x: 21, y: 25, name: 'Rowan', portrait: 'rowan', dir: 'down', hair: '#7a5a44', dress: '#5d8f6c', trainer: 'rowan' },
  { id: 'mira2', x: 12, y: 31, name: 'Mira', portrait: 'mira', dir: 'up', hair: '#f08aad', dress: '#e4678b', trainer: 'mira' },
  { id: 'elowen2', x: 29, y: 14, name: 'Elowen', portrait: 'elowen', dir: 'left', hair: '#8d7bd6', dress: '#6b5bb5', trainer: 'elowen' },
  { id: 'briar2', x: 40, y: 10, name: 'Queen Briar', portrait: 'queen', dir: 'down', hair: '#3d7d5b', dress: '#2a5c45', trainer: 'briar' },
  { id: 'villager4', x: 33, y: 29, name: 'Fenn', portrait: 'villager', dir: 'up', hair: '#6c8fbd', dress: '#7a9d6c',
    lines: ['The shrine gate has been shut for years. Only three Bloom Seals can open it.', 'Mira, Rowan, and Elowen each guard one. Good luck, bond-keeper.'] },
  { id: 'villager5', x: 26, y: 11, name: 'Wisp', portrait: 'villager', dir: 'down', hair: '#b8a2d9', dress: '#6f8a9d',
    lines: ['The Whisperwood smells like rain and old stories.', 'I heard Queen Briar\'s own Bloomkin evolved at level 14. Imagine being that loved!'] },
];

export const SIGNS = [
  { id: 'sign1', x: 10, y: 28, text: 'VERDANT HOLLOW — where every bond begins.' },
  { id: 'sign2', x: 18, y: 30, text: 'WEST MEADOW → Mira the Meadow Keeper. TALL GRASS: wild Bloomkin ahead.' },
  { id: 'sign3', x: 20, y: 28, text: 'LUMEN TOWN — Bloom Seal trials every spring.' },
  { id: 'sign4', x: 25, y: 16, text: 'WHISPERWOOD — mind the brambles. The grove keeper waits within.' },
  { id: 'sign5', x: 33, y: 11, text: 'BRIAR SHRINE — three seals open the way.' },
];

/* ─────────────── world map ─────────────── */

export const MAP_W = 48;
export const MAP_H = 34;
export const TILE = 48;

function makeRng(seed) {
  return function () {
    seed |= 0; seed = seed + 0x6D2B79F5 | 0;
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

function buildMap() {
  const rng = makeRng(20261105);
  const g = Array.from({ length: MAP_H }, () => Array(MAP_W).fill('.'));
  const put = (x, y, c) => { if (x >= 0 && y >= 0 && x < MAP_W && y < MAP_H) g[y][x] = c; };
  const get = (x, y) => (g[y] && g[y][x]) || 'T';
  const rect = (x, y, w, h, c) => { for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) put(i, j, c); };

  // outer forest border
  for (let x = 0; x < MAP_W; x++) { put(x, 0, 'T'); put(x, 1, 'T'); put(x, 2, 'T'); put(x, MAP_H - 1, 'T'); put(x, MAP_H - 2, 'T'); }
  for (let y = 0; y < MAP_H; y++) { put(0, y, 'T'); put(1, y, 'T'); put(MAP_W - 1, y, 'T'); put(MAP_W - 2, y, 'T'); }
  for (let x = 3; x < MAP_W - 3; x++) {
    if (rng() < .22) put(x, 3, 'T');
    if (rng() < .18) put(x, MAP_H - 3, 'T');
  }
  for (let y = 3; y < MAP_H - 3; y++) {
    if (rng() < .16) put(3, y, 'T');
    if (rng() < .16) put(MAP_W - 3, y, 'T');
  }

  // river (wavy) with a stone bridge
  for (let x = 2; x < MAP_W - 2; x++) {
    const y0 = 18 + Math.round(Math.sin(x * .45) * 0.7);
    for (let d = 0; d < 3; d++) put(x, y0 + d, 'W');
    if (rng() < .5) put(x, y0 - 1, 'W');
  }
  rect(23, 17, 3, 5, 'W');
  rect(23, 17, 3, 5, '=');
  // little sand banks
  for (let x = 4; x < 32; x++) {
    const y0 = 18 + Math.round(Math.sin(x * .45) * .7);
    if (get(x, y0 - 2) === '.') put(x, y0 - 2, ',');
    if (get(x, y0 + 3) === '.') put(x, y0 + 3, ',');
  }

  // lake in the south-east
  for (let y = 22; y < 33; y++) for (let x = 34; x < 47; x++) {
    const dx = (x - 40.5) / 7.4, dy = (y - 27.5) / 5.6;
    if (dx * dx + dy * dy < 1) put(x, y, 'W');
    else if (dx * dx + dy * dy < 1.28) put(x, y, ',');
  }
  // little island
  rect(40, 26, 2, 2, '.');
  put(40, 26, 'T');

  // paths
  const line = (x1, y1, x2, y2, c = '#') => {
    let dx = Math.abs(x2 - x1), dy = Math.abs(y2 - y1);
    let sx = x1 < x2 ? 1 : -1, sy = y1 < y2 ? 1 : -1, err = dx - dy;
    while (true) {
      put(x1, y1, c);
      if (x1 === x2 && y1 === y2) break;
      const e2 = 2 * err;
      if (e2 > -dy) { err -= dy; x1 += sx; }
      if (e2 < dx) { err += dx; y1 += sy; }
    }
  };
  line(10, 29, 17, 29);
  line(17, 29, 21, 28);
  line(21, 28, 22, 26);
  line(22, 26, 24, 24);
  line(24, 24, 24, 21);
  line(24, 21, 24, 17, '=');
  line(24, 17, 24, 14);
  line(24, 14, 27, 12);
  line(27, 12, 30, 10);
  line(30, 10, 34, 10);
  line(34, 10, 40, 10);
  line(24, 14, 28, 14);
  line(20, 13, 24, 13);
  line(17, 12, 20, 12);
  line(12, 29, 12, 31);
  line(17, 29, 17, 31);
  line(24, 26, 27, 26);
  line(21, 25, 19, 25);
  // plaza
  rect(21, 24, 7, 4, '=');
  rect(28, 25, 4, 1, '=');
  rect(21, 22, 5, 2, '=');
  // shrine courtyard
  rect(35, 6, 10, 7, '=');
  rect(34, 9, 3, 3, '=');
  // forest clearing
  rect(27, 12, 4, 4, ',');
  // town flowerbeds
  rect(18, 24, 2, 2, ',');
  rect(32, 25, 2, 3, ',');

  // tall grass
  const grass = (x, y, w, h) => {
    for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) {
      if (get(i, j) === '.' || get(i, j) === ',') put(i, j, 'H');
    }
  };
  grass(3, 26, 2, 6);
  grass(5, 31, 5, 2);
  grass(11, 31, 6, 2);
  grass(17, 30, 2, 3);
  grass(26, 29, 6, 3);
  grass(30, 31, 4, 2);
  grass(33, 25, 2, 3);
  grass(10, 13, 7, 4);
  grass(12, 6, 5, 3);
  grass(25, 6, 6, 3);
  grass(27, 15, 4, 2);
  grass(36, 12, 8, 3);
  grass(35, 8, 2, 2);

  // scattered forest trees
  for (let y = 4; y < 18; y++) for (let x = 4; x < 36; x++) {
    if (get(x, y) === '.' && rng() < .11) put(x, y, 'T');
  }
  for (let y = 21; y < 33; y++) for (let x = 2; x < 34; x++) {
    if (get(x, y) === '.' && rng() < .035) put(x, y, 'T');
  }
  // rocks
  for (let i = 0; i < 22; i++) {
    const x = 4 + Math.floor(rng() * 42), y = 4 + Math.floor(rng() * 28);
    if (get(x, y) === '.') put(x, y, 'R');
  }
  // flowers
  for (let y = 3; y < MAP_H - 3; y++) for (let x = 3; x < MAP_W - 3; x++) {
    if (get(x, y) === '.' && rng() < .08) put(x, y, ',');
  }

  // guarantee clearings around people, doors & signs
  const clear = (x, y, r = 1) => {
    for (let j = y - r; j <= y + r; j++) for (let i = x - r; i <= x + r; i++) {
      if (i < 2 || j < 2 || i >= MAP_W - 2 || j >= MAP_H - 2) continue;
      const c = get(i, j);
      if (c === 'T' || c === 'R') put(i, j, '.');
    }
  };
  NPCS.forEach(n => { clear(n.x, n.y); put(n.x, n.y, n.x >= 20 && n.y >= 22 && n.y <= 27 ? '=' : '.'); });
  SIGNS.forEach(s => { clear(s.x, s.y); put(s.x, s.y, '#'); });
  WORLD_OBJECTS.forEach(o => {
    if (o.type === 'building') {
      for (let j = o.y; j < o.y + o.h; j++) for (let i = o.x; i < o.x + o.w; i++) put(i, j, '#');
      clear(o.x + Math.floor(o.w / 2), o.y + o.h, 1);
    } else {
      clear(o.x, o.y, 2);
      put(o.x, o.y, '=');
    }
  });
  clear(10, 29, 2); put(10, 29, '#');

  return g.map(row => row.join(''));
}

export const BUILDINGS = [
  { kind: 'cottage', x: 5, y: 24, w: 4, h: 3, name: 'Rosebriar Cottage', roof: '#d97b6c', wall: '#f6e6c8', trim: '#fff4d9' },
  { kind: 'cottage', x: 11, y: 24, w: 4, h: 3, name: 'Honeypot House', roof: '#5f9c76', wall: '#f6e6c8', trim: '#fff4d9' },
  { kind: 'shop', x: 15, y: 27, w: 3, h: 2, name: "Pip's Petals", roof: '#e0a34a', wall: '#f8e8c6', trim: '#fff4d9' },
  { kind: 'hall', x: 19, y: 21, w: 5, h: 4, name: 'Lumen Hall', roof: '#7d6bb0', wall: '#f1e4cb', trim: '#fff4d9' },
  { kind: 'inn', x: 28, y: 24, w: 4, h: 3, name: 'The Sleeping Fern', roof: '#4f8fa3', wall: '#f6e6c8', trim: '#fff4d9' },
  { kind: 'cabin', x: 16, y: 9, w: 4, h: 3, name: 'Grove Cabin', roof: '#8a6a4f', wall: '#e7d3ad', trim: '#f8eaca' },
  { kind: 'shrine', x: 38, y: 4, w: 5, h: 4, name: 'Briar Shrine', roof: '#5a8f6f', wall: '#efe4ca', trim: '#ffe9a8' },
];

export const PROPS = [
  { kind: 'fountain', x: 9, y: 27, name: 'Verdant Fountain', heal: true, region: 'village' },
  { kind: 'fountain', x: 25, y: 25, name: 'Lumen Fountain', heal: true, region: 'town' },
  { kind: 'moonwell', x: 36, y: 8, name: 'Moonwell', heal: true, region: 'shrine' },
  { kind: 'gate', x: 35, y: 10, name: 'Shrine Gate', gate: true },
  { kind: 'altar', x: 40, y: 8, name: 'Bloom Altar' },
];

export const WORLD_OBJECTS = [
  ...BUILDINGS.map(b => ({ ...b, type: 'building', solid: true })),
  ...PROPS.map(p => ({ ...p, type: 'prop', solid: p.kind !== 'altar' })),
];


export const MAP = buildMap();

/* ─────────────── encounters ─────────────── */

export const ENCOUNTERS = {
  meadow: [
    { species: 'poppy', min: 3, max: 4, weight: 4 },
    { species: 'flick', min: 3, max: 4, weight: 3 },
    { species: 'dew', min: 3, max: 4, weight: 3 },
  ],
  route: [
    { species: 'poppy', min: 4, max: 6, weight: 3 },
    { species: 'flick', min: 4, max: 6, weight: 3 },
    { species: 'dew', min: 4, max: 6, weight: 3 },
    { species: 'zizi', min: 5, max: 6, weight: 1 },
  ],
  town: [
    { species: 'poppy', min: 5, max: 7, weight: 2 },
    { species: 'flick', min: 5, max: 7, weight: 2 },
    { species: 'dew', min: 5, max: 7, weight: 2 },
    { species: 'zizi', min: 6, max: 7, weight: 1 },
  ],
  forest: [
    { species: 'flick', min: 7, max: 9, weight: 3 },
    { species: 'dew', min: 7, max: 9, weight: 3 },
    { species: 'poppy', min: 7, max: 9, weight: 3 },
    { species: 'rosalind', min: 9, max: 10, weight: 1 },
    { species: 'zizi', min: 7, max: 9, weight: 1 },
  ],
  shrine: [
    { species: 'rosalind', min: 10, max: 12, weight: 2 },
    { species: 'coralia', min: 10, max: 12, weight: 2 },
    { species: 'emberlyn', min: 10, max: 12, weight: 2 },
    { species: 'voltessa', min: 11, max: 12, weight: 1 },
  ],
};

export function encounterZone(x, y) {
  if (x >= 34 && y <= 14) return 'shrine';
  if (y <= 17) return 'forest';
  if (x < 19) return y >= 29 ? 'meadow' : 'route';
  return y >= 28 ? 'town' : 'route';
}

export function pickEncounter(zone) {
  const table = ENCOUNTERS[zone] || ENCOUNTERS.meadow;
  const total = table.reduce((s, e) => s + e.weight, 0);
  let r = Math.random() * total;
  for (const e of table) { r -= e.weight; if (r <= 0) return e; }
  return table[0];
}

/* ─────────────── quests & flavour ─────────────── */

export const QUEST_SEALS = [
  { id: 'mira', name: 'Meadow Seal', person: 'Mira', place: 'the west meadow', hint: 'South-west of Verdant Hollow, past the tall grass.' },
  { id: 'rowan', name: 'Town Seal', person: 'Rowan', place: 'Lumen Town', hint: 'By the hall in the town plaza.' },
  { id: 'elowen', name: 'Grove Seal', person: 'Elowen', place: 'the Whisperwood', hint: 'North across the bridge, in the forest clearing.' },
];

export function regionName(x, y) {
  if (x >= 34 && y <= 14) return 'Briar Shrine';
  if (y <= 17) return 'Whisperwood';
  if (x < 19) return 'Verdant Hollow';
  if (x <= 34 && y <= 28) return 'Lumen Town';
  return 'Sunbeam Route';
}

export const TIPS = [
  'Tip: Tall grass hides wild Bloomkin. Walk through it to make friends.',
  'Tip: A weakened wild Bloomkin is much easier to befriend with a Bond Orb.',
  'Tip: Your first Bloomkin evolves at level 6. Watch her grow!',
  'Tip: Type advantage matters — Leaf beats Water, Water beats Flame, Flame beats Leaf.',
  'Tip: The fountain in Verdant Hollow heals your whole team for free.',
  'Tip: You can swap the lead of your party from the Team screen.',
  'Tip: Spark Bloomkin are rare. Zizi loves the tall grass east of Lumen Town.',
  'Tip: Talk to everyone. The vale is full of small stories.',
];
