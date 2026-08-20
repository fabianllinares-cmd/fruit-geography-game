import { buildObjects } from './build';
import type { Theme } from './types';

export const tropicalTheme: Theme = {
  id: 'tropical',
  name: 'Tropical Island',
  shortName: 'Tropical',
  emoji: '🌴',
  tagline: 'Sunset beach harvest',
  cssVars: {
    '--bg': '#082f49',
    '--bg2': '#ea580c',
    '--text': '#fff7ed',
    '--muted': '#fed7aa',
    '--panel': 'rgba(12, 74, 110, 0.55)',
    '--panel-border': 'rgba(251, 146, 60, 0.35)',
    '--accent': '#f97316',
    '--accent-2': '#14b8a6',
    '--danger': '#fb7185',
    '--stage': 'linear-gradient(180deg, #7dd3fc 0%, #fb923c 42%, #ea580c 70%, #fde68a 100%)',
    '--hud': 'rgba(8, 47, 73, 0.72)',
    '--shadow': 'rgba(234, 88, 12, 0.28)',
    '--btn-text': '#082f49',
  },
  objects: buildObjects('tropical', [
    {
      id: 'raspberry',
      name: 'Raspberry',
      visual: { fill: '#e11d48', stroke: '#9f1239', highlight: '#fb7185', style: 'tropical' },
    },
    {
      id: 'kiwi',
      name: 'Kiwi',
      visual: { fill: '#65a30d', stroke: '#3f6212', highlight: '#bef264', style: 'tropical' },
    },
    {
      id: 'starfruit',
      name: 'Starfruit',
      visual: { fill: '#facc15', stroke: '#ca8a04', highlight: '#fef08a', style: 'tropical' },
    },
    {
      id: 'passionfruit',
      name: 'Passion fruit',
      visual: { fill: '#6d28d9', stroke: '#4c1d95', highlight: '#c4b5fd', style: 'tropical' },
    },
    {
      id: 'dragonfruit',
      name: 'Dragon fruit',
      visual: { fill: '#fb7185', stroke: '#be123c', highlight: '#fecdd3', style: 'tropical' },
    },
    {
      id: 'mango',
      name: 'Mango',
      visual: { fill: '#f97316', stroke: '#c2410c', highlight: '#fed7aa', style: 'tropical' },
    },
    {
      id: 'banana',
      name: 'Banana',
      visual: { fill: '#facc15', stroke: '#ca8a04', highlight: '#fef08a', style: 'tropical' },
    },
    {
      id: 'coconut',
      name: 'Coconut',
      visual: { fill: '#78716c', stroke: '#44403c', highlight: '#e7e5e4', style: 'tropical' },
    },
    {
      id: 'papaya',
      name: 'Papaya',
      visual: { fill: '#fb923c', stroke: '#c2410c', highlight: '#ffedd5', style: 'tropical' },
    },
    {
      id: 'pineapple',
      name: 'Pineapple',
      visual: { fill: '#eab308', stroke: '#a16207', highlight: '#fef08a', style: 'tropical' },
    },
    {
      id: 'watermelon',
      name: 'Watermelon',
      visual: { fill: '#fb7185', stroke: '#166534', highlight: '#fecdd3', style: 'tropical' },
    },
  ]),
};
