#!/usr/bin/env node
/**
 * Generates local SVG artwork for Fruit Geography themes, UI icons, and boards.
 * Run: node scripts/generate-theme-art.mjs
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

function write(rel, svg) {
  const path = join(root, rel);
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, svg.trim() + '\n');
}

function svg(body, { w = 256, h = 256, defs = '' } = {}) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">
${defs}${body}
</svg>`;
}

function grad(id, c0, c1, c2, cx = '34%', cy = '28%', r = '78%') {
  return `<radialGradient id="${id}" cx="${cx}" cy="${cy}" r="${r}">
  <stop offset="0%" stop-color="${c0}"/>
  <stop offset="52%" stop-color="${c1}"/>
  <stop offset="100%" stop-color="${c2}"/>
</radialGradient>`;
}

function shine(cx, cy, rx, ry, o = 0.38) {
  return `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="#fff" opacity="${o}"/>`;
}

function leaf(x, y, rot = -28, sx = 1, fill = '#4d7c0f', stroke = '#3f6212') {
  return `<g transform="translate(${x} ${y}) rotate(${rot}) scale(${sx})">
  <ellipse cx="0" cy="0" rx="22" ry="11" fill="${fill}" stroke="${stroke}" stroke-width="1.5"/>
  <path d="M-16 0 Q0 -2 16 0" fill="none" stroke="#d9f99d" stroke-width="1.4" opacity=".7"/>
</g>`;
}

function stem(x1, y1, x2, y2, w = 5, color = '#3f6212') {
  return `<path d="M${x1} ${y1} Q${(x1 + x2) / 2} ${(y1 + y2) / 2 - 8} ${x2} ${y2}" fill="none" stroke="${color}" stroke-width="${w}" stroke-linecap="round"/>`;
}

function neonWrap(inner, color, extraDefs = '') {
  return svg(
    `<circle cx="128" cy="132" r="108" fill="${color}" opacity=".16"/>
<circle cx="128" cy="132" r="100" fill="none" stroke="${color}" stroke-width="5" opacity=".55"/>
<g filter="url(#glow)">${inner}</g>`,
    {
      defs: `<defs>
  <filter id="glow" x="-30%" y="-30%" width="160%" height="160%">
    <feGaussianBlur stdDeviation="3.2" result="b"/>
    <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
  </filter>
  ${extraDefs}
</defs>`,
    },
  );
}

/* ---------------- Classic fruit ---------------- */

function cherryPair(p) {
  const { a, b, c, stem: st = '#3f6212' } = p;
  return `<defs>${grad('c1', a, b, c)}${grad('c2', a, b, c, '40%', '30%')}</defs>
${stem(128, 38, 92, 92, 5, st)}
${stem(128, 38, 164, 96, 5, st)}
${leaf(142, 44, 24, 0.85)}
<circle cx="92" cy="150" r="52" fill="url(#c1)" stroke="${c}" stroke-width="3"/>
${shine(74, 128, 16, 10, 0.45)}
<circle cx="164" cy="154" r="50" fill="url(#c2)" stroke="${c}" stroke-width="3"/>
${shine(148, 132, 15, 9, 0.42)}`;
}

function strawberry(p) {
  const { a, b, c } = p;
  return `<defs>${grad('s', a, b, c)}
  <clipPath id="sc"><path d="M128 58c28-2 62 22 66 58 6 52-30 96-66 112C92 212 56 168 62 116 66 80 100 56 128 58z"/></clipPath>
</defs>
<path d="M128 58c28-2 62 22 66 58 6 52-30 96-66 112C92 212 56 168 62 116 66 80 100 56 128 58z" fill="url(#s)" stroke="${c}" stroke-width="3"/>
<g clip-path="url(#sc)" fill="#fde68a">
  <ellipse cx="108" cy="110" rx="4" ry="6"/><ellipse cx="148" cy="118" rx="4" ry="6"/>
  <ellipse cx="124" cy="142" rx="4" ry="6"/><ellipse cx="96" cy="148" rx="3.5" ry="5.5"/>
  <ellipse cx="156" cy="150" rx="3.5" ry="5.5"/><ellipse cx="118" cy="174" rx="4" ry="6"/>
  <ellipse cx="142" cy="178" rx="3.5" ry="5.5"/><ellipse cx="132" cy="204" rx="3.2" ry="5"/>
</g>
<path d="M86 70c14-18 28-24 42-12 12-20 30-22 46-8 2 22-10 34-24 40-16 4-28-2-40 4-12-10-22-16-24-24z" fill="#3f6212"/>
<path d="M104 52c8 6 16 8 24 6" fill="none" stroke="#84cc16" stroke-width="2"/>
${shine(108, 100, 14, 8, 0.35)}`;
}

function blueberry(p) {
  const { a, b, c } = p;
  return `<defs>${grad('b', a, b, c)}</defs>
<circle cx="128" cy="138" r="78" fill="url(#b)" stroke="${c}" stroke-width="3"/>
<path d="M128 78l8 14 16 2-12 10 3 16-15-8-15 8 3-16-12-10 16-2z" fill="#1e3a8a" opacity=".55"/>
<path d="M118 86c6-8 16-10 24-2" fill="none" stroke="#93c5fd" stroke-width="3" stroke-linecap="round"/>
${shine(100, 112, 22, 12, 0.32)}`;
}

function grape(p) {
  const { a, b, c } = p;
  const berries = [
    [128, 96, 28],
    [100, 118, 27],
    [156, 118, 27],
    [86, 150, 26],
    [128, 148, 30],
    [170, 150, 26],
    [108, 180, 27],
    [148, 182, 27],
    [128, 208, 24],
  ];
  return `<defs>${grad('g', a, b, c)}</defs>
${leaf(168, 72, 18, 1.05, '#65a30d')}
${stem(128, 58, 128, 78, 6)}
${berries
  .map(
    ([x, y, r], i) =>
      `<circle cx="${x}" cy="${y}" r="${r}" fill="url(#g)" stroke="${c}" stroke-width="2.2" opacity="${0.92 + (i % 3) * 0.02}"/>${shine(x - 8, y - 10, 7, 4, 0.3)}`,
  )
  .join('\n')}`;
}

function citrus(p, { dimple = true } = {}) {
  const { a, b, c } = p;
  return `<defs>${grad('f', a, b, c)}</defs>
<circle cx="128" cy="136" r="86" fill="url(#f)" stroke="${c}" stroke-width="3"/>
${dimple ? `<ellipse cx="128" cy="128" rx="10" ry="6" fill="${c}" opacity=".25"/>` : ''}
${shine(96, 108, 24, 14, 0.36)}
${stem(128, 50, 128, 56, 6)}
${leaf(146, 54, 32, 0.8)}`;
}

function apple(p) {
  const { a, b, c } = p;
  return `<defs>${grad('a', a, b, c)}</defs>
<path d="M128 58c22-18 52-8 66 18 18 34 18 78 4 112-10 26-36 46-70 48-34-2-60-22-70-48-14-34-14-78 4-112C76 50 106 40 128 58z" fill="url(#a)" stroke="${c}" stroke-width="3"/>
<path d="M128 70c0 28 0 70 0 110" fill="none" stroke="${c}" stroke-width="3" opacity=".28"/>
${stem(128, 46, 136, 28, 5, '#44403c')}
${leaf(154, 40, 20, 0.95)}
${shine(98, 100, 22, 13, 0.4)}`;
}

function pear(p) {
  const { a, b, c } = p;
  return `<defs>${grad('p', a, b, c, '36%', '24%', '85%')}</defs>
<path d="M128 46c28 4 42 28 42 52 0 18-8 32-8 46 0 44 24 78 8 104-10 18-28 26-42 26s-32-8-42-26c-16-26 8-60 8-104 0-14-8-28-8-46 0-24 14-48 42-52z" fill="url(#p)" stroke="${c}" stroke-width="3"/>
${stem(128, 44, 132, 26, 5, '#44403c')}
${leaf(150, 36, 28, 0.85)}
${shine(108, 86, 16, 10, 0.38)}`;
}

function peach(p) {
  const { a, b, c } = p;
  return `<defs>${grad('h', a, b, c)}</defs>
<path d="M132 60c40-8 78 24 80 70 2 52-30 100-78 110-48-8-86-54-84-108 2-44 38-80 82-72z" fill="url(#h)" stroke="${c}" stroke-width="3"/>
<path d="M128 78c8 28 10 70 2 118" fill="none" stroke="${c}" stroke-width="3" opacity=".35"/>
${stem(132, 56, 140, 34, 5, '#44403c')}
${leaf(158, 42, 16, 0.9, '#65a30d')}
${shine(104, 104, 22, 12, 0.34)}`;
}

function pineapple(p) {
  const { a, b, c } = p;
  const diamonds = [];
  for (let row = 0; row < 7; row++) {
    for (let col = 0; col < 5; col++) {
      const x = 78 + col * 26 + (row % 2) * 13;
      const y = 96 + row * 18;
      diamonds.push(
        `<path d="M${x} ${y - 10} L${x + 12} ${y} L${x} ${y + 10} L${x - 12} ${y}Z" fill="${row % 2 ? a : b}" stroke="${c}" stroke-width="1.1"/>`,
      );
    }
  }
  return `<defs>
  <clipPath id="pn"><ellipse cx="128" cy="158" rx="62" ry="78"/></clipPath>
</defs>
<g fill="#3f6212">
  ${[0, 1, 2, 3, 4, 5, 6]
    .map((i) => {
      const rot = -42 + i * 14;
      return `<path transform="translate(128 70) rotate(${rot})" d="M0 0 C8 -38 4 -62 0 -78 C-4 -62 -8 -38 0 0Z"/>`;
    })
    .join('')}
</g>
<ellipse cx="128" cy="158" rx="62" ry="78" fill="${b}" stroke="${c}" stroke-width="3"/>
<g clip-path="url(#pn)">${diamonds.join('')}</g>
${shine(108, 128, 14, 20, 0.22)}`;
}

function watermelon(p) {
  const { a, b, c, stripe = '#14532d' } = p;
  return `<defs>${grad('w', a, b, c)}
  <clipPath id="wm"><circle cx="128" cy="132" r="90"/></clipPath>
</defs>
<circle cx="128" cy="132" r="90" fill="url(#w)" stroke="${c}" stroke-width="4"/>
<g clip-path="url(#wm)" fill="${stripe}" opacity=".55">
  <ellipse cx="70" cy="132" rx="16" ry="90"/>
  <ellipse cx="110" cy="132" rx="14" ry="90"/>
  <ellipse cx="148" cy="132" rx="14" ry="90"/>
  <ellipse cx="188" cy="132" rx="16" ry="90"/>
</g>
${shine(96, 100, 24, 14, 0.28)}`;
}

const classic = {
  cherry: { a: '#fb7185', b: '#e11d48', c: '#9f1239' },
  strawberry: { a: '#fda4af', b: '#f43f5e', c: '#be123c' },
  blueberry: { a: '#93c5fd', b: '#2563eb', c: '#1e3a8a' },
  grape: { a: '#c4b5fd', b: '#7c3aed', c: '#5b21b6' },
  lime: { a: '#d9f99d', b: '#84cc16', c: '#3f6212' },
  orange: { a: '#fed7aa', b: '#fb923c', c: '#c2410c' },
  apple: { a: '#fca5a5', b: '#ef4444', c: '#b91c1c' },
  pear: { a: '#d9f99d', b: '#a3e635', c: '#4d7c0f' },
  peach: { a: '#fecdd3', b: '#fb7185', c: '#e11d48' },
  pineapple: { a: '#fde68a', b: '#f59e0b', c: '#b45309' },
  watermelon: { a: '#86efac', b: '#22c55e', c: '#166534', stripe: '#14532d' },
};

const night = {
  cherry: { a: '#fb7185', b: '#9f1239', c: '#4c0519', glow: '#fb7185' },
  strawberry: { a: '#fda4af', b: '#be123c', c: '#4c0519', glow: '#fb7185' },
  blueberry: { a: '#67e8f9', b: '#1d4ed8', c: '#082f49', glow: '#22d3ee' },
  grape: { a: '#e879f9', b: '#6b21a8', c: '#3b0764', glow: '#e879f9' },
  lime: { a: '#d9f99d', b: '#3f6212', c: '#14532d', glow: '#a3e635' },
  orange: { a: '#fdba74', b: '#c2410c', c: '#7c2d12', glow: '#fb923c' },
  apple: { a: '#fca5a5', b: '#b91c1c', c: '#450a0a', glow: '#fb7185' },
  pear: { a: '#bef264', b: '#3f6212', c: '#1a2e05', glow: '#a3e635' },
  peach: { a: '#f9a8d4', b: '#9d174d', c: '#500724', glow: '#f9a8d4' },
  pineapple: { a: '#fde68a', b: '#b45309', c: '#451a03', glow: '#facc15' },
  watermelon: { a: '#5eead4', b: '#0f766e', c: '#042f2e', stripe: '#134e4a', glow: '#5eead4' },
};

const classicBody = {
  cherry: () => cherryPair(classic.cherry),
  strawberry: () => strawberry(classic.strawberry),
  blueberry: () => blueberry(classic.blueberry),
  grape: () => grape(classic.grape),
  lime: () => citrus(classic.lime),
  orange: () => citrus(classic.orange, { dimple: false }),
  apple: () => apple(classic.apple),
  pear: () => pear(classic.pear),
  peach: () => peach(classic.peach),
  pineapple: () => pineapple(classic.pineapple),
  watermelon: () => watermelon(classic.watermelon),
};

const nightBody = {
  cherry: () => cherryPair(night.cherry),
  strawberry: () => strawberry(night.strawberry),
  blueberry: () => blueberry(night.blueberry),
  grape: () => grape(night.grape),
  lime: () => citrus(night.lime),
  orange: () => citrus(night.orange, { dimple: false }),
  apple: () => apple(night.apple),
  pear: () => pear(night.pear),
  peach: () => peach(night.peach),
  pineapple: () => pineapple(night.pineapple),
  watermelon: () => watermelon(night.watermelon),
};

for (const [name, fn] of Object.entries(classicBody)) {
  write(`src/assets/themes/classic/${name}.svg`, svg(fn(), { defs: '<defs/>' }).replace('<defs/>', ''));
}

for (const [name, fn] of Object.entries(nightBody)) {
  const glow = night[name].glow;
  write(`src/assets/themes/night/${name}.svg`, neonWrap(fn(), glow));
}

/* ---------------- Tropical ---------------- */

function berry() {
  return svg(`<defs>${grad('r', '#fda4af', '#e11d48', '#9f1239')}</defs>
  <circle cx="128" cy="142" r="70" fill="url(#r)" stroke="#9f1239" stroke-width="3"/>
  <g fill="#be123c" opacity=".35">
    <circle cx="108" cy="128" r="16"/><circle cx="140" cy="122" r="15"/>
    <circle cx="118" cy="156" r="17"/><circle cx="148" cy="152" r="16"/>
  </g>
  ${stem(128, 72, 128, 78, 5)}
  ${leaf(146, 74, 30, 0.7)}
  ${shine(104, 118, 16, 10, 0.4)}`);
}

function starfruit() {
  return svg(`<defs>${grad('sf', '#fef08a', '#facc15', '#ca8a04')}</defs>
  <path d="M128 42 L148 98 L210 104 L162 144 L176 206 L128 172 L80 206 L94 144 L46 104 L108 98Z" fill="url(#sf)" stroke="#a16207" stroke-width="3"/>
  <path d="M128 78 L138 110 L172 114 L146 136 L154 170 L128 152 L102 170 L110 136 L84 114 L118 110Z" fill="#fde68a" opacity=".55"/>
  ${shine(116, 100, 14, 8, 0.4)}`);
}

function kiwi() {
  return svg(`<defs>${grad('k', '#a3e635', '#65a30d', '#3f6212')}
    ${grad('skin', '#a8a29e', '#78716c', '#44403c')}
  </defs>
  <circle cx="128" cy="132" r="88" fill="url(#skin)" stroke="#44403c" stroke-width="3"/>
  <circle cx="128" cy="132" r="68" fill="url(#k)"/>
  <circle cx="128" cy="132" r="16" fill="#fef9c3"/>
  <g fill="#1c1917">
    ${Array.from({ length: 14 }, (_, i) => {
      const a = (i / 14) * Math.PI * 2;
      return `<circle cx="${128 + Math.cos(a) * 28}" cy="${132 + Math.sin(a) * 28}" r="3.2"/>`;
    }).join('')}
  </g>
  ${shine(100, 108, 18, 10, 0.25)}`);
}

function passion() {
  return svg(`<defs>${grad('ps', '#c4b5fd', '#7c3aed', '#4c1d95')}
    ${grad('pulp', '#fdba74', '#f97316', '#c2410c')}
  </defs>
  <circle cx="128" cy="132" r="88" fill="url(#ps)" stroke="#4c1d95" stroke-width="3"/>
  <circle cx="128" cy="132" r="54" fill="url(#pulp)"/>
  <g fill="#1c1917">
    ${Array.from({ length: 10 }, (_, i) => {
      const a = (i / 10) * Math.PI * 2;
      return `<circle cx="${128 + Math.cos(a) * 18}" cy="${132 + Math.sin(a) * 18}" r="4"/>`;
    }).join('')}
  </g>
  ${shine(100, 104, 20, 12, 0.32)}`);
}

function mango() {
  return svg(`<defs>${grad('m', '#fde68a', '#fb923c', '#dc2626')}</defs>
  <path d="M150 52c36 8 62 48 58 92-4 52-36 100-86 104-46 4-78-28-84-70-6-40 14-78 48-96 20-12 40-16 64-30z" fill="url(#m)" stroke="#c2410c" stroke-width="3"/>
  ${stem(148, 56, 156, 36, 5, '#3f6212')}
  ${leaf(172, 44, 24, 0.9)}
  ${shine(120, 100, 20, 12, 0.35)}`);
}

function banana() {
  return svg(`<defs>${grad('bn', '#fef08a', '#facc15', '#ca8a04')}</defs>
  <path d="M64 70c8-18 28-28 48-22 36 10 70 38 96 70 22 28 36 62 22 86-8 14-26 16-40 8-28-16-54-44-86-70C78 122 56 102 64 70z" fill="url(#bn)" stroke="#a16207" stroke-width="3"/>
  <path d="M86 86c30 22 70 58 102 96" fill="none" stroke="#fde68a" stroke-width="3" opacity=".45"/>
  <path d="M70 64c8-6 16-8 22-6" fill="#a3e635" stroke="#3f6212" stroke-width="1.5"/>
  ${shine(110, 96, 18, 8, 0.35)}`);
}

function dragonfruit() {
  return svg(`<defs>${grad('d', '#fda4af', '#db2777', '#9d174d')}</defs>
  <circle cx="128" cy="136" r="78" fill="url(#d)" stroke="#9d174d" stroke-width="3"/>
  ${[0, 40, 80, 120, 160, 200, 240, 280, 320]
    .map((deg) => `<path transform="translate(128 136) rotate(${deg})" d="M0 -70 C12 -92 6 -108 0 -118 C-6 -108 -12 -92 0 -70Z" fill="#65a30d" stroke="#3f6212" stroke-width="1.2"/>`)
    .join('')}
  ${shine(104, 112, 18, 10, 0.4)}`);
}

function papaya() {
  return svg(`<defs>${grad('pa', '#fed7aa', '#fb923c', '#c2410c')}
    ${grad('flesh', '#fdba74', '#f97316', '#ea580c')}
  </defs>
  <ellipse cx="128" cy="132" rx="70" ry="92" fill="url(#pa)" stroke="#c2410c" stroke-width="3"/>
  <ellipse cx="128" cy="132" rx="38" ry="58" fill="url(#flesh)"/>
  <g fill="#1c1917">
    ${Array.from({ length: 9 }, (_, i) => `<circle cx="${120 + (i % 3) * 10}" cy="${110 + Math.floor(i / 3) * 16}" r="4"/>`).join('')}
  </g>
  ${shine(104, 96, 16, 12, 0.3)}`);
}

function coconut() {
  return svg(`<defs>${grad('co', '#d6d3d1', '#78716c', '#44403c')}
    ${grad('meat', '#fff', '#f5f5f4', '#d6d3d1')}
  </defs>
  <ellipse cx="118" cy="140" rx="74" ry="70" fill="url(#co)" stroke="#292524" stroke-width="3"/>
  <path d="M118 72 A74 70 0 0 1 190 140 L118 140Z" fill="url(#meat)" stroke="#a8a29e" stroke-width="2"/>
  <g fill="#1c1917">
    <circle cx="96" cy="118" r="6"/><circle cx="84" cy="140" r="5.5"/><circle cx="100" cy="156" r="5"/>
  </g>
  ${shine(150, 110, 14, 10, 0.2)}`);
}

write('src/assets/themes/tropical/berry.svg', berry());
write('src/assets/themes/tropical/starfruit.svg', starfruit());
write('src/assets/themes/tropical/kiwi.svg', kiwi());
write('src/assets/themes/tropical/passion.svg', passion());
write('src/assets/themes/tropical/mango.svg', mango());
write('src/assets/themes/tropical/banana.svg', banana());
write('src/assets/themes/tropical/dragonfruit.svg', dragonfruit());
write('src/assets/themes/tropical/papaya.svg', papaya());
write('src/assets/themes/tropical/coconut.svg', coconut());
write(
  'src/assets/themes/tropical/pineapple.svg',
  svg(pineapple({ a: '#fde68a', b: '#eab308', c: '#a16207' })),
);
write(
  'src/assets/themes/tropical/watermelon.svg',
  svg(watermelon({ a: '#86efac', b: '#22c55e', c: '#166534', stripe: '#14532d' })),
);

/* ---------------- Sports ---------------- */

function ballBase(id, c0, c1, c2, stroke) {
  return `<defs>${grad(id, c0, c1, c2)}</defs>
  <circle cx="128" cy="128" r="92" fill="url(#${id})" stroke="${stroke}" stroke-width="4"/>
  ${shine(96, 96, 26, 16, 0.34)}`;
}

write(
  'src/assets/themes/sports/pingpong.svg',
  svg(`${ballBase('pp', '#fdba74', '#f97316', '#c2410c', '#9a3412')}
  <path d="M86 96c28-18 62-10 84 12" fill="none" stroke="#fff" stroke-width="3" opacity=".35"/>`),
);

write(
  'src/assets/themes/sports/golf.svg',
  svg(`${ballBase('gf', '#f8fafc', '#e2e8f0', '#94a3b8', '#64748b')}
  <g fill="none" stroke="#94a3b8" stroke-width="1.4" opacity=".55">
    ${Array.from({ length: 18 }, (_, i) => {
      const col = i % 6;
      const row = Math.floor(i / 6);
      const x = 80 + col * 20 + (row % 2) * 10;
      const y = 92 + row * 22;
      return `<circle cx="${x}" cy="${y}" r="7"/>`;
    }).join('')}
  </g>`),
);

write(
  'src/assets/themes/sports/eightball.svg',
  svg(`${ballBase('eb', '#334155', '#0f172a', '#020617', '#020617')}
  <circle cx="128" cy="118" r="38" fill="#fff"/>
  <text x="128" y="132" text-anchor="middle" font-size="42" font-family="Trebuchet MS, sans-serif" font-weight="800" fill="#0f172a">8</text>`),
);

write(
  'src/assets/themes/sports/tennis.svg',
  svg(`${ballBase('tn', '#d9f99d', '#a3e635', '#65a30d', '#ffffff')}
  <path d="M52 96c46 28 46 92 4 128" fill="none" stroke="#fff" stroke-width="8"/>
  <path d="M204 96c-46 28-46 92-4 128" fill="none" stroke="#fff" stroke-width="8"/>`),
);

write(
  'src/assets/themes/sports/baseball.svg',
  svg(`${ballBase('bb', '#fff7ed', '#f8fafc', '#e2e8f0', '#cbd5e1')}
  <path d="M64 80c40 28 40 88 0 128" fill="none" stroke="#ef4444" stroke-width="4"/>
  <path d="M192 80c-40 28-40 88 0 128" fill="none" stroke="#ef4444" stroke-width="4"/>
  <g stroke="#ef4444" stroke-width="2">
    <path d="M68 100l8 6M70 120l9 4M74 140l9 2M80 160l8-2"/>
    <path d="M188 100l-8 6M186 120l-9 4M182 140l-9 2M176 160l-8-2"/>
  </g>`),
);

write(
  'src/assets/themes/sports/bowling.svg',
  svg(`${ballBase('bw', '#c4b5fd', '#7c3aed', '#4c1d95', '#2e1065')}
  <g fill="#1e1b4b">
    <circle cx="108" cy="100" r="12"/><circle cx="136" cy="90" r="12"/><circle cx="146" cy="116" r="13"/>
  </g>
  <g fill="#a78bfa" opacity=".35">
    <circle cx="104" cy="96" r="4"/><circle cx="132" cy="86" r="4"/>
  </g>`),
);

write(
  'src/assets/themes/sports/football.svg',
  svg(`<defs>${grad('fb', '#d6a07a', '#92400e', '#451a03')}</defs>
  <ellipse cx="128" cy="128" rx="108" ry="62" fill="url(#fb)" stroke="#431407" stroke-width="4"/>
  <path d="M40 128c30-18 50-22 88-22s58 4 88 22" fill="none" stroke="#fff7ed" stroke-width="6"/>
  <path d="M40 128c30 18 50 22 88 22s58-4 88-22" fill="none" stroke="#fff7ed" stroke-width="6"/>
  <path d="M92 128h72" stroke="#fff" stroke-width="6" stroke-linecap="round"/>
  ${[0, 1, 2, 3, 4].map((i) => `<path d="M${100 + i * 14} 116v24" stroke="#fff" stroke-width="4" stroke-linecap="round"/>`).join('')}
  ${shine(96, 108, 22, 10, 0.28)}`),
);

write(
  'src/assets/themes/sports/volleyball.svg',
  svg(`${ballBase('vb', '#fff7ed', '#fef3c7', '#e2e8f0', '#f97316')}
  <g fill="none" stroke="#2563eb" stroke-width="5">
    <path d="M128 36c28 32 40 72 40 92 0 40-18 70-40 92"/>
    <path d="M128 36c-28 32-40 72-40 92 0 40 18 70 40 92"/>
    <path d="M48 100c28 18 52 28 80 28s52-10 80-28"/>
  </g>
  <g fill="none" stroke="#eab308" stroke-width="4">
    <path d="M56 168c24-8 48-12 72-12s48 4 72 12"/>
  </g>`),
);

write(
  'src/assets/themes/sports/basketball.svg',
  svg(`${ballBase('bk', '#fdba74', '#ea580c', '#9a3412', '#1c1917')}
  <g fill="none" stroke="#1c1917" stroke-width="5">
    <path d="M128 36v184"/><path d="M36 128h184"/>
    <path d="M52 64c40 28 112 28 152 0"/>
    <path d="M52 192c40-28 112-28 152 0"/>
  </g>`),
);

write(
  'src/assets/themes/sports/soccer.svg',
  svg(`${ballBase('sc', '#f8fafc', '#e2e8f0', '#cbd5e1', '#0f172a')}
  <path d="M128 86l22 16-8 26h-28l-8-26z" fill="#0f172a"/>
  <g fill="none" stroke="#0f172a" stroke-width="4">
    <path d="M142 102l34-8M178 118l18 28M150 128l12 36M106 128l-12 36M78 118l-18 28M114 102l-34-8"/>
    <circle cx="128" cy="128" r="70"/>
  </g>`),
);

write(
  'src/assets/themes/sports/trophy.svg',
  svg(`<defs>${grad('tr', '#fef08a', '#eab308', '#92400e')}</defs>
  <circle cx="128" cy="128" r="92" fill="url(#tr)" stroke="#854d0e" stroke-width="5"/>
  <path d="M128 78l18 14-6 22h-24l-6-22z" fill="#854d0e"/>
  <g fill="none" stroke="#854d0e" stroke-width="4">
    <path d="M140 92l30-6M170 108l16 24M146 114l10 32M110 114l-10 32M86 108l-16 24M116 92l-30-6"/>
    <circle cx="128" cy="128" r="58"/>
  </g>
  <path d="M128 168l8 16h-16z" fill="#fef08a"/>
  ${shine(100, 96, 22, 12, 0.45)}`),
);

/* ---------------- Drinks ---------------- */

write(
  'src/assets/themes/drinks/ice.svg',
  svg(`<defs>
    <linearGradient id="ice" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#e0f2fe" stop-opacity=".95"/>
      <stop offset="100%" stop-color="#38bdf8" stop-opacity=".55"/>
    </linearGradient>
  </defs>
  <g transform="translate(128 128)">
    <path d="M0 -70 L72 -28 L72 36 L0 78 L-72 36 L-72 -28Z" fill="url(#ice)" stroke="#7dd3fc" stroke-width="3"/>
    <path d="M0 -70 L0 8 L72 -28" fill="#fff" opacity=".28"/>
    <path d="M0 8 L-72 -28 L0 -70" fill="#38bdf8" opacity=".2"/>
    <path d="M-20 -8 L8 -22 M-8 20 L24 6" stroke="#fff" stroke-width="3" opacity=".55" stroke-linecap="round"/>
  </g>`),
);

write(
  'src/assets/themes/drinks/olive.svg',
  svg(`<defs>${grad('ol', '#bef264', '#65a30d', '#3f6212')}</defs>
  <ellipse cx="128" cy="132" rx="78" ry="58" fill="url(#ol)" stroke="#365314" stroke-width="3"/>
  <ellipse cx="128" cy="132" rx="22" ry="16" fill="#e11d48"/>
  <ellipse cx="128" cy="132" rx="8" ry="6" fill="#fecaca"/>
  ${shine(100, 112, 18, 10, 0.35)}`),
);

write(
  'src/assets/themes/drinks/shot.svg',
  svg(`<defs>${grad('sh', '#fde68a', '#f59e0b', '#b45309')}</defs>
  <path d="M88 70h80v20H88z" fill="none" stroke="#e5e7eb" stroke-width="5"/>
  <rect x="92" y="96" width="72" height="92" rx="8" fill="url(#sh)" stroke="rgba(255,255,255,.45)" stroke-width="4"/>
  <rect x="92" y="70" width="72" height="118" rx="10" fill="none" stroke="#f8fafc" stroke-width="4"/>
  ${shine(108, 118, 8, 22, 0.28)}`),
);

write(
  'src/assets/themes/drinks/wine.svg',
  svg(`<defs>${grad('wn', '#fb7185', '#9f1239', '#4c0519')}</defs>
  <path d="M86 52h84l-18 78c-4 28-22 40-40 40s-36-12-40-40z" fill="none" stroke="#e5e7eb" stroke-width="4"/>
  <path d="M96 70h64l-12 52c-3 20-16 30-32 30s-29-10-32-30z" fill="url(#wn)"/>
  <path d="M128 168v40" stroke="#e5e7eb" stroke-width="5"/>
  <path d="M104 208h48" stroke="#e5e7eb" stroke-width="6" stroke-linecap="round"/>
  ${shine(110, 86, 8, 16, 0.3)}`),
);

write(
  'src/assets/themes/drinks/martini.svg',
  svg(`<path d="M64 64h128L128 150Z" fill="none" stroke="#e5e7eb" stroke-width="4"/>
  <path d="M78 72h100L128 138Z" fill="#e5e7eb" opacity=".55"/>
  <path d="M128 150v48" stroke="#e5e7eb" stroke-width="5"/>
  <path d="M106 198h44" stroke="#e5e7eb" stroke-width="6" stroke-linecap="round"/>
  <path d="M128 92l36-8" stroke="#d6d3d1" stroke-width="3"/>
  <circle cx="170" cy="80" r="10" fill="#4d7c0f"/>
  <circle cx="170" cy="80" r="3.5" fill="#e11d48"/>
  ${shine(104, 86, 10, 8, 0.4)}`),
);

write(
  'src/assets/themes/drinks/whiskey.svg',
  svg(`<defs>${grad('wk', '#fdba74', '#b45309', '#78350f')}</defs>
  <rect x="68" y="78" width="120" height="112" rx="16" fill="none" stroke="#e5e7eb" stroke-width="5"/>
  <rect x="74" y="118" width="108" height="66" rx="8" fill="url(#wk)"/>
  <g fill="#e0f2fe" opacity=".7">
    <rect x="92" y="128" width="28" height="26" rx="4" transform="rotate(-12 106 141)"/>
    <rect x="128" y="136" width="26" height="24" rx="4" transform="rotate(8 141 148)"/>
  </g>
  ${shine(90, 96, 8, 20, 0.28)}`),
);

write(
  'src/assets/themes/drinks/cocktail.svg',
  svg(`<defs>${grad('ck', '#fdba74', '#fb923c', '#c2410c')}</defs>
  <path d="M96 46c-8 0-16 70-16 110 0 28 20 48 48 48s48-20 48-48c0-40-8-110-16-110z" fill="none" stroke="#e5e7eb" stroke-width="4"/>
  <path d="M92 86h72c2 24 4 52-4 74-6 18-20 28-32 28s-26-10-32-28c-8-22-6-50-4-74z" fill="url(#ck)"/>
  <path d="M148 58c18-16 36-8 42 6" fill="none" stroke="#fb7185" stroke-width="3"/>
  <path d="M186 52l18-16M186 52l16 4M186 52l8 18" stroke="#f59e0b" stroke-width="3" stroke-linecap="round"/>
  <rect x="124" y="40" width="6" height="70" rx="3" fill="#e5e7eb"/>
  ${shine(108, 100, 8, 18, 0.28)}`),
);

write(
  'src/assets/themes/drinks/margarita.svg',
  svg(`<defs>${grad('mg', '#d9f99d', '#84cc16', '#4d7c0f')}</defs>
  <path d="M60 70h136L148 150c-4 16-12 22-20 22h0c-8 0-16-6-20-22z" fill="none" stroke="#e5e7eb" stroke-width="4"/>
  <path d="M78 82h100L140 142c-3 12-8 16-12 16s-9-4-12-16z" fill="url(#mg)"/>
  <path d="M60 70h136" stroke="#f8fafc" stroke-width="8" stroke-linecap="round"/>
  <path d="M128 172v28" stroke="#e5e7eb" stroke-width="5"/>
  <path d="M108 200h40" stroke="#e5e7eb" stroke-width="6" stroke-linecap="round"/>
  <circle cx="168" cy="64" r="10" fill="#84cc16"/>
  ${shine(100, 96, 10, 10, 0.3)}`),
);

write(
  'src/assets/themes/drinks/mojito.svg',
  svg(`<defs>${grad('mo', '#ecfccb', '#86efac', '#22c55e')}</defs>
  <rect x="86" y="48" width="84" height="156" rx="12" fill="none" stroke="#e5e7eb" stroke-width="4"/>
  <rect x="90" y="88" width="76" height="110" rx="8" fill="url(#mo)"/>
  <g fill="#4d7c0f">
    <ellipse cx="118" cy="72" rx="14" ry="8" transform="rotate(-20 118 72)"/>
    <ellipse cx="140" cy="68" rx="16" ry="8" transform="rotate(18 140 68)"/>
    <ellipse cx="128" cy="84" rx="12" ry="7"/>
  </g>
  <g fill="#fef08a">
    <path d="M100 120l8 12 8-12z"/><path d="M132 136l8 12 8-12z"/>
  </g>
  <rect x="150" y="44" width="5" height="90" rx="2" fill="#e5e7eb"/>
  ${shine(100, 108, 7, 24, 0.28)}`),
);

write(
  'src/assets/themes/drinks/champagne.svg',
  svg(`<defs>${grad('ch', '#fef9c3', '#facc15', '#ca8a04')}</defs>
  <path d="M108 36h40v28c0 10-6 18-8 28l12 132c2 16-10 28-24 28s-26-12-24-28l12-132c-2-10-8-18-8-28z" fill="none" stroke="#e5e7eb" stroke-width="4"/>
  <path d="M116 92h24l10 120c1 10-6 18-16 18s-17-8-16-18z" fill="url(#ch)"/>
  <g fill="#fde68a" opacity=".8">
    <circle cx="124" cy="140" r="3"/><circle cx="136" cy="160" r="2.5"/><circle cx="128" cy="184" r="3"/><circle cx="134" cy="120" r="2"/>
  </g>
  ${shine(118, 110, 6, 18, 0.35)}`),
);

write(
  'src/assets/themes/drinks/bottle.svg',
  svg(`<defs>${grad('bt', '#86efac', '#166534', '#052e16')}
    <linearGradient id="foil" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#fde68a"/><stop offset="100%" stop-color="#ca8a04"/>
    </linearGradient>
  </defs>
  <rect x="114" y="28" width="28" height="36" rx="6" fill="url(#foil)"/>
  <rect x="118" y="60" width="20" height="48" rx="6" fill="url(#bt)"/>
  <rect x="88" y="104" width="80" height="124" rx="22" fill="url(#bt)" stroke="#14532d" stroke-width="3"/>
  <rect x="104" y="128" width="48" height="54" rx="6" fill="#fef3c7" opacity=".85"/>
  <path d="M112 148h32M118 160h20" stroke="#166534" stroke-width="3" stroke-linecap="round"/>
  ${shine(102, 120, 8, 28, 0.22)}`),
);

/* ---------------- Backgrounds ---------------- */

write(
  'src/assets/themes/classic/bg.svg',
  svg(
    `<defs>
      <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#fff7ed"/>
        <stop offset="55%" stop-color="#ffedd5"/>
        <stop offset="100%" stop-color="#fed7aa"/>
      </linearGradient>
      <pattern id="grid" width="28" height="28" patternUnits="userSpaceOnUse">
        <path d="M28 0H0V28" fill="none" stroke="#d97706" stroke-width="1"/>
      </pattern>
    </defs>
    <rect width="720" height="1040" fill="url(#sky)"/>
    <rect width="720" height="1040" fill="url(#grid)" opacity=".07"/>
    <ellipse cx="120" cy="80" rx="90" ry="36" fill="#fff" opacity=".28"/>
    <ellipse cx="560" cy="120" rx="110" ry="40" fill="#fff" opacity=".2"/>`,
    { w: 720, h: 1040 },
  ),
);

write(
  'src/assets/themes/night/bg.svg',
  svg(
    `<defs>
      <linearGradient id="n" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#020617"/>
        <stop offset="50%" stop-color="#1e1b4b"/>
        <stop offset="100%" stop-color="#312e81"/>
      </linearGradient>
      <pattern id="ng" width="36" height="36" patternUnits="userSpaceOnUse">
        <path d="M36 0H0V36" fill="none" stroke="#22d3ee" stroke-width="1"/>
      </pattern>
    </defs>
    <rect width="720" height="1040" fill="url(#n)"/>
    <rect width="720" height="1040" fill="url(#ng)" opacity=".12"/>
    <circle cx="90" cy="70" r="3" fill="#e0e7ff"/>
    <circle cx="200" cy="140" r="2" fill="#a5b4fc"/>
    <circle cx="520" cy="90" r="2.4" fill="#f5d0fe"/>
    <circle cx="640" cy="200" r="2" fill="#67e8f9"/>`,
    { w: 720, h: 1040 },
  ),
);

write(
  'src/assets/themes/tropical/bg.svg',
  svg(
    `<defs>
      <linearGradient id="t" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#7dd3fc"/>
        <stop offset="38%" stop-color="#38bdf8"/>
        <stop offset="52%" stop-color="#fb923c"/>
        <stop offset="78%" stop-color="#f59e0b"/>
        <stop offset="100%" stop-color="#fde68a"/>
      </linearGradient>
    </defs>
    <rect width="720" height="1040" fill="url(#t)"/>
    <ellipse cx="160" cy="90" rx="80" ry="28" fill="#fff" opacity=".35"/>
    <ellipse cx="280" cy="110" rx="60" ry="22" fill="#fff" opacity=".28"/>
    <ellipse cx="560" cy="80" rx="90" ry="26" fill="#fff" opacity=".25"/>
    <path d="M0 780 Q180 740 360 780 T720 760 L720 1040 L0 1040Z" fill="#f5d0a9" opacity=".85"/>
    <path d="M0 700 Q240 680 420 710 T720 690 L720 820 L0 840Z" fill="#38bdf8" opacity=".18"/>`,
    { w: 720, h: 1040 },
  ),
);

write(
  'src/assets/themes/sports/bg.svg',
  svg(
    `<defs>
      <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#166534"/>
        <stop offset="100%" stop-color="#3f6212"/>
      </linearGradient>
      <pattern id="turf" width="18" height="18" patternUnits="userSpaceOnUse">
        <path d="M0 18L18 0" stroke="#14532d" stroke-width="1" opacity=".5"/>
      </pattern>
    </defs>
    <rect width="720" height="1040" fill="url(#g)"/>
    <rect width="720" height="1040" fill="url(#turf)" opacity=".35"/>
    <rect x="48" y="160" width="624" height="780" fill="none" stroke="#fff" stroke-width="6" opacity=".22"/>
    <circle cx="360" cy="620" r="90" fill="none" stroke="#fff" stroke-width="5" opacity=".2"/>
    <path d="M48 620h624" stroke="#fff" stroke-width="4" opacity=".18"/>`,
    { w: 720, h: 1040 },
  ),
);

write(
  'src/assets/themes/drinks/bg.svg',
  svg(
    `<defs>
      <linearGradient id="bar" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#3b1224"/>
        <stop offset="55%" stop-color="#1c1016"/>
        <stop offset="100%" stop-color="#140c10"/>
      </linearGradient>
      <linearGradient id="wood" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#5b3a2e"/>
        <stop offset="100%" stop-color="#2a151c"/>
      </linearGradient>
    </defs>
    <rect width="720" height="1040" fill="url(#bar)"/>
    <g opacity=".35">
      <rect x="40" y="40" width="70" height="160" rx="8" fill="#e8c07a"/>
      <rect x="130" y="70" width="50" height="130" rx="8" fill="#fb7185"/>
      <rect x="200" y="30" width="40" height="170" rx="8" fill="#fde68a"/>
      <rect x="520" y="50" width="60" height="150" rx="8" fill="#86efac"/>
      <rect x="600" y="80" width="70" height="120" rx="8" fill="#fda4af"/>
    </g>
    <rect y="240" width="720" height="800" fill="url(#wood)"/>
    ${Array.from({ length: 18 }, (_, i) => `<rect y="${260 + i * 42}" width="720" height="2" fill="#000" opacity=".12"/>`).join('')}`,
    { w: 720, h: 1040 },
  ),
);

/* ---------------- UI icons ---------------- */

function icon(body) {
  return svg(body, { w: 128, h: 128 });
}

write(
  'src/assets/ui/shake.svg',
  icon(`<defs>${grad('gl', '#38bdf8', '#2563eb', '#1e3a8a')}</defs>
  <path d="M18 40c8-18 22-8 18 8M110 40c-8-18-22-8-18 8M18 88c8 18 22 8 18-8M110 88c-8 18-22 8-18-8" fill="none" stroke="#38bdf8" stroke-width="6" stroke-linecap="round"/>
  <circle cx="64" cy="64" r="36" fill="url(#gl)" stroke="#1d4ed8" stroke-width="3"/>
  <ellipse cx="64" cy="64" rx="14" ry="36" fill="none" stroke="#93c5fd" stroke-width="3"/>
  <path d="M30 64h68" stroke="#93c5fd" stroke-width="3"/>
  <path d="M38 48h52M38 80h52" stroke="#93c5fd" stroke-width="2" opacity=".7"/>`),
);

write(
  'src/assets/ui/sweep.svg',
  icon(`<g fill="#38bdf8" stroke="#1d4ed8" stroke-width="2">
    <circle cx="46" cy="70" r="22" fill="#7dd3fc"/>
    <circle cx="78" cy="52" r="18" fill="#38bdf8"/>
    <circle cx="90" cy="82" r="14" fill="#bae6fd"/>
    <circle cx="40" cy="42" r="10" fill="#e0f2fe"/>
  </g>
  <g fill="#fff" opacity=".45">
    <ellipse cx="40" cy="62" rx="6" ry="4"/><ellipse cx="72" cy="46" rx="5" ry="3"/>
  </g>`),
);

write(
  'src/assets/ui/target.svg',
  icon(`<circle cx="58" cy="70" r="34" fill="#fff"/>
  <circle cx="58" cy="70" r="34" fill="none" stroke="#dc2626" stroke-width="8"/>
  <circle cx="58" cy="70" r="18" fill="none" stroke="#dc2626" stroke-width="8"/>
  <circle cx="58" cy="70" r="6" fill="#dc2626"/>
  <g stroke="#2563eb" stroke-width="4" fill="#60a5fa">
    <path d="M86 22l22 38-40 4z"/>
    <path d="M108 18l8 28-28 2z" fill="#93c5fd"/>
  </g>`),
);

write(
  'src/assets/ui/geography.svg',
  icon(`<defs>${grad('gb', '#38bdf8', '#2563eb', '#1e3a8a')}</defs>
  <circle cx="64" cy="54" r="34" fill="url(#gb)" stroke="#1d4ed8" stroke-width="3"/>
  <path d="M42 44c8-10 20-8 28 0 6 8 4 16-2 18-10 2-14-8-20-6-8 2-10 10-6 16" fill="#4ade80" opacity=".9"/>
  <path d="M64 20v68M30 54h68" stroke="#93c5fd" stroke-width="2" opacity=".7"/>
  <rect x="40" y="90" width="48" height="10" rx="3" fill="#eab308"/>
  <rect x="52" y="86" width="24" height="8" rx="2" fill="#f59e0b"/>`),
);

write(
  'src/assets/ui/energy.svg',
  icon(`<path d="M70 14L34 70h28L50 114l52-68H74z" fill="#facc15" stroke="#ca8a04" stroke-width="4" stroke-linejoin="round"/>
  ${shine(58, 40, 6, 10, 0.45)}`),
);

write(
  'src/assets/ui/quiz.svg',
  icon(`<defs>${grad('br', '#93c5fd', '#3b82f6', '#1d4ed8')}</defs>
  <path d="M40 70c-10-28 6-48 28-52 22-4 40 10 44 30 14-4 26 8 22 22-2 12-14 18-24 16 0 18-14 32-34 32s-36-14-36-32c-10 0-16-8-14-16 2-8 10-10 14 0z" fill="url(#br)" stroke="#1d4ed8" stroke-width="3"/>
  <g fill="#1e3a8a" opacity=".35">
    <circle cx="52" cy="64" r="6"/><circle cx="76" cy="58" r="7"/><circle cx="64" cy="80" r="5"/>
  </g>
  ${shine(52, 52, 8, 5, 0.35)}`),
);

write(
  'src/assets/ui/menu.svg',
  icon(`<g stroke="currentColor" stroke-width="10" stroke-linecap="round">
    <path d="M24 36h80"/><path d="M24 64h80"/><path d="M24 92h80"/>
  </g>`),
);

write(
  'src/assets/ui/sound-on.svg',
  icon(`<path d="M28 52h18l28-18v60L46 76H28z" fill="#e2e8f0" stroke="#334155" stroke-width="4" stroke-linejoin="round"/>
  <path d="M84 44c10 8 16 20 16 32s-6 24-16 32" fill="none" stroke="#38bdf8" stroke-width="6" stroke-linecap="round"/>
  <path d="M98 32c16 12 24 28 24 44s-8 32-24 44" fill="none" stroke="#38bdf8" stroke-width="6" stroke-linecap="round"/>`),
);

write(
  'src/assets/ui/sound-off.svg',
  icon(`<path d="M28 52h18l28-18v60L46 76H28z" fill="#e2e8f0" stroke="#334155" stroke-width="4" stroke-linejoin="round"/>
  <path d="M86 48l32 32M118 48L86 80" stroke="#dc2626" stroke-width="8" stroke-linecap="round"/>`),
);

write(
  'src/assets/ui/classic.svg',
  svg(apple(classic.apple)),
);
write(
  'src/assets/ui/night.svg',
  neonWrap(apple(night.apple), night.apple.glow),
);
write(
  'src/assets/ui/tropical.svg',
  mango(),
);
write(
  'src/assets/ui/sports.svg',
  svg(`${ballBase('sc', '#f8fafc', '#e2e8f0', '#cbd5e1', '#0f172a')}
  <path d="M128 86l22 16-8 26h-28l-8-26z" fill="#0f172a"/>`),
);
write(
  'src/assets/ui/drinks.svg',
  svg(`<path d="M64 64h128L128 150Z" fill="none" stroke="#e5e7eb" stroke-width="4"/>
  <path d="M78 72h100L128 138Z" fill="#e5e7eb" opacity=".55"/>
  <path d="M128 150v48" stroke="#e5e7eb" stroke-width="5"/>
  <path d="M106 198h44" stroke="#e5e7eb" stroke-width="6" stroke-linecap="round"/>
  <circle cx="170" cy="80" r="10" fill="#4d7c0f"/>`),
);

console.log('Generated theme, UI, and background SVG assets.');
