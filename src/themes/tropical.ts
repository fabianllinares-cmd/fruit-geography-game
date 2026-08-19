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
  objects: buildObjects([
    {
      id: 'berry',
      name: 'Berry',
      visual: { emoji: '🫐', fill: '#1d4ed8', stroke: '#1e3a8a', highlight: '#93c5fd', style: 'tropical' },
    },
    {
      id: 'lime',
      name: 'Lime',
      visual: { emoji: '🍋', fill: '#84cc16', stroke: '#3f6212', highlight: '#d9f99d', style: 'tropical' },
    },
    {
      id: 'passion',
      name: 'Passion fruit',
      visual: { emoji: '🟣', fill: '#6d28d9', stroke: '#4c1d95', highlight: '#c4b5fd', style: 'tropical' },
    },
    {
      id: 'guava',
      name: 'Guava',
      visual: { emoji: '🩷', fill: '#fb7185', stroke: '#be123c', highlight: '#fecdd3', style: 'tropical' },
    },
    {
      id: 'mandarin',
      name: 'Mandarin',
      visual: { emoji: '🍊', fill: '#f97316', stroke: '#c2410c', highlight: '#fed7aa', style: 'tropical' },
    },
    {
      id: 'tropical-mango',
      name: 'Mango',
      visual: { emoji: '🥭', fill: '#f59e0b', stroke: '#b45309', highlight: '#fde68a', style: 'tropical', leaf: true },
    },
    {
      id: 'tropical-coconut',
      name: 'Coconut',
      visual: { emoji: '🥥', fill: '#78716c', stroke: '#44403c', highlight: '#e7e5e4', style: 'tropical' },
    },
    {
      id: 'tropical-papaya',
      name: 'Papaya',
      visual: { emoji: '🧡', fill: '#fb923c', stroke: '#c2410c', highlight: '#ffedd5', style: 'tropical' },
    },
    {
      id: 'tropical-pineapple',
      name: 'Pineapple',
      visual: { emoji: '🍍', fill: '#eab308', stroke: '#a16207', highlight: '#fef08a', style: 'tropical', leaf: true },
    },
    {
      id: 'tropical-melon',
      name: 'Melon',
      visual: { emoji: '🍈', fill: '#34d399', stroke: '#047857', highlight: '#a7f3d0', style: 'tropical' },
    },
    {
      id: 'giant-melon',
      name: 'Giant watermelon',
      visual: { emoji: '🍉', fill: '#fb7185', stroke: '#166534', highlight: '#fecdd3', style: 'tropical' },
    },
  ]),
};
