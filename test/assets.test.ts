import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import {
  ASSET_MANIFEST,
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

describe('production asset pack', () => {
  it('includes 55 sprites, 5 backgrounds, 5 buttons and 6 effects', () => {
    expect(ASSET_MANIFEST.counts.item_sprites).toBe(55);
    expect(ASSET_MANIFEST.counts.backgrounds).toBe(5);
    expect(ASSET_MANIFEST.counts.ui_buttons).toBe(5);
    expect(ASSET_MANIFEST.counts.effects).toBe(6);
    expect(allAssetPaths()).toHaveLength(71);
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
    for (const theme of THEMES) {
      const rows = ASSET_MANIFEST.themes[theme.id as (typeof THEME_IDS)[number]];
      expect(theme.objects).toHaveLength(11);
      theme.objects.forEach((object, index) => {
        expect(object.id).toBe(rows[index].id);
        expect(object.visual.sprite).toBe(rows[index].file);
        expect(object.radius).toBe(RADII[index]);
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

  it('starts Sports with the shuttlecock and Classic/Night with cherry', () => {
    expect(ASSET_MANIFEST.themes.sports[0].id).toBe('shuttlecock');
    expect(ASSET_MANIFEST.themes.classic.map((row) => row.id)).toEqual(
      ASSET_MANIFEST.themes.night.map((row) => row.id),
    );
    expect(ASSET_MANIFEST.themes.classic[0].id).toBe('cherry');
    expect(ASSET_MANIFEST.themes.drinks[10].id).toBe('bottle');
    expect(ASSET_MANIFEST.themes.tropical[5].id).toBe('banana');
  });
});
