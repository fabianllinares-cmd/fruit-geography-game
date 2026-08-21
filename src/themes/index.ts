import { assetUrl, backgroundPath, type ThemeId } from '../assets/catalog';
import type { ObjectDef, Theme } from './types';

export type { Theme, ObjectDef, VisualSpec } from './types';
export { classicTheme } from './classic';
export { drinksTheme } from './drinks';
export { nightTheme } from './night';
export { sportsTheme } from './sports';
export { tropicalTheme } from './tropical';

import { classicTheme } from './classic';
import { drinksTheme } from './drinks';
import { nightTheme } from './night';
import { sportsTheme } from './sports';
import { tropicalTheme } from './tropical';

export const THEMES: Theme[] = [classicTheme, nightTheme, tropicalTheme, sportsTheme, drinksTheme];

export function getTheme(id: string | null | undefined): Theme {
  return THEMES.find((theme) => theme.id === id) ?? classicTheme;
}

/** Production sprite used as the small theme logo in the HUD and theme picker. */
export const THEME_LOGO_OBJECT_ID: Record<ThemeId, string> = {
  classic: 'apple',
  night: 'gooseberry',
  tropical: 'passionfruit',
  sports: 'soccer',
  drinks: 'martini',
};

export function themeLogoObject(theme: Theme): ObjectDef {
  const id = THEME_LOGO_OBJECT_ID[theme.id as ThemeId];
  return theme.objects.find((object) => object.id === id) ?? theme.objects[0];
}

export function applyThemeVars(theme: Theme, root: HTMLElement = document.documentElement): void {
  root.dataset.theme = theme.id;
  for (const [key, value] of Object.entries(theme.cssVars)) {
    root.style.setProperty(key, value);
  }
  const bg = document.getElementById('board-bg') as HTMLImageElement | null;
  if (bg) {
    bg.src = assetUrl(backgroundPath(theme.id as ThemeId));
    bg.alt = `${theme.name} background`;
  }
}
