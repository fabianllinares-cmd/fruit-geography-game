import manifest from './asset_manifest.json';

export type ThemeId = keyof typeof manifest.themes;
export type UiId = keyof typeof manifest.ui;

export const ASSET_MANIFEST = manifest;

export const THEME_IDS = ['classic', 'night', 'tropical', 'sports', 'drinks'] as const satisfies readonly ThemeId[];

export interface SpriteRow {
  level: number;
  id: string;
  file: string;
}

export function themeSprites(themeId: ThemeId): SpriteRow[] {
  return manifest.themes[themeId].map((row) => ({
    level: row.level,
    id: row.name,
    file: row.file,
  }));
}

export function assetUrl(relPath: string): string {
  const base = import.meta.env.BASE_URL || './';
  const prefix = base.endsWith('/') ? base : `${base}/`;
  return `${prefix}${relPath.replace(/^\.?\//, '')}`;
}

export function spritePath(themeId: ThemeId, level: number): string {
  const row = manifest.themes[themeId][level];
  if (!row) throw new Error(`Missing sprite for ${themeId} level ${level + 1}`);
  return row.file;
}

export function backgroundPath(themeId: ThemeId): string {
  return manifest.backgrounds[themeId];
}

export function uiPath(id: UiId): string {
  return manifest.ui[id];
}

/** V2 pack has no dedicated sound glyphs; keep the existing mute/unmute icons. */
const SOUND_BUTTONS = {
  sound_on: 'assets/images/ui/buttons/btn_sound_on.png',
  sound_off: 'assets/images/ui/buttons/btn_sound_off.png',
} as const;

export function buttonPath(id: 'play' | 'pause' | 'menu' | 'sound_on' | 'sound_off'): string {
  if (id === 'sound_on' || id === 'sound_off') return SOUND_BUTTONS[id];
  if (id === 'pause') return manifest.ui.menu;
  return manifest.ui[id];
}

const EFFECT_UI: Record<'globe' | 'bubbles' | 'target' | 'map' | 'energy' | 'quiz', UiId> = {
  globe: 'globe',
  bubbles: 'sweep',
  target: 'target',
  map: 'globe',
  energy: 'energy',
  quiz: 'energy',
};

export function effectPath(id: keyof typeof EFFECT_UI): string {
  return manifest.ui[EFFECT_UI[id]];
}

export function allAssetPaths(): string[] {
  const files: string[] = [];
  for (const themeId of THEME_IDS) {
    for (const row of manifest.themes[themeId]) files.push(row.file);
    files.push(manifest.backgrounds[themeId]);
  }
  files.push(...Object.values(manifest.ui));
  files.push(...Object.values(SOUND_BUTTONS));
  return files;
}
