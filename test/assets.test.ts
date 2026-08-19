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
  themeSprites,
  uiPath,
} from '../src/assets/catalog';
import { spriteDrawSize } from '../src/game/draw';
import { SPRITE_VISUAL_SCALE, colliderFor } from '../src/game/colliders';
import { THEMES } from '../src/themes';
import { RADII } from '../src/themes/types';
import { spriteFrame } from '../src/assets/sprite-frame';

const root = path.resolve(fileURLToPath(new URL('..', import.meta.url)));

function publicFile(rel: string): string {
  return path.join(root, 'public', rel);
}

describe('V2 production asset pack', () => {
  it('maps 55 sprites, 5 native backgrounds and the supplied UI icons', () => {
    expect(ASSET_MANIFEST.version).toBe('2.0');
    expect(allAssetPaths().filter((file) => file.startsWith('sprites/'))).toHaveLength(55);
    expect(Object.keys(ASSET_MANIFEST.backgrounds)).toHaveLength(5);
    expect(Object.keys(ASSET_MANIFEST.ui)).toHaveLength(6);
    for (const file of allAssetPaths()) {
      expect(existsSync(publicFile(file)), file).toBe(true);
    }
  });

  it('maps every theme level 1-11 to the matching V2 PNG on disk', () => {
    for (const themeId of THEME_IDS) {
      const rows = themeSprites(themeId);
      expect(rows).toHaveLength(11);
      rows.forEach((row, index) => {
        expect(row.level).toBe(index + 1);
        expect(existsSync(publicFile(row.file)), row.file).toBe(true);
        expect(spriteFrame(row.file)?.sw).toBeGreaterThan(100);
        expect(spriteFrame(row.file)?.sh).toBeGreaterThan(100);
      });
      expect(existsSync(publicFile(backgroundPath(themeId))), backgroundPath(themeId)).toBe(true);
    }
  });

  it('keeps theme object ids aligned with the V2 manifest', () => {
    for (const theme of THEMES) {
      const rows = themeSprites(theme.id as (typeof THEME_IDS)[number]);
      expect(theme.objects).toHaveLength(11);
      theme.objects.forEach((object, index) => {
        expect(object.id).toBe(rows[index].id);
        expect(object.visual.sprite).toBe(rows[index].file);
        expect(object.radius).toBe(RADII[index]);
        const drawn = spriteDrawSize(object);
        expect(Math.max(drawn.width, drawn.height)).toBeCloseTo(object.radius * 2 * SPRITE_VISUAL_SCALE, 5);
      });
    }
  });

  it('resolves V2 UI icons and keeps sound glyphs available', () => {
    for (const id of ['globe', 'target', 'menu', 'energy', 'play', 'sweep'] as const) {
      expect(existsSync(publicFile(uiPath(id))), uiPath(id)).toBe(true);
    }
    expect(existsSync(publicFile(buttonPath('play')))).toBe(true);
    expect(existsSync(publicFile(buttonPath('menu')))).toBe(true);
    expect(existsSync(publicFile(buttonPath('sound_on')))).toBe(true);
    expect(existsSync(publicFile(buttonPath('sound_off')))).toBe(true);
    expect(effectPath('bubbles')).toBe(uiPath('sweep'));
    expect(effectPath('globe')).toBe(uiPath('globe'));
  });

  it('uses the V2 sports and drinks progressions', () => {
    expect(themeSprites('sports').map((row) => row.id)).toEqual([
      'shuttlecock',
      'ping_pong_ball',
      'tennis_ball',
      'baseball',
      'softball',
      'eight_ball',
      'volleyball',
      'basketball',
      'soccer_ball',
      'american_football',
      'trophy',
    ]);
    expect(themeSprites('night')[8].id).toBe('plum');
    expect(themeSprites('drinks')[0].id).toBe('ice_cube');
    expect(themeSprites('drinks')[10].id).toBe('bottle');
    expect(themeSprites('tropical')[5].id).toBe('banana');
  });

  it('uses non-circular colliders for drinks and selected sports', () => {
    expect(colliderFor('drinks', 0).kind).toBe('box');
    expect(colliderFor('drinks', 1).kind).toBe('circle');
    expect(colliderFor('drinks', 2).kind).toBe('rounded-box');
    expect(colliderFor('drinks', 3).kind).toBe('stem-glass');
    expect(colliderFor('drinks', 4).kind).toBe('stem-glass');
    expect(colliderFor('drinks', 8).kind).toBe('rounded-box');
    expect(colliderFor('drinks', 10).kind).toBe('capsule');
    expect(colliderFor('drinks', 10).width).toBeLessThan(colliderFor('drinks', 10).height);
    expect(colliderFor('drinks', 6).width).toBeLessThan(colliderFor('drinks', 6).height);
    expect(colliderFor('sports', 0).kind).toBe('capsule');
    expect(colliderFor('sports', 3).kind).toBe('circle');
    expect(colliderFor('classic', 0).kind).toBe('circle');
  });
});
