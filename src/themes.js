// Data-driven theme + level architecture.
//
// The physics engine is completely theme-agnostic: it only reads generic
// fields from a "level" (radius, score, next). Everything visual lives in
// `visual` and the theme `style`/`canvas` palettes, so adding a theme never
// touches the engine.

// Shared physical/score ramps. Radii are in the game's fixed logical units
// (see BOARD in game.js), so physics is deterministic across devices.
export const RADII = [16, 22, 28, 35, 43, 52, 61, 71, 82, 94, 108];
export const SCORES = [1, 3, 6, 10, 16, 24, 34, 47, 63, 82, 105];

// How many of the smallest levels the player can drop (indices 0..N-1).
export const DROP_TIERS = 5;

// Weighted drop distribution: smaller pieces appear more often.
export const DROP_WEIGHTS = [5, 4, 3, 2, 1];

// Geography-flavoured power-ups. These are mechanics shared by every theme.
export const POWERUPS = [
  {
    id: 'earthquake',
    name: 'Earthquake',
    emoji: '🌍',
    key: '1',
    cost: 35,
    hint: 'Jolt everything to reshuffle the pile.',
  },
  {
    id: 'volcano',
    name: 'Volcano',
    emoji: '🌋',
    key: '2',
    cost: 60,
    hint: 'Erupt the biggest object for bonus points.',
  },
  {
    id: 'drift',
    name: 'Drift',
    emoji: '🧭',
    key: '3',
    cost: 100,
    hint: 'Pull everything to the centre to force merges.',
  },
];

function buildLevels(defs) {
  return defs.map((d, i) => ({
    id: i,
    name: d.name,
    visual: d.visual,
    radius: RADII[i],
    score: SCORES[i],
    next: i < defs.length - 1 ? i + 1 : null,
    meta: d.meta || {},
  }));
}

const emoji = (name, glyph, color, meta) => ({
  name,
  visual: { type: 'emoji', glyph, color },
  meta,
});

const ball = (name, pattern, base, accent, meta) => ({
  name,
  visual: { type: 'ball', pattern, base, accent },
  meta,
});

export const THEMES = [
  {
    id: 'fruit-classic',
    name: 'Fruit Classic',
    tagline: 'Bright & breezy orchard merge',
    icon: '🍉',
    style: {
      mode: 'light',
      disc: 'glossy',
      bg: 'radial-gradient(120% 90% at 50% -10%, #fef9c3 0%, #fde68a 34%, #fca5a5 100%)',
      panel: 'rgba(255,255,255,0.55)',
      panelBorder: 'rgba(120,53,15,0.18)',
      text: '#4a2c12',
      sub: '#8a5a33',
      accent: '#f97316',
      accent2: '#e11d48',
      frame: 'rgba(120,53,15,0.28)',
      danger: '#e11d48',
    },
    canvas: {
      bg: [
        [0, '#fffdf3'],
        [1, '#ffe9c7'],
      ],
      grid: 'rgba(120,53,15,0.05)',
      danger: 'rgba(225,29,72,0.9)',
      decor: 'none',
    },
    levels: buildLevels([
      emoji('Cherry', '🍒', '#e5405e', { country: 'Turkey', flag: '🇹🇷' }),
      emoji('Strawberry', '🍓', '#f0466b', { country: 'China', flag: '🇨🇳' }),
      emoji('Grape', '🍇', '#8b5cf6', { country: 'Italy', flag: '🇮🇹' }),
      emoji('Lemon', '🍋', '#f4d03f', { country: 'India', flag: '🇮🇳' }),
      emoji('Orange', '🍊', '#ff9f1c', { country: 'Brazil', flag: '🇧🇷' }),
      emoji('Apple', '🍎', '#e63946', { country: 'China', flag: '🇨🇳' }),
      emoji('Peach', '🍑', '#ffb4a2', { country: 'Greece', flag: '🇬🇷' }),
      emoji('Pear', '🍐', '#a7c957', { country: 'Argentina', flag: '🇦🇷' }),
      emoji('Pineapple', '🍍', '#ffca3a', { country: 'Costa Rica', flag: '🇨🇷' }),
      emoji('Melon', '🍈', '#90be6d', { country: 'South Korea', flag: '🇰🇷' }),
      emoji('Watermelon', '🍉', '#43aa8b', { country: 'Brazil', flag: '🇧🇷' }),
    ]),
  },

  {
    id: 'fruit-night',
    name: 'Fruit Night',
    tagline: 'Neon berries in the dark',
    icon: '🫐',
    style: {
      mode: 'dark',
      disc: 'neon',
      bg: 'radial-gradient(120% 90% at 50% -20%, #1e1b4b 0%, #0f172a 45%, #020617 100%)',
      panel: 'rgba(30,27,75,0.55)',
      panelBorder: 'rgba(129,140,248,0.28)',
      text: '#e0e7ff',
      sub: '#a5b4fc',
      accent: '#818cf8',
      accent2: '#22d3ee',
      frame: 'rgba(129,140,248,0.4)',
      danger: '#fb7185',
    },
    canvas: {
      bg: [
        [0, '#1e1b4b'],
        [1, '#020617'],
      ],
      grid: 'rgba(129,140,248,0.08)',
      danger: 'rgba(251,113,133,0.95)',
      decor: 'stars',
    },
    levels: buildLevels([
      emoji('Blueberry', '🫐', '#4361ee', { country: 'USA', flag: '🇺🇸' }),
      emoji('Kiwi', '🥝', '#55a630', { country: 'New Zealand', flag: '🇳🇿' }),
      emoji('Fig', '🍇', '#7209b7', { country: 'Turkey', flag: '🇹🇷' }),
      emoji('Plum', '🍆', '#9d4edd', { country: 'China', flag: '🇨🇳' }),
      emoji('Green Apple', '🍏', '#38b000', { country: 'Poland', flag: '🇵🇱' }),
      emoji('Mango', '🥭', '#ff9e00', { country: 'India', flag: '🇮🇳' }),
      emoji('Banana', '🍌', '#ffdd00', { country: 'Ecuador', flag: '🇪🇨' }),
      emoji('Coconut', '🥥', '#c68b59', { country: 'Indonesia', flag: '🇮🇩' }),
      emoji('Tomato', '🍅', '#e5383b', { country: 'China', flag: '🇨🇳' }),
      emoji('Olive', '🫒', '#7f9172', { country: 'Spain', flag: '🇪🇸' }),
      emoji('Durian', '🍈', '#2ec4b6', { country: 'Thailand', flag: '🇹🇭' }),
    ]),
  },

  {
    id: 'tropical',
    name: 'Tropical Island',
    tagline: 'Sunset beach smoothie run',
    icon: '🏝️',
    style: {
      mode: 'light',
      disc: 'warm',
      bg: 'linear-gradient(180deg, #ffd6a5 0%, #ff9e7d 40%, #ff6b6b 75%, #7f5af0 100%)',
      panel: 'rgba(255,255,255,0.42)',
      panelBorder: 'rgba(127,23,86,0.22)',
      text: '#5b1d3a',
      sub: '#9b3d5a',
      accent: '#ff5d8f',
      accent2: '#00b4d8',
      frame: 'rgba(127,23,86,0.3)',
      danger: '#d90429',
    },
    canvas: {
      bg: [
        [0, '#ffe3c2'],
        [0.55, '#ffb199'],
        [1, '#ff8fab'],
      ],
      grid: 'rgba(127,23,86,0.06)',
      danger: 'rgba(217,4,41,0.9)',
      decor: 'sun',
    },
    levels: buildLevels([
      emoji('Sea Berry', '🫐', '#3a86ff', { country: 'Chile', flag: '🇨🇱' }),
      emoji('Lime', '🍏', '#80b918', { country: 'Mexico', flag: '🇲🇽' }),
      emoji('Passion Fruit', '🍇', '#9b5de5', { country: 'Colombia', flag: '🇨🇴' }),
      emoji('Guava', '🍐', '#ef476f', { country: 'India', flag: '🇮🇳' }),
      emoji('Mandarin', '🍊', '#fb8500', { country: 'Spain', flag: '🇪🇸' }),
      emoji('Mango', '🥭', '#ffb703', { country: 'India', flag: '🇮🇳' }),
      emoji('Papaya', '🍑', '#ff7b00', { country: 'India', flag: '🇮🇳' }),
      emoji('Coconut', '🥥', '#a5751f', { country: 'Indonesia', flag: '🇮🇩' }),
      emoji('Pineapple', '🍍', '#ffca3a', { country: 'Costa Rica', flag: '🇨🇷' }),
      emoji('Melon', '🍈', '#52b788', { country: 'South Korea', flag: '🇰🇷' }),
      emoji('Island Melon', '🍉', '#e63946', { country: 'Brazil', flag: '🇧🇷' }),
    ]),
  },

  {
    id: 'sports',
    name: 'Sports Arena',
    tagline: 'Merge the balls, win the cup',
    icon: '⚽',
    style: {
      mode: 'dark',
      disc: 'none',
      bg: 'radial-gradient(120% 90% at 50% -10%, #14532d 0%, #052e16 45%, #041016 100%)',
      panel: 'rgba(6,46,22,0.55)',
      panelBorder: 'rgba(74,222,128,0.28)',
      text: '#dcfce7',
      sub: '#86efac',
      accent: '#4ade80',
      accent2: '#fbbf24',
      frame: 'rgba(74,222,128,0.4)',
      danger: '#f87171',
    },
    canvas: {
      bg: [
        [0, '#0b3d1f'],
        [1, '#041016'],
      ],
      grid: 'rgba(255,255,255,0.06)',
      danger: 'rgba(248,113,113,0.95)',
      decor: 'arena',
    },
    levels: buildLevels([
      ball('Ping-pong', 'pingpong', '#f8fafc', '#f97316', { origin: 'China', flag: '🇨🇳' }),
      ball('Golf ball', 'golf', '#f1f5f9', '#cbd5e1', { origin: 'Scotland', flag: '🏴' }),
      ball('Pool ball', 'billiard', '#1d4ed8', '#f8fafc', { origin: 'USA', flag: '🇺🇸' }),
      ball('Tennis ball', 'tennis', '#d4f542', '#ffffff', { origin: 'England', flag: '🏴' }),
      ball('Baseball', 'baseball', '#ffffff', '#dc2626', { origin: 'USA', flag: '🇺🇸' }),
      ball('Handball', 'handball', '#2563eb', '#fbbf24', { origin: 'Denmark', flag: '🇩🇰' }),
      ball('Volleyball', 'volleyball', '#ffffff', '#2563eb', { origin: 'USA', flag: '🇺🇸' }),
      ball('Football', 'soccer', '#ffffff', '#111827', { origin: 'England', flag: '🏴' }),
      ball('Basketball', 'basketball', '#e8590c', '#1a1a1a', { origin: 'USA', flag: '🇺🇸' }),
      ball('Bowling ball', 'bowling', '#1f2937', '#0ea5e9', { origin: 'Egypt', flag: '🇪🇬' }),
      ball('Champion cup', 'trophy', '#f9d423', '#b45309', { origin: 'World', flag: '🏆' }),
    ]),
  },

  {
    id: 'drinks',
    name: 'Cocktail Bar',
    tagline: 'Shake, stir & merge — 18+',
    icon: '🍸',
    style: {
      mode: 'dark',
      disc: 'frosted',
      bg: 'radial-gradient(120% 90% at 50% -10%, #3b0764 0%, #1e1035 45%, #0b0713 100%)',
      panel: 'rgba(59,7,100,0.5)',
      panelBorder: 'rgba(232,121,249,0.3)',
      text: '#fae8ff',
      sub: '#f0abfc',
      accent: '#e879f9',
      accent2: '#facc15',
      frame: 'rgba(232,121,249,0.4)',
      danger: '#fb7185',
    },
    canvas: {
      bg: [
        [0, '#2a1145'],
        [1, '#0b0713'],
      ],
      grid: 'rgba(232,121,249,0.08)',
      danger: 'rgba(251,113,133,0.95)',
      decor: 'shelf',
    },
    levels: buildLevels([
      emoji('Shot', '🥃', '#b45309', { origin: 'Global', flag: '🌍' }),
      emoji('Small beer', '🍺', '#f59e0b', { origin: 'Germany', flag: '🇩🇪' }),
      emoji('Sake', '🍶', '#e2e8f0', { origin: 'Japan', flag: '🇯🇵' }),
      emoji('Wine', '🍷', '#9d174d', { origin: 'France', flag: '🇫🇷' }),
      emoji('Martini', '🍸', '#a7f3d0', { origin: 'USA', flag: '🇺🇸' }),
      emoji('Cocktail', '🍹', '#fb7185', { origin: 'Cuba', flag: '🇨🇺' }),
      emoji('Pint', '🍺', '#d97706', { origin: 'Ireland', flag: '🇮🇪' }),
      emoji('Mate highball', '🧉', '#65a30d', { origin: 'Argentina', flag: '🇦🇷' }),
      emoji('Champagne', '🍾', '#fde68a', { origin: 'France', flag: '🇫🇷' }),
      emoji('Toast', '🥂', '#fcd34d', { origin: 'Italy', flag: '🇮🇹' }),
      emoji('Party punch', '🍹', '#f472b6', { origin: 'Caribbean', flag: '🏝️' }),
    ]),
  },
];

export function getTheme(id) {
  return THEMES.find((t) => t.id === id) || THEMES[0];
}
