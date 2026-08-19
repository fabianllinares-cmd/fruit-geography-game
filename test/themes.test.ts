import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getBest, loadGame, saveBestScore, saveGame } from '../src/persistence';
import { getTheme, THEMES } from '../src/themes';
import { classicTheme } from '../src/themes/classic';
import { drinksTheme } from '../src/themes/drinks';
import { nightTheme } from '../src/themes/night';
import { sportsTheme } from '../src/themes/sports';
import { tropicalTheme } from '../src/themes/tropical';

describe('themes', () => {
  it('exposes five data-driven themes with 11 objects each', () => {
    expect(THEMES.map((t) => t.id)).toEqual(['classic', 'night', 'tropical', 'sports', 'drinks']);
    for (const theme of THEMES) {
      expect(theme.objects).toHaveLength(11);
      expect(theme.objects[0].mergeTarget).toBe(theme.objects[1].id);
      expect(theme.objects[10].mergeTarget).toBeNull();
      expect(theme.objects[10].radius).toBeGreaterThan(theme.objects[0].radius);
    }
    expect(classicTheme.objects[0].name).toBe('Blueberry');
    expect(nightTheme.objects[0].name).toBe('Blueberry');
    expect(classicTheme.objects.map((object) => object.id)).toEqual([
      'blueberry',
      'gooseberry',
      'strawberry',
      'grapes',
      'lemon',
      'orange',
      'apple',
      'pear',
      'peach',
      'pineapple',
      'watermelon',
    ]);
    expect(nightTheme.objects.map((object) => object.id)).toEqual(
      classicTheme.objects.map((object) => object.id),
    );
    expect(nightTheme.objects.map((object) => object.visual.sprite)).toEqual(
      classicTheme.objects.map((object) => object.visual.sprite),
    );
    expect(tropicalTheme.objects.map((object) => object.id)).toEqual([
      'raspberry',
      'starfruit',
      'kiwi',
      'passionfruit',
      'mango',
      'banana',
      'dragonfruit',
      'papaya',
      'coconut',
      'pineapple',
      'watermelon',
    ]);
    expect(tropicalTheme.objects[9].visual.sprite).toBe(classicTheme.objects[9].visual.sprite);
    expect(tropicalTheme.objects[10].visual.sprite).toBe(classicTheme.objects[10].visual.sprite);
    expect(tropicalTheme.objects[2].name).toBe('Kiwi');
    expect(sportsTheme.objects[0].name).toBe('Shuttlecock');
    expect(sportsTheme.objects[7].name).toBe('Basketball');
    expect(drinksTheme.objects[4].name).toBe('Martini');
    expect(getTheme('sports').id).toBe('sports');
    expect(getTheme('missing').id).toBe('classic');
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
