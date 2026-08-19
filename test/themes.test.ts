import { beforeEach, describe, expect, it, vi } from 'vitest';
import { uiIcons } from '../src/assets';
import { getBest, loadGame, saveBestScore, saveGame } from '../src/persistence';
import { getTheme, THEMES } from '../src/themes';
import { classicTheme } from '../src/themes/classic';
import { drinksTheme } from '../src/themes/drinks';
import { nightTheme } from '../src/themes/night';
import { sportsTheme } from '../src/themes/sports';
import { tropicalTheme } from '../src/themes/tropical';
import { RADII } from '../src/themes/types';

describe('themes', () => {
  it('exposes five data-driven themes with 11 objects each', () => {
    expect(THEMES.map((t) => t.id)).toEqual(['classic', 'night', 'tropical', 'sports', 'drinks']);
    for (const theme of THEMES) {
      expect(theme.objects).toHaveLength(11);
      expect(theme.objects[0].mergeTarget).toBe(theme.objects[1].id);
      expect(theme.objects[10].mergeTarget).toBeNull();
      expect(theme.objects[10].radius).toBeGreaterThan(theme.objects[0].radius);
      expect(theme.objects.map((o) => o.radius)).toEqual([...RADII]);
    }
    expect(classicTheme.objects[0].name).toBe('Cherry');
    expect(nightTheme.objects[0].name).toBe('Cherry');
    expect(tropicalTheme.objects[2].name).toBe('Kiwi');
    expect(sportsTheme.objects[7].name).toBe('Volleyball');
    expect(drinksTheme.objects[4].name).toBe('Martini');
    expect(getTheme('sports').id).toBe('sports');
    expect(getTheme('missing').id).toBe('classic');
  });

  it('uses the visual-reference progression names', () => {
    expect(classicTheme.objects.map((o) => o.name)).toEqual([
      'Cherry',
      'Strawberry',
      'Blueberry',
      'Grape',
      'Lime',
      'Orange',
      'Apple',
      'Pear',
      'Peach',
      'Pineapple',
      'Watermelon',
    ]);
    expect(nightTheme.objects.map((o) => o.name)).toEqual(classicTheme.objects.map((o) => o.name));
    expect(tropicalTheme.objects.map((o) => o.name)).toEqual([
      'Coconut berry',
      'Starfruit',
      'Kiwi',
      'Passion fruit',
      'Mango',
      'Banana',
      'Dragon fruit',
      'Papaya',
      'Coconut',
      'Pineapple',
      'Watermelon',
    ]);
    expect(sportsTheme.objects.map((o) => o.name)).toEqual([
      'Ping-pong ball',
      'Golf ball',
      '8-ball',
      'Tennis ball',
      'Baseball',
      'Bowling ball',
      'American football',
      'Volleyball',
      'Basketball',
      'Soccer ball',
      'Championship ball',
    ]);
    expect(drinksTheme.objects.map((o) => o.name)).toEqual([
      'Ice cube',
      'Olive',
      'Shot glass',
      'Wine glass',
      'Martini',
      'Whiskey',
      'Cocktail',
      'Margarita',
      'Mojito',
      'Champagne',
      'Celebration bottle',
    ]);
  });

  it('binds local artwork to every theme object, icon, and board background', () => {
    for (const theme of THEMES) {
      expect(theme.icon).toMatch(/\.svg/);
      expect(theme.background).toMatch(/\.svg/);
      expect(theme.objects).toHaveLength(11);
      const srcs = new Set(theme.objects.map((obj) => obj.visual.src));
      expect(srcs.size).toBe(11);
      for (const obj of theme.objects) {
        expect(obj.visual.src).toMatch(/\.svg/);
        expect(obj.radius).toBeGreaterThan(0);
      }
    }
  });

  it('exposes local UI icons for power-ups, menu, sound, quiz, and energy', () => {
    for (const key of ['shake', 'sweep', 'target', 'geography', 'energy', 'quiz', 'menu', 'sound-on', 'sound-off']) {
      expect(uiIcons[key]).toMatch(/\.svg/);
    }
  });
});

describe('best-score persistence', () => {
  beforeEach(() => {
    const mem = new Map<string, string>();
    vi.stubGlobal('localStorage', {
      getItem: (k: string) => mem.get(k) ?? null,
      setItem: (k: string, v: string) => {
        mem.set(k, v);
      },
      removeItem: (k: string) => {
        mem.delete(k);
      },
      clear: () => mem.clear(),
    });
  });

  it('stores separate best scores per theme', () => {
    saveBestScore('classic', 40);
    saveBestScore('night', 90);
    saveBestScore('classic', 25);
    expect(getBest('classic')).toBe(40);
    expect(getBest('night')).toBe(90);
    expect(getBest('sports')).toBe(0);
  });

  it('round-trips an active game snapshot', () => {
    saveGame({
      version: 1,
      themeId: 'tropical',
      score: 77,
      energy: 40,
      currentLevel: 1,
      nextLevel: 2,
      highestLevel: 4,
      geoCorrect: 3,
      geoAsked: 4,
      droppedCount: 9,
      bodies: [{ level: 2, x: 100, y: 200, angle: 0.1, vx: 0, vy: 1, angularVelocity: 0 }],
    });
    const loaded = loadGame();
    expect(loaded?.themeId).toBe('tropical');
    expect(loaded?.score).toBe(77);
    expect(loaded?.bodies).toHaveLength(1);
  });
});
