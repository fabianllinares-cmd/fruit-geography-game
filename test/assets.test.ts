import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import {
  ASSET_MANIFEST,
  CLASSIC_FRUIT_IDS,
  THEME_IDS,
  allAssetPaths,
  backgroundPath,
  buttonPath,
  effectPath,
} from '../src/assets/catalog';
import { THEMES } from '../src/themes';
import { RADII } from '../src/themes/types';

const root = path.resolve(fileURLToPath(new URL('..', import.meta.url)));

function publicFile(rel: string): string {
  return path.join(root, 'public', rel);
}

const CANONICAL_FILES = CLASSIC_FRUIT_IDS.map((id) => `assets/images/fruits/${id}.png`);

describe('production asset pack', () => {
  it('includes unique sprites, 5 backgrounds, 5 buttons and 6 effects', () => {
    expect(ASSET_MANIFEST.counts.item_sprites).toBe(42);
    expect(ASSET_MANIFEST.counts.backgrounds).toBe(5);
    expect(ASSET_MANIFEST.counts.ui_buttons).toBe(5);
    expect(ASSET_MANIFEST.counts.effects).toBe(6);
    const files = allAssetPaths();
    expect(new Set(files).size).toBe(files.length);
    expect(files).toHaveLength(58);
  });

  it('maps every theme level 1-11 to the matching PNG on disk', () => {
    for (const themeId of THEME_IDS) {
      const rows = ASSET_MANIFEST.themes[themeId];
      expect(rows).toHaveLength(11);
      rows.forEach((row, index) => {
        expect(row.level).toBe(index + 1);
        expect(existsSync(publicFile(row.file)), row.file).toBe(true);
      });
      expect(existsSync(publicFile(backgroundPath(themeId))), backgroundPath(themeId)).toBe(true);
    }
  });

  it('keeps theme object ids aligned with the manifest and existing physics radii', () => {
    const sharedRadii = new Set(['classic', 'night', 'tropical']);
    for (const theme of THEMES) {
      const rows = ASSET_MANIFEST.themes[theme.id as (typeof THEME_IDS)[number]];
      expect(theme.objects).toHaveLength(11);
      theme.objects.forEach((object, index) => {
        expect(object.id).toBe(rows[index].id);
        expect(object.visual.sprite).toBe(rows[index].file);
        if (sharedRadii.has(theme.id)) expect(object.radius).toBe(RADII[index]);
        if (index > 0) expect(object.radius).toBeGreaterThan(theme.objects[index - 1].radius);
      });
    }
  });

  it('resolves all supplied UI and effect files', () => {
    for (const id of ['play', 'pause', 'menu', 'sound_on', 'sound_off'] as const) {
      expect(existsSync(publicFile(buttonPath(id))), buttonPath(id)).toBe(true);
    }
    for (const id of ['globe', 'bubbles', 'target', 'map', 'energy', 'quiz'] as const) {
      expect(existsSync(publicFile(effectPath(id))), effectPath(id)).toBe(true);
    }
  });

  it('uses one canonical PNG per Classic fruit and reuses it for Night', () => {
    expect(ASSET_MANIFEST.themes.classic.map((row) => row.id)).toEqual([...CLASSIC_FRUIT_IDS]);
    expect(ASSET_MANIFEST.themes.night.map((row) => row.id)).toEqual([...CLASSIC_FRUIT_IDS]);
    expect(ASSET_MANIFEST.themes.classic.map((row) => row.file)).toEqual(CANONICAL_FILES);
    expect(ASSET_MANIFEST.themes.night.map((row) => row.file)).toEqual(CANONICAL_FILES);
    expect(ASSET_MANIFEST.themes.sports[0].id).toBe('pingpong');
    expect(ASSET_MANIFEST.themes.sports[6].file).toBe('assets/images/sports/sports_07_soccer.png');
    expect(ASSET_MANIFEST.themes.drinks[10].id).toBe('bottle');
    expect(ASSET_MANIFEST.themes.tropical[1].id).toBe('kiwi');
  });

  it('deduplicates only Tropical fruits that match a canonical Classic fruit', () => {
    const tropical = ASSET_MANIFEST.themes.tropical;
    expect(tropical.map((row) => row.id)).toEqual([
      'raspberry',
      'kiwi',
      'starfruit',
      'passionfruit',
      'dragonfruit',
      'mango',
      'banana',
      'coconut',
      'papaya',
      'pineapple',
      'watermelon',
    ]);
    expect(tropical[9].file).toBe('assets/images/fruits/pineapple.png');
    expect(tropical[10].file).toBe('assets/images/fruits/watermelon.png');
    for (let i = 0; i < 9; i++) {
      expect(tropical[i].file.startsWith('assets/images/tropical/')).toBe(true);
      expect(CANONICAL_FILES.includes(tropical[i].file)).toBe(false);
    }
  });

  it('includes Tropical gameplay music at a GitHub Pages-safe path', () => {
    expect(existsSync(publicFile('assets/audio/bonsai-master.mp3'))).toBe(true);
  });

  it('removes superseded theme sprite files', () => {
    expect(existsSync(publicFile('assets/images/classic/classic_01_cherry.png'))).toBe(false);
    expect(existsSync(publicFile('assets/images/night/night_01_cherry.png'))).toBe(false);
    expect(existsSync(publicFile('assets/images/tropical/tropical_10_pineapple.png'))).toBe(false);
    expect(existsSync(publicFile('assets/images/tropical/tropical_11_watermelon.png'))).toBe(false);
    expect(existsSync(publicFile('assets/images/tropical/tropical_02_kiwi.png'))).toBe(true);
    expect(existsSync(publicFile('assets/images/sports/sports_01_shuttlecock.png'))).toBe(false);
    expect(existsSync(publicFile('assets/images/sports/sports_07_soccer.png'))).toBe(true);
    expect(existsSync(publicFile('assets/images/drinks/drinks_02_olive.png'))).toBe(false);
    expect(existsSync(publicFile('assets/images/drinks/drinks_08_long.png'))).toBe(true);
  });
});
