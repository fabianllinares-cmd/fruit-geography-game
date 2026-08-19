// Fruit tiers, ordered small -> large. Merging two of the same tier produces
// the next tier up. Each fruit is tagged with a top-producing country to give
// the game its geography flavour.
export const FRUITS = [
  { name: 'Cherry', emoji: '🍒', radius: 17, color: '#e5405e', country: 'Turkey', flag: '🇹🇷', score: 1 },
  { name: 'Strawberry', emoji: '🍓', radius: 23, color: '#f0466b', country: 'China', flag: '🇨🇳', score: 3 },
  { name: 'Grape', emoji: '🍇', radius: 30, color: '#8b5cf6', country: 'Italy', flag: '🇮🇹', score: 6 },
  { name: 'Lemon', emoji: '🍋', radius: 38, color: '#f4d03f', country: 'India', flag: '🇮🇳', score: 10 },
  { name: 'Orange', emoji: '🍊', radius: 46, color: '#ff9f1c', country: 'Brazil', flag: '🇧🇷', score: 15 },
  { name: 'Apple', emoji: '🍎', radius: 55, color: '#e63946', country: 'China', flag: '🇨🇳', score: 21 },
  { name: 'Pear', emoji: '🍐', radius: 64, color: '#a7c957', country: 'Argentina', flag: '🇦🇷', score: 28 },
  { name: 'Peach', emoji: '🍑', radius: 74, color: '#ffb4a2', country: 'Greece', flag: '🇬🇷', score: 36 },
  { name: 'Pineapple', emoji: '🍍', radius: 85, color: '#ffca3a', country: 'Costa Rica', flag: '🇨🇷', score: 45 },
  { name: 'Melon', emoji: '🍈', radius: 96, color: '#90be6d', country: 'South Korea', flag: '🇰🇷', score: 55 },
  { name: 'Watermelon', emoji: '🍉', radius: 108, color: '#43aa8b', country: 'Brazil', flag: '🇧🇷', score: 66 },
];

// Only the smallest few tiers can be dropped by the player.
export const MAX_DROP_TIER = 4;

export const POWERUPS = [
  {
    id: 'earthquake',
    name: 'Earthquake',
    emoji: '🌍',
    key: '1',
    cost: 40,
    hint: 'Jolts every fruit to reshuffle the pile.',
  },
  {
    id: 'volcano',
    name: 'Volcano',
    emoji: '🌋',
    key: '2',
    cost: 60,
    hint: 'Erupts the biggest fruit for bonus points.',
  },
  {
    id: 'drift',
    name: 'Continental Drift',
    emoji: '🧭',
    key: '3',
    cost: 100,
    hint: 'Pulls all fruit toward the centre to force merges.',
  },
];
