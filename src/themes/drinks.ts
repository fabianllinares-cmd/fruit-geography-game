import { buildObjects } from './build';
import type { Theme } from './types';

export const drinksTheme: Theme = {
  id: 'drinks',
  name: 'Nightcap Bar',
  shortName: 'Drinks',
  emoji: '🍸',
  tagline: 'Stylized glasses, no labels',
  cssVars: {
    '--bg': '#1c1016',
    '--bg2': '#3b1224',
    '--text': '#fef3c7',
    '--muted': '#e8c07a',
    '--panel': 'rgba(40, 20, 28, 0.78)',
    '--panel-border': 'rgba(232, 192, 122, 0.28)',
    '--accent': '#e8c07a',
    '--accent-2': '#fb7185',
    '--danger': '#fda4af',
    '--stage': 'linear-gradient(180deg, #2a151c 0%, #3b1224 45%, #1c1016 100%)',
    '--hud': 'rgba(28, 16, 22, 0.9)',
    '--shadow': 'rgba(232, 192, 122, 0.16)',
    '--btn-text': '#1c1016',
  },
  objects: buildObjects('drinks', [
    {
      id: 'ice',
      name: 'Ice cube',
      visual: { fill: '#bae6fd', stroke: '#38bdf8', highlight: '#ffffff', style: 'drink' },
    },
    {
      id: 'shot',
      name: 'Shot glass',
      visual: { fill: '#f59e0b', stroke: '#e8c07a', highlight: '#fde68a', style: 'drink' },
    },
    {
      id: 'whiskey',
      name: 'Whiskey glass',
      visual: { fill: '#b45309', stroke: '#e8c07a', highlight: '#fdba74', style: 'drink' },
    },
    {
      id: 'champagne',
      name: 'Champagne flute',
      visual: { fill: '#fde68a', stroke: '#e8c07a', highlight: '#ffffff', style: 'drink' },
    },
    {
      id: 'wine_white',
      name: 'White wine glass',
      visual: { fill: '#fef9c3', stroke: '#e8c07a', highlight: '#ffffff', style: 'drink' },
    },
    {
      id: 'wine_red',
      name: 'Red wine glass',
      visual: { fill: '#9f1239', stroke: '#e8c07a', highlight: '#fb7185', style: 'drink' },
    },
    {
      id: 'martini',
      name: 'Martini glass',
      visual: { fill: '#e5e7eb', stroke: '#e8c07a', highlight: '#ffffff', style: 'drink' },
    },
    {
      id: 'long',
      name: 'Long drink',
      visual: { fill: '#fb923c', stroke: '#e8c07a', highlight: '#fed7aa', style: 'drink' },
    },
    {
      id: 'beer',
      name: 'Beer mug',
      visual: { fill: '#f59e0b', stroke: '#e8c07a', highlight: '#fde68a', style: 'drink' },
    },
    {
      id: 'cocktail',
      name: 'Cocktail glass',
      visual: { fill: '#fb7185', stroke: '#e8c07a', highlight: '#fecdd3', style: 'drink' },
    },
    {
      id: 'bottle',
      name: 'Champagne bottle',
      visual: { fill: '#14532d', stroke: '#e8c07a', highlight: '#86efac', style: 'drink' },
    },
  ]),
};
