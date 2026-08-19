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
    '--stage': '#1d4d2a',
    '--hud': 'rgba(5, 46, 22, 0.86)',
    '--shadow': 'rgba(234, 179, 8, 0.22)',
    '--btn-text': '#14532d',
  },
  objects: buildObjects('sports', [
    {
      id: 'shuttlecock',
      name: 'Shuttlecock',
      visual: { fill: '#f8fafc', stroke: '#cbd5e1', highlight: '#ffffff', style: 'ball' },
    },
    {
      id: 'ping_pong_ball',
      name: 'Ping-pong ball',
      visual: { fill: '#f8fafc', stroke: '#f97316', highlight: '#ffffff', style: 'ball' },
    },
    {
      id: 'tennis_ball',
      name: 'Tennis ball',
      visual: { fill: '#d9f99d', stroke: '#ffffff', highlight: '#ecfccb', style: 'ball' },
    },
    {
      id: 'baseball',
      name: 'Baseball',
      visual: { fill: '#fff7ed', stroke: '#ef4444', highlight: '#ffffff', style: 'ball' },
    },
    {
      id: 'softball',
      name: 'Softball',
      visual: { fill: '#fde68a', stroke: '#d97706', highlight: '#fef9c3', style: 'ball' },
    },
    {
      id: 'eight_ball',
      name: '8-ball',
      visual: { fill: '#111827', stroke: '#f8fafc', highlight: '#64748b', style: 'ball' },
    },
    {
      id: 'volleyball',
      name: 'Volleyball',
      visual: { fill: '#fff7ed', stroke: '#f97316', highlight: '#ffffff', style: 'ball' },
    },
    {
      id: 'basketball',
      name: 'Basketball',
      visual: { fill: '#ea580c', stroke: '#111827', highlight: '#fdba74', style: 'ball' },
    },
    {
      id: 'soccer_ball',
      name: 'Soccer ball',
      visual: { fill: '#f8fafc', stroke: '#111827', highlight: '#e2e8f0', style: 'ball' },
    },
    {
      id: 'american_football',
      name: 'American football',
      visual: { fill: '#7c2d12', stroke: '#f8fafc', highlight: '#fdba74', style: 'ball' },
    },
    {
      id: 'trophy',
      name: 'Trophy',
      visual: { fill: '#eab308', stroke: '#854d0e', highlight: '#fef08a', style: 'ball' },
    },
  ]),
};
