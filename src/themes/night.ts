import { buildObjects } from './build';
import type { Theme } from './types';

export const nightTheme: Theme = {
  id: 'night',
  name: 'Fruit Night',
  shortName: 'Night',
  emoji: '🌙',
  tagline: 'Neon fruit after dark',
  cssVars: {
    '--bg': '#07091a',
    '--bg2': '#1e1b4b',
    '--text': '#e0e7ff',
    '--muted': '#a5b4fc',
    '--panel': 'rgba(15, 23, 42, 0.78)',
    '--panel-border': 'rgba(129, 140, 248, 0.28)',
    '--accent': '#22d3ee',
    '--accent-2': '#e879f9',
    '--danger': '#fb7185',
    '--stage': 'linear-gradient(180deg, #020617 0%, #1e1b4b 50%, #312e81 100%)',
    '--hud': 'rgba(2, 6, 23, 0.88)',
    '--shadow': 'rgba(34, 211, 238, 0.18)',
    '--btn-text': '#042f2e',
  },
  objects: buildObjects('night', [
    {
      id: 'cherry',
      name: 'Cherry',
      visual: { fill: '#fb7185', stroke: '#22d3ee', highlight: '#fda4af', style: 'night-fruit', glow: '#22d3ee' },
    },
    {
      id: 'strawberry',
      name: 'Strawberry',
      visual: { fill: '#f43f5e', stroke: '#fb7185', highlight: '#fecdd3', style: 'night-fruit', glow: '#fb7185' },
    },
    {
      id: 'blueberry',
      name: 'Blueberry',
      visual: { fill: '#1d4ed8', stroke: '#22d3ee', highlight: '#93c5fd', style: 'night-fruit', glow: '#22d3ee' },
    },
    {
      id: 'grapes',
      name: 'Grapes',
      visual: { fill: '#7c3aed', stroke: '#e879f9', highlight: '#d8b4fe', style: 'night-fruit', glow: '#e879f9' },
    },
    {
      id: 'lime',
      name: 'Lime',
      visual: { fill: '#a3e635', stroke: '#22d3ee', highlight: '#d9f99d', style: 'night-fruit', glow: '#a3e635' },
    },
    {
      id: 'orange',
      name: 'Orange',
      visual: { fill: '#fb923c', stroke: '#f9a8d4', highlight: '#fed7aa', style: 'night-fruit', glow: '#fb923c' },
    },
    {
      id: 'apple',
      name: 'Apple',
      visual: { fill: '#ef4444', stroke: '#fb7185', highlight: '#fecaca', style: 'night-fruit', glow: '#fb7185' },
    },
    {
      id: 'pear',
      name: 'Pear',
      visual: { fill: '#84cc16', stroke: '#a3e635', highlight: '#d9f99d', style: 'night-fruit', glow: '#a3e635' },
    },
    {
      id: 'peach',
      name: 'Peach',
      visual: { fill: '#fb7185', stroke: '#f9a8d4', highlight: '#fecdd3', style: 'night-fruit', glow: '#f9a8d4' },
    },
    {
      id: 'pineapple',
      name: 'Pineapple',
      visual: { fill: '#f59e0b', stroke: '#fde68a', highlight: '#fef08a', style: 'night-fruit', glow: '#fde68a' },
    },
    {
      id: 'watermelon',
      name: 'Watermelon',
      visual: { fill: '#fb7185', stroke: '#5eead4', highlight: '#fecdd3', style: 'night-fruit', glow: '#5eead4' },
    },
  ]),
};
