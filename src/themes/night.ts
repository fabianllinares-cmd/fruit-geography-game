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
      id: 'blueberry',
      name: 'Blueberry',
      visual: { fill: '#2563eb', stroke: '#22d3ee', highlight: '#93c5fd', style: 'night-fruit', glow: '#67e8ff' },
    },
    {
      id: 'gooseberry',
      name: 'Gooseberry',
      visual: { fill: '#65a30d', stroke: '#22d3ee', highlight: '#bef264', style: 'night-fruit', glow: '#67e8ff' },
    },
    {
      id: 'strawberry',
      name: 'Strawberry',
      visual: { fill: '#f43f5e', stroke: '#22d3ee', highlight: '#fda4af', style: 'night-fruit', glow: '#67e8ff' },
    },
    {
      id: 'grapes',
      name: 'Grapes',
      visual: { fill: '#7c3aed', stroke: '#e879f9', highlight: '#c4b5fd', style: 'night-fruit', glow: '#67e8ff' },
    },
    {
      id: 'lemon',
      name: 'Lemon',
      visual: { fill: '#facc15', stroke: '#22d3ee', highlight: '#fef08a', style: 'night-fruit', glow: '#67e8ff' },
    },
    {
      id: 'orange',
      name: 'Orange',
      visual: { fill: '#fb923c', stroke: '#22d3ee', highlight: '#fed7aa', style: 'night-fruit', glow: '#67e8ff' },
    },
    {
      id: 'apple',
      name: 'Apple',
      visual: { fill: '#ef4444', stroke: '#22d3ee', highlight: '#fca5a5', style: 'night-fruit', glow: '#67e8ff' },
    },
    {
      id: 'pear',
      name: 'Pear',
      visual: { fill: '#a3e635', stroke: '#22d3ee', highlight: '#d9f99d', style: 'night-fruit', glow: '#67e8ff' },
    },
    {
      id: 'peach',
      name: 'Peach',
      visual: { fill: '#fb7185', stroke: '#e879f9', highlight: '#fecdd3', style: 'night-fruit', glow: '#67e8ff' },
    },
    {
      id: 'pineapple',
      name: 'Pineapple',
      visual: { fill: '#f59e0b', stroke: '#22d3ee', highlight: '#fde68a', style: 'night-fruit', glow: '#67e8ff' },
    },
    {
      id: 'watermelon',
      name: 'Watermelon',
      visual: { fill: '#fb7185', stroke: '#22d3ee', highlight: '#fecdd3', style: 'night-fruit', glow: '#67e8ff' },
    },
  ]),
};
