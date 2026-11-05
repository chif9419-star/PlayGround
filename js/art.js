/* ════════════════════════════════════════════════════════════════
   art.js — hand-built SVG monster girls, portraits & scenery marks
   ════════════════════════════════════════════════════════════════ */

let uidCounter = 0;
const uid = () => `bb${++uidCounter}`;

const TYPE_COLORS = {
  Leaf: { main: '#58b978', deep: '#2f7d51', soft: '#e4f7e7' },
  Flame: { main: '#f0845d', deep: '#b94e2d', soft: '#ffeadf' },
  Water: { main: '#5eb7de', deep: '#2f75a3', soft: '#e2f4fc' },
  Spark: { main: '#e7bc4a', deep: '#9a7415', soft: '#fff5d1' },
};

export function typeColors(type) { return TYPE_COLORS[type] || TYPE_COLORS.Leaf; }

function gradient(id, a, b, vertical = true) {
  return `<linearGradient id="${id}" x1="0" y1="0" x2="${vertical ? 0 : 1}" y2="${vertical ? 1 : 0}">
    <stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/>
  </linearGradient>`;
}

function radial(id, inner, outer) {
  return `<radialGradient id="${id}"><stop offset="0" stop-color="${inner}"/><stop offset="1" stop-color="${outer}"/></radialGradient>`;
}

/* ─────────────── element auras ─────────────── */

function auraMarkup(type, u, stage) {
  const c = TYPE_COLORS[type] || TYPE_COLORS.Leaf;
  let fx = '';
  if (type === 'Leaf') {
    fx = `
      <path class="mgfx" style="animation-delay:-.4s" d="M42 120 q10 -18 26 -14 q-2 18 -18 22 q-6 2 -8 -8z" fill="${c.main}" opacity=".75"/>
      <path class="mgfx" style="animation-delay:-1.8s" d="M186 182 q16 -6 20 8 q-14 12 -24 2 q-2 -8 4 -10z" fill="#8fd9a3" opacity=".65"/>
      <path class="mgfx" style="animation-delay:-3s" d="M194 78 q12 2 10 16 q-13 1 -16 -10 q0 -5 6 -6z" fill="${c.main}" opacity=".55"/>
      <circle cx="168" cy="52" r="2.4" fill="#fff6c9" opacity=".9"/>`;
  } else if (type === 'Flame') {
    fx = `
      <path class="mgfx" style="animation-delay:-.7s" d="M46 150 q-2 -18 10 -24 q0 10 8 14 q6 -12 14 -10 q-2 20 -16 28 q-12 4 -16 -8z" fill="#ffb15e" opacity=".7"/>
      <path class="mgfx" style="animation-delay:-2.2s" d="M184 92 q-2 -14 8 -18 q0 8 6 10 q4 -8 10 -8 q-2 16 -12 22 q-9 3 -12 -6z" fill="#ffd166" opacity=".55"/>
      <circle class="mgfx" style="animation-delay:-1.1s" cx="164" cy="48" r="3.4" fill="#ffdd8a" opacity=".85"/>
      <circle class="mgfx" style="animation-delay:-2.8s" cx="52" cy="208" r="2.6" fill="#ffb15e" opacity=".7"/>`;
  } else if (type === 'Water') {
    fx = `
      <circle class="mgfx" style="animation-delay:-.5s" cx="46" cy="130" r="7" fill="none" stroke="#9adcf5" stroke-width="2" opacity=".75"/>
      <circle class="mgfx" style="animation-delay:-1.7s" cx="190" cy="168" r="5" fill="none" stroke="#bfeeff" stroke-width="2" opacity=".7"/>
      <circle class="mgfx" style="animation-delay:-2.6s" cx="188" cy="68" r="3.4" fill="#e8fbff" opacity=".85"/>
      <circle class="mgfx" style="animation-delay:-3.4s" cx="56" cy="216" r="3" fill="#bfeeff" opacity=".6"/>`;
  } else {
    fx = `
      <path class="mgfx" style="animation-delay:-.6s" d="M44 128 l5 -12 4 12 12 4 -12 4 -4 12 -5 -12 -12 -4z" fill="#ffe58a" opacity=".85"/>
      <path class="mgfx" style="animation-delay:-2s" d="M188 76 l3.5 -9 3.5 9 9 3.5 -9 3.5 -3.5 9 -3.5 -9 -9 -3.5z" fill="#fff3b8" opacity=".8"/>
      <circle class="mgfx" style="animation-delay:-1.2s" cx="188" cy="186" r="3" fill="#ffe58a" opacity=".8"/>
      <circle class="mgfx" style="animation-delay:-3.2s" cx="54" cy="212" r="2.4" fill="#fff3b8" opacity=".7"/>`;
  }
  return `<g class="mon-aura">${fx}</g>`;
}

/* ─────────────── hair ─────────────── */

function backHair(cfg, stage, u) {
  const hg = `url(#${u}hg)`;
  const dark = cfg.hairDark;
  const style = stage === 1 ? (cfg.style || 'twin') : (cfg.adultStyle || 'long');

  if (stage === 1) {
    let extra = '';
    if (style === 'twin') {
      extra = `
        <path d="M58 118 C36 140 30 186 42 214 C48 228 64 226 68 212 C60 190 64 156 76 138 Z" fill="${hg}"/>
        <path d="M182 118 C204 140 210 186 198 214 C192 228 176 226 172 212 C180 190 176 156 164 138 Z" fill="${hg}"/>
        <ellipse cx="58" cy="132" rx="13" ry="11" fill="${dark}" opacity=".35"/>
        <ellipse cx="182" cy="132" rx="13" ry="11" fill="${dark}" opacity=".35"/>`;
    } else if (style === 'long') {
      extra = `
        <path d="M60 108 C34 152 36 224 54 262 C70 280 94 270 84 248 C70 214 74 156 86 128 Z" fill="${hg}"/>
        <path d="M180 108 C206 152 204 224 186 262 C170 280 146 270 156 248 C170 214 166 156 154 128 Z" fill="${hg}"/>`;
    } else if (style === 'bob') {
      extra = `<path d="M58 118 C48 168 60 200 88 204 L120 196 L152 204 C180 200 192 168 182 118 Z" fill="${hg}"/>`;
    } else if (style === 'pony') {
      extra = `
        <path d="M176 104 C210 106 224 142 214 184 C208 210 188 214 184 196 C194 170 188 136 168 124 Z" fill="${hg}"/>
        <circle cx="181" cy="108" r="11" fill="${cfg.accent || '#ffe9a8'}"/>`;
    } else if (style === 'buns') {
      extra = `
        <circle cx="72" cy="70" r="24" fill="${hg}"/>
        <circle cx="168" cy="70" r="24" fill="${hg}"/>
        <circle cx="72" cy="70" r="14" fill="${dark}" opacity=".25"/>
        <circle cx="168" cy="70" r="14" fill="${dark}" opacity=".25"/>`;
    } else if (style === 'braid') {
      extra = `
        <path d="M60 150 C48 200 54 244 70 268 C82 282 98 272 88 256 C76 234 74 188 82 158 Z" fill="${hg}"/>
        <circle cx="76" cy="206" r="9" fill="${hg}"/><circle cx="82" cy="230" r="8" fill="${hg}"/>
        <circle cx="76" cy="252" r="7" fill="${hg}"/>`;
    } else {
      extra = `
        <path d="M52 146 L32 128 L56 120 L46 94 L72 100 L78 74 L96 96" fill="${hg}"/>
        <path d="M188 146 L208 128 L184 120 L194 94 L168 100 L162 74 L144 96" fill="${hg}"/>`;
    }
    return `<g>${extra}<circle cx="120" cy="126" r="67" fill="${hg}"/></g>`;
  }

  // adult — longer, more flowing
  let extra = '';
  if (style === 'long' || style === 'twin') {
    extra = `
      <path d="M72 78 C42 122 34 198 48 256 C58 292 88 292 92 270 C74 232 78 160 96 118 Z" fill="${hg}"/>
      <path d="M168 78 C198 122 206 198 192 256 C182 292 152 292 148 270 C166 232 162 160 144 118 Z" fill="${hg}"/>
      <path d="M88 82 C56 140 58 226 74 264" stroke="${dark}" stroke-width="2" fill="none" opacity=".25"/>
      <path d="M152 82 C184 140 182 226 166 264" stroke="${dark}" stroke-width="2" fill="none" opacity=".25"/>`;
  } else if (style === 'bob') {
    extra = `<path d="M78 66 C58 120 66 158 92 166 L120 158 L148 166 C174 158 182 120 162 66 Z" fill="${hg}"/>`;
  } else if (style === 'pony') {
    extra = `<path d="M172 68 C212 74 226 124 212 180 C204 212 180 210 180 188 C194 148 184 108 158 94 Z" fill="${hg}"/>`;
  } else if (style === 'braid') {
    extra = `
      <path d="M76 96 C56 170 60 240 74 282 C84 304 104 296 96 278 C84 246 82 180 92 120 Z" fill="${hg}"/>
      <circle cx="82" cy="180" r="9" fill="${hg}"/><circle cx="80" cy="208" r="8" fill="${hg}"/>
      <circle cx="82" cy="234" r="7" fill="${hg}"/><circle cx="84" cy="258" r="6" fill="${hg}"/>`;
  } else if (style === 'buns') {
    extra = `<circle cx="86" cy="52" r="19" fill="${hg}"/><circle cx="154" cy="52" r="19" fill="${hg}"/>`;
  } else {
    extra = `
      <path d="M74 90 L58 64 L82 66 L78 42 L98 58 L106 38 L118 60" fill="${hg}"/>
      <path d="M166 90 L182 64 L158 66 L162 42 L142 58 L134 38 L122 60" fill="${hg}"/>`;
  }
  return `<g>${extra}<circle cx="120" cy="90" r="45" fill="${hg}"/></g>`;
}

function frontHair(cfg, stage, u) {
  const hg = `url(#${u}hg)`;
  const dark = cfg.hairDark;
  if (stage === 1) {
    return `
      <path d="M58 134 C48 80 80 48 120 48 C162 48 192 80 182 134
        L174 112 C170 128 162 132 156 112 C152 130 142 134 138 114
        C134 132 124 134 120 112 C116 132 106 134 102 114
        C98 132 88 130 84 112 C78 130 70 128 66 112 Z" fill="${hg}"/>
      <path d="M64 118 C64 142 70 158 78 168 C84 150 82 130 86 118 Z" fill="${hg}"/>
      <path d="M176 118 C176 142 170 158 162 168 C156 150 158 130 154 118 Z" fill="${hg}"/>
      <path d="M96 62 C108 52 128 50 142 58" stroke="${cfg.hairLight || '#fff'}" stroke-width="3" fill="none" opacity=".4" stroke-linecap="round"/>`;
  }
  return `
    <path d="M84 108 C76 62 96 42 120 42 C146 42 166 62 156 108
      L150 88 C146 102 140 104 136 88 C133 102 126 104 122 88
      C118 102 112 102 108 88 C104 102 96 102 92 88 Z" fill="${hg}"/>
    <path d="M88 96 C88 120 92 132 98 140 C102 126 101 108 104 98 Z" fill="${hg}"/>
    <path d="M152 96 C152 120 148 132 142 140 C138 126 139 108 136 98 Z" fill="${hg}"/>
    <path d="M104 54 C114 47 130 46 138 52" stroke="${cfg.hairLight || '#fff'}" stroke-width="2.2" fill="none" opacity=".42" stroke-linecap="round"/>
    <path d="M96 60 C88 88 92 108 98 120" stroke="${dark}" stroke-width="1.4" fill="none" opacity=".2"/>`;
}

/* ─────────────── face ─────────────── */

function face(cfg, stage, u) {
  const adult = stage > 1;
  const eyeY = adult ? 90 : 132;
  const eyeDX = adult ? 15 : 20;
  const eyeR = adult ? 8.5 : 11.5;
  const eyeH = adult ? 11 : 14;
  const lash = cfg.hairDark;
  const blushY = adult ? 105 : 151;
  const eye = (cx, flip) => `
    <g>
      <ellipse cx="${cx}" cy="${eyeY}" rx="${eyeR + 1.4}" ry="${eyeH + 1.6}" fill="#3a2a2a"/>
      <ellipse cx="${cx}" cy="${eyeY + .6}" rx="${eyeR}" ry="${eyeH}" fill="url(#${u}eye)"/>
      <ellipse cx="${cx}" cy="${eyeY + 3.2}" rx="${eyeR * .62}" ry="${eyeH * .56}" fill="#231a1d" opacity=".9"/>
      <circle cx="${cx - eyeR * .34}" cy="${eyeY - eyeH * .34}" r="${eyeR * .34}" fill="#fff" opacity=".95"/>
      <circle cx="${cx + eyeR * .34}" cy="${eyeY + eyeH * .32}" r="${eyeR * .16}" fill="#fff" opacity=".8"/>
      <path d="M${cx - eyeR - 2} ${eyeY - eyeH - 2} q${flip ? -2 : 2} ${-eyeR * .8} ${eyeR * 1.7} ${-eyeR * .5}" stroke="${lash}" stroke-width="${adult ? 2.4 : 2.8}" fill="none" stroke-linecap="round"/>
      ${adult ? `<path d="M${cx + (flip ? -1 : 1) * (eyeR + 1)} ${eyeY - eyeH + 1} l${flip ? -3 : 3} -4" stroke="${lash}" stroke-width="1.6" stroke-linecap="round"/>` : ''}
    </g>`;

  return `
    <ellipse cx="${120 - eyeDX - 18}" cy="${blushY}" rx="9" ry="4.5" fill="#ff9ab0" opacity=".42"/>
    <ellipse cx="${120 + eyeDX + 18}" cy="${blushY}" rx="9" ry="4.5" fill="#ff9ab0" opacity=".42"/>
    ${eye(120 - eyeDX, false)}
    ${eye(120 + eyeDX, true)}
    <path d="M${112} ${adult ? 104 : 154} q8 7 16 0" stroke="#b05f66" stroke-width="${adult ? 2 : 2.2}" fill="none" stroke-linecap="round"/>
    <path d="M118 ${adult ? 100 : 149} q2 2 4 0" stroke="#d79a9a" stroke-width="1.4" fill="none" stroke-linecap="round"/>
    <ellipse cx="${120}" cy="${adult ? 96 : 138}" rx="2" ry="1.3" fill="${cfg.skinShade || '#edb49c'}" opacity=".35"/>`;
}

/* ─────────────── bodies ─────────────── */

function chibiBody(cfg, u) {
  const dg = `url(#${u}dg)`, dk = cfg.dressDark, trim = cfg.trim || '#fff4d6';
  return `
    <g class="mg-legs">
      <rect x="104" y="246" width="14" height="38" rx="7" fill="url(#${u}sg)"/>
      <rect x="122" y="246" width="14" height="38" rx="7" fill="url(#${u}sg)"/>
      <ellipse cx="110" cy="288" rx="13" ry="8" fill="${dk}"/>
      <ellipse cx="130" cy="288" rx="13" ry="8" fill="${dk}"/>
      <ellipse cx="108" cy="286" rx="6" ry="3" fill="#fff" opacity=".22"/>
      <ellipse cx="128" cy="286" rx="6" ry="3" fill="#fff" opacity=".22"/>
    </g>
    <path d="M96 176 C94 190 84 226 80 246 C96 260 144 260 160 246 C156 226 146 190 144 176 Z" fill="${dg}"/>
    <path d="M80 246 C96 260 144 260 160 246 L158 254 C142 266 98 266 82 254 Z" fill="${trim}" opacity=".9"/>
    <path d="M92 198 C104 204 136 204 148 198 L150 208 C136 214 104 214 90 208 Z" fill="${trim}" opacity=".75"/>
    <circle cx="120" cy="204" r="5.5" fill="${cfg.accent || '#ffe9a8'}"/>
    <circle cx="120" cy="204" r="2.4" fill="#fff8d9"/>
    <path d="M100 178 C108 170 132 170 140 178 L134 186 C126 181 114 181 106 186 Z" fill="${trim}" opacity=".92"/>
    <!-- arms -->
    <path d="M97 184 C84 194 79 212 85 228" stroke="${cfg.skin}" stroke-width="13" fill="none" stroke-linecap="round"/>
    <path d="M143 184 C156 194 161 212 155 228" stroke="${cfg.skin}" stroke-width="13" fill="none" stroke-linecap="round"/>
    <path d="M96 186 C89 190 86 200 87 206" stroke="${trim}" stroke-width="7" fill="none" stroke-linecap="round" opacity=".75"/>
    <path d="M144 186 C151 190 154 200 153 206" stroke="${trim}" stroke-width="7" fill="none" stroke-linecap="round" opacity=".75"/>
    <circle cx="85" cy="230" r="7" fill="url(#${u}sg)"/>
    <circle cx="155" cy="230" r="7" fill="url(#${u}sg)"/>`;
}

function adultBody(cfg, u) {
  const dg = `url(#${u}dg)`, dk = cfg.dressDark, trim = cfg.trim || '#fff4d6';
  return `
    <g class="mg-legs">
      <path d="M106 226 C104 250 102 274 104 294 L116 294 C118 274 118 250 118 226 Z" fill="url(#${u}sg)"/>
      <path d="M134 226 C136 250 138 274 136 294 L124 294 C122 274 122 250 122 226 Z" fill="url(#${u}sg)"/>
      <path d="M104 286 L104 300 C104 306 110 308 117 306 L118 286 Z" fill="${dk}"/>
      <path d="M136 286 L136 300 C136 306 130 308 123 306 L122 286 Z" fill="${dk}"/>
      <path d="M105 296 h12 M124 296 h12" stroke="${trim}" stroke-width="1.6" opacity=".7"/>
    </g>
    <!-- skirt / lower dress -->
    <path d="M104 198 C104 198 74 236 68 254 C92 268 148 268 172 254 C166 236 136 198 136 198 Z" fill="${dg}"/>
    <path d="M68 254 C92 268 148 268 172 254 L169 263 C144 276 96 276 71 263 Z" fill="${trim}" opacity=".9"/>
    <path d="M76 240 C100 250 140 250 164 240" stroke="${trim}" stroke-width="2" fill="none" opacity=".55"/>
    <!-- bodice -->
    <path d="M96 142 C92 160 100 188 104 204 L136 204 C140 188 148 160 144 142 C134 136 106 136 96 142 Z" fill="${dg}"/>
    <path d="M104 142 C110 150 130 150 136 142 L132 136 C126 140 114 140 108 136 Z" fill="${trim}" opacity=".85"/>
    <path d="M101 178 C108 183 132 183 139 178 L140 188 C132 192 108 192 100 188 Z" fill="${trim}" opacity=".8"/>
    <circle cx="120" cy="183" r="5.5" fill="${cfg.accent || '#ffe9a8'}"/>
    <circle cx="120" cy="183" r="2.3" fill="#fff8d9"/>
    <!-- sash tails -->
    <path d="M104 196 C96 214 92 234 94 248 L100 246 C100 230 106 212 110 200 Z" fill="${trim}" opacity=".5"/>
    <path d="M136 196 C146 216 148 234 146 246 L140 244 C140 228 134 212 130 200 Z" fill="${trim}" opacity=".5"/>
    <!-- arms -->
    <path d="M97 146 C82 156 76 184 82 208" stroke="${cfg.skin}" stroke-width="10" fill="none" stroke-linecap="round"/>
    <path d="M143 146 C158 156 164 184 158 208" stroke="${cfg.skin}" stroke-width="10" fill="none" stroke-linecap="round"/>
    <path d="M96 146 C88 152 83 168 83 180" stroke="${trim}" stroke-width="8" fill="none" stroke-linecap="round" opacity=".7"/>
    <path d="M144 146 C152 152 157 168 157 180" stroke="${trim}" stroke-width="8" fill="none" stroke-linecap="round" opacity=".7"/>
    <circle cx="82" cy="211" r="6.4" fill="url(#${u}sg)"/>
    <circle cx="158" cy="211" r="6.4" fill="url(#${u}sg)"/>
    <path d="M96 140 C104 134 136 134 144 140" stroke="${trim}" stroke-width="2.5" fill="none" opacity=".7"/>`;
}

function neckHead(cfg, stage, u) {
  if (stage === 1) {
    return `
      <rect x="112" y="168" width="16" height="18" rx="7" fill="${cfg.skinShade || '#edb49c'}"/>
      <circle cx="63" cy="136" r="9" fill="${cfg.skin}"/>
      <circle cx="177" cy="136" r="9" fill="${cfg.skin}"/>
      <circle cx="120" cy="130" r="58" fill="url(#${u}sg)"/>
      <ellipse cx="120" cy="152" rx="34" ry="24" fill="${cfg.skinShade || '#f2bda9'}" opacity=".28"/>`;
  }
  return `
    <path d="M111 122 L113 140 L127 140 L129 122 Z" fill="${cfg.skinShade || '#edb49c'}"/>
    <ellipse cx="120" cy="139" rx="9" ry="5" fill="${cfg.skinShade || '#edb49c'}" opacity=".55"/>
    <circle cx="82" cy="92" r="7" fill="${cfg.skin}"/>
    <circle cx="158" cy="92" r="7" fill="${cfg.skin}"/>
    <circle cx="120" cy="88" r="37" fill="url(#${u}sg)"/>`;
}

/* ─────────────── accessory ─────────────── */

function accessory(cfg, stage, u) {
  const type = cfg.accessory || 'flower';
  const x = stage === 1 ? 76 : 96;
  const y = stage === 1 ? 84 : 58;
  const s = stage === 1 ? 1 : .8;
  if (type === 'flame') {
    return `<g transform="translate(${x} ${y}) scale(${s})">
      <path d="M0 14 C-14 4 -10 -12 2 -20 C0 -8 6 -6 8 -12 C16 0 12 12 4 16 Z" fill="url(#${u}ac)"/>
      <path d="M2 10 C-4 4 -2 -2 3 -7 C4 0 8 3 6 8 Z" fill="#fff3b8" opacity=".85"/>
    </g>`;
  }
  if (type === 'drop') {
    return `<g transform="translate(${x} ${y}) scale(${s})">
      <path d="M0 -18 C8 -6 14 0 14 8 C14 17 7 22 0 22 C-7 22 -14 17 -14 8 C-14 0 -8 -6 0 -18 Z" fill="url(#${u}ac)"/>
      <ellipse cx="-4" cy="6" rx="3.5" ry="5.5" fill="#fff" opacity=".55" transform="rotate(-20 -4 6)"/>
    </g>`;
  }
  if (type === 'star') {
    return `<g transform="translate(${x} ${y}) scale(${s})">
      <path d="M0 -18 L5 -6 L18 -6 L8 2 L12 16 L0 8 L-12 16 L-8 2 L-18 -6 L-5 -6 Z" fill="url(#${u}ac)" stroke="#fff4c2" stroke-width="1.4"/>
      <circle cx="0" cy="-1" r="3" fill="#fff9dd"/>
    </g>`;
  }
  if (type === 'heart') {
    return `<g transform="translate(${x} ${y}) scale(${s})">
      <path d="M0 16 C-18 4 -18 -10 -8 -12 C-3 -13 0 -8 0 -5 C0 -8 3 -13 8 -12 C18 -10 18 4 0 16 Z" fill="url(#${u}ac)"/>
      <circle cx="-6" cy="-4" r="2.4" fill="#fff" opacity=".6"/>
    </g>`;
  }
  if (type === 'crown') {
    return `<g transform="translate(${120} ${y - 18}) scale(${s})">
      <path d="M-20 12 L-22 -6 L-10 0 L0 -14 L10 0 L22 -6 L20 12 Z" fill="url(#${u}ac)" stroke="#fff2b8" stroke-width="1.5"/>
      <circle cx="0" cy="4" r="3.2" fill="#ff9ab0"/>
      <circle cx="-12" cy="6" r="2" fill="#7fd9ff"/>
      <circle cx="12" cy="6" r="2" fill="#7fd9ff"/>
    </g>`;
  }
  // flower
  const petal = cfg.accent || '#ffd166';
  return `<g transform="translate(${x} ${y}) scale(${s})">
    <g fill="${petal}">
      <ellipse cx="0" cy="-9" rx="6" ry="9"/>
      <ellipse cx="8" cy="-3" rx="6" ry="9" transform="rotate(72 8 -3)"/>
      <ellipse cx="5" cy="8" rx="6" ry="9" transform="rotate(144 5 8)"/>
      <ellipse cx="-5" cy="8" rx="6" ry="9" transform="rotate(216 -5 8)"/>
      <ellipse cx="-8" cy="-3" rx="6" ry="9" transform="rotate(288 -8 -3)"/>
    </g>
    <circle cx="0" cy="0" r="5" fill="#fff4bc"/>
    <circle cx="0" cy="0" r="2.2" fill="${cfg.dressDark}"/>
  </g>`;
}

/* ─────────────── main generator ─────────────── */

export function monsterSVG(sp, opts = {}) {
  const stage = opts.stage || sp.stage || 1;
  const cfg = sp.art;
  const u = uid();
  const c = TYPE_COLORS[sp.type] || TYPE_COLORS.Leaf;
  const skin = cfg.skin || '#ffd9c4';
  const skinShade = cfg.skinShade || '#f0b79f';
  const adult = stage > 1;

  const defs = `
    <defs>
      ${gradient(`${u}hg`, cfg.hairLight || cfg.hair, cfg.hairDark || cfg.hair)}
      ${gradient(`${u}dg`, cfg.dress, cfg.dressDark)}
      ${gradient(`${u}sg`, '#fff1e4', skin)}
      ${gradient(`${u}eye`, cfg.eyeLight || cfg.eye, cfg.eye)}
      ${radial(`${u}glow`, c.main, 'transparent')}
      ${gradient(`${u}ac`, cfg.accent || '#ffd166', cfg.accentDeep || cfg.dressDark)}
    </defs>`;

  const glow = `<ellipse cx="120" cy="${adult ? 190 : 190}" rx="98" ry="122" fill="url(#${u}glow)" opacity=".2"/>`;

  const body = adult ? adultBody({ ...cfg, skin }, u) : chibiBody({ ...cfg, skin }, u);
  const hairBack = backHair(cfg, stage, u);
  const head = neckHead({ ...cfg, skin, skinShade }, stage, u);
  const hairFront = frontHair(cfg, stage, u);
  const faceMarkup = face({ ...cfg, skinShade }, stage, u);
  const acc = accessory(cfg, stage, u);

  // extra flourish for evolved forms
  const flourish = adult ? `
    <g opacity=".55">
      <path d="M80 150 C62 170 58 204 64 230" stroke="${cfg.accent || '#ffe9a8'}" stroke-width="1.4" fill="none" stroke-dasharray="3 6"/>
      <path d="M160 150 C178 170 182 204 176 230" stroke="${cfg.accent || '#ffe9a8'}" stroke-width="1.4" fill="none" stroke-dasharray="3 6"/>
    </g>` : '';

  return `<svg viewBox="0 0 240 320" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${sp.name}, ${sp.title}">
    ${defs}
    ${glow}
    ${auraMarkup(sp.type, u, stage)}
    ${flourish}
    ${hairBack}
    ${body}
    ${head}
    ${hairFront}
    ${faceMarkup}
    ${acc}
    <g class="mg-sparkles" opacity=".9">
      <circle cx="88" cy="72" r="1.8" fill="#fff" opacity=".8"/>
      <circle cx="158" cy="118" r="1.4" fill="#fff" opacity=".65"/>
      <circle cx="70" cy="188" r="1.5" fill="${cfg.accent || '#ffe9a8'}" opacity=".7"/>
    </g>
  </svg>`;
}

/* small portrait for dialogue cards */
export function portraitSVG(kind = 'professor') {
  const palettes = {
    professor: { hair: '#9b6b4c', skin: '#f2c6a8', dress: '#7ba986', accent: '#ffd166' },
    mira: { hair: '#f08aad', skin: '#ffd6c2', dress: '#e4678b', accent: '#ffe9a8' },
    rowan: { hair: '#7a5a44', skin: '#e8b496', dress: '#5d8f6c', accent: '#ffcf66' },
    elowen: { hair: '#8d7bd6', skin: '#f4cbb2', dress: '#6b5bb5', accent: '#c8f0ff' },
    queen: { hair: '#3d7d5b', skin: '#f6cfb8', dress: '#2a5c45', accent: '#ffd166' },
    wren: { hair: '#5a4030', skin: '#f4c7a5', dress: '#4fae72', accent: '#ffe9a8' },
    shop: { hair: '#c77a45', skin: '#f5c9a7', dress: '#d7954e', accent: '#fff0c2' },
    villager: { hair: '#7f6a56', skin: '#f0c4a2', dress: '#8aa06a', accent: '#ffe9a8' },
  };
  const p = palettes[kind] || palettes.villager;
  const u = uid();
  return `<svg viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <defs>${gradient(`${u}h`, p.hair, '#4b3427')}${gradient(`${u}s`, '#ffe3d2', p.skin)}</defs>
    <rect width="80" height="80" fill="#d8efd9"/>
    <circle cx="40" cy="86" r="34" fill="${p.dress}"/>
    <circle cx="40" cy="42" r="24" fill="url(#${u}s)"/>
    <path d="M16 42 C14 20 28 10 40 10 C54 10 66 20 64 42 C58 30 52 24 40 24 C28 24 22 30 16 42 Z" fill="url(#${u}h)"/>
    <ellipse cx="32" cy="44" rx="3.2" ry="4" fill="#3a2a2a"/><ellipse cx="48" cy="44" rx="3.2" ry="4" fill="#3a2a2a"/>
    <circle cx="31" cy="42.5" r="1.1" fill="#fff"/><circle cx="47" cy="42.5" r="1.1" fill="#fff"/>
    <path d="M36 53 q4 3 8 0" stroke="#b05f66" stroke-width="1.6" fill="none" stroke-linecap="round"/>
    <circle cx="22" cy="48" r="4" fill="#ff9ab0" opacity=".35"/><circle cx="58" cy="48" r="4" fill="#ff9ab0" opacity=".35"/>
    <path d="M60 26 l4 -6 4 6 6 1 -5 4 2 6 -6 -3 -6 3 2 -6 -5 -4z" fill="${p.accent}" opacity=".9"/>
  </svg>`;
}

export function itemIcon(kind) {
  if (kind === 'orb') return '◉';
  if (kind === 'potion') return '♥';
  if (kind === 'tea') return '☕';
  if (kind === 'coin') return '✦';
  return '◆';
}
