import manifest from './asset_manifest.json';

export type ThemeId = keyof typeof manifest.themes;

export const ASSET_MANIFEST = manifest;

export const THEME_IDS = ['classic', 'night', 'tropical', 'sports', 'drinks'] as const satisfies readonly ThemeId[];

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

export function buttonPath(id: keyof typeof manifest.buttons): string {
  return manifest.buttons[id];
}

export function effectPath(id: keyof typeof manifest.effects): string {
  return manifest.effects[id];
}

export function allAssetPaths(): string[] {
  const files: string[] = [];
  for (const themeId of THEME_IDS) {
    for (const row of manifest.themes[themeId]) files.push(row.file);
    files.push(manifest.backgrounds[themeId]);
  }
  files.push(...Object.values(manifest.buttons));
  files.push(...Object.values(manifest.effects));
  return files;
}
