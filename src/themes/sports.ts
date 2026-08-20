import { buildObjects } from './build';
import type { Theme } from './types';

export const sportsTheme: Theme = {
  id: 'sports',
  name: 'Sports Arena',
  shortName: 'Sports',
  emoji: '⚽',
  tagline: 'Stadium lights and big plays',
  cssVars: {
    '--bg': '#052e16',
    '--bg2': '#14532d',
    '--text': '#f7fee7',
    '--muted': '#bef264',
    '--panel': 'rgba(20, 83, 45, 0.7)',
    '--panel-border': 'rgba(190, 242, 100, 0.28)',
    '--accent': '#eab308',
    '--accent-2': '#22c55e',
    '--danger': '#f87171',
    '--stage': 'linear-gradient(180deg, #14532d 0%, #166534 40%, #15803d 70%, #3f6212 100%)',
    '--hud': 'rgba(5, 46, 22, 0.86)',
    '--shadow': 'rgba(234, 179, 8, 0.22)',
    '--btn-text': '#14532d',
  },
  objects: buildObjects('sports', [
    {
      id: 'pingpong',
      name: 'Ping-pong ball',
      visual: { fill: '#fef08a', stroke: '#f97316', highlight: '#ffffff', style: 'ball' },
    },
    {
      id: 'golf',
      name: 'Golf ball',
      visual: { fill: '#f8fafc', stroke: '#cbd5e1', highlight: '#ffffff', style: 'ball' },
    },
    {
      id: '8ball',
      name: '8-ball',
      visual: { fill: '#111827', stroke: '#f8fafc', highlight: '#64748b', style: 'ball' },
    },
    {
      id: 'tennis',
      name: 'Tennis ball',
      visual: { fill: '#d9f99d', stroke: '#ffffff', highlight: '#ecfccb', style: 'ball' },
    },
    {
      id: 'baseball',
      name: 'Baseball',
      visual: { fill: '#fff7ed', stroke: '#ef4444', highlight: '#ffffff', style: 'ball' },
    },
    {
      id: 'volleyball',
      name: 'Volleyball',
      visual: { fill: '#fff7ed', stroke: '#f97316', highlight: '#ffffff', style: 'ball' },
    },
    {
      id: 'soccer',
      name: 'Soccer ball',
      visual: { fill: '#f8fafc', stroke: '#111827', highlight: '#e2e8f0', style: 'ball' },
    },
    {
      id: 'football',
      name: 'American football',
      visual: { fill: '#7c2d12', stroke: '#f8fafc', highlight: '#fdba74', style: 'ball' },
    },
    {
      id: 'rugby',
      name: 'Rugby ball',
      visual: { fill: '#92400e', stroke: '#f8fafc', highlight: '#fdba74', style: 'ball' },
    },
    {
      id: 'basketball',
      name: 'Basketball',
      visual: { fill: '#ea580c', stroke: '#111827', highlight: '#fdba74', style: 'ball' },
    },
    {
      id: 'trophy',
      name: 'Trophy',
      visual: { fill: '#eab308', stroke: '#854d0e', highlight: '#fef08a', style: 'ball' },
    },
  ]),
};
