import { buildObjects } from './build';
import type { Theme } from './types';

export const classicTheme: Theme = {
  id: 'classic',
  name: 'Fruit Classic',
  shortName: 'Classic',
  emoji: '🍎',
  tagline: 'Bright orchard merges',
  cssVars: {
    '--bg': '#fff4e5',
    '--bg2': '#fde68a',
    '--text': '#3f2a1d',
    '--muted': '#8a5a3c',
    '--panel': 'rgba(255, 255, 255, 0.72)',
    '--panel-border': 'rgba(180, 83, 9, 0.18)',
    '--accent': '#ea580c',
    '--accent-2': '#16a34a',
    '--danger': '#dc2626',
    '--stage': 'linear-gradient(180deg, #fff7ed 0%, #fed7aa 55%, #fdba74 100%)',
    '--hud': 'rgba(255, 247, 237, 0.92)',
    '--shadow': 'rgba(180, 83, 9, 0.18)',
    '--btn-text': '#fff7ed',
  },
  objects: buildObjects([
    {
      id: 'cherry',
      name: 'Cherry',
      visual: { emoji: '🍒', fill: '#e11d48', stroke: '#9f1239', highlight: '#fb7185', style: 'fruit', leaf: true },
    },
    {
      id: 'strawberry',
      name: 'Strawberry',
      visual: { emoji: '🍓', fill: '#f43f5e', stroke: '#be123c', highlight: '#fda4af', style: 'fruit', leaf: true },
    },
    {
      id: 'grape',
      name: 'Grape',
      visual: { emoji: '🍇', fill: '#7c3aed', stroke: '#5b21b6', highlight: '#c4b5fd', style: 'fruit' },
    },
    {
      id: 'lemon',
      name: 'Lemon',
      visual: { emoji: '🍋', fill: '#facc15', stroke: '#ca8a04', highlight: '#fef08a', style: 'fruit' },
    },
    {
      id: 'orange',
      name: 'Orange',
      visual: { emoji: '🍊', fill: '#fb923c', stroke: '#c2410c', highlight: '#fed7aa', style: 'fruit' },
    },
    {
      id: 'apple',
      name: 'Apple',
      visual: { emoji: '🍎', fill: '#ef4444', stroke: '#b91c1c', highlight: '#fca5a5', style: 'fruit', leaf: true },
    },
    {
      id: 'peach',
      name: 'Peach',
      visual: { emoji: '🍑', fill: '#fb7185', stroke: '#e11d48', highlight: '#fecdd3', style: 'fruit' },
    },
    {
      id: 'pear',
      name: 'Pear',
      visual: { emoji: '🍐', fill: '#a3e635', stroke: '#4d7c0f', highlight: '#d9f99d', style: 'fruit', leaf: true },
    },
    {
      id: 'pineapple',
      name: 'Pineapple',
      visual: { emoji: '🍍', fill: '#f59e0b', stroke: '#b45309', highlight: '#fde68a', style: 'fruit', leaf: true },
    },
    {
      id: 'melon',
      name: 'Melon',
      visual: { emoji: '🍈', fill: '#86efac', stroke: '#15803d', highlight: '#dcfce7', style: 'fruit' },
    },
    {
      id: 'watermelon',
      name: 'Watermelon',
      visual: { emoji: '🍉', fill: '#fb7185', stroke: '#166534', highlight: '#fecdd3', style: 'fruit' },
    },
  ]),
};
