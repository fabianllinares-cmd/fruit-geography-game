import { classicTheme } from './classic';
import { drinksTheme } from './drinks';
import { nightTheme } from './night';
import { sportsTheme } from './sports';
import { tropicalTheme } from './tropical';
import type { Theme } from './types';

export type { Theme, ObjectDef, VisualSpec } from './types';

export const THEMES: Theme[] = [classicTheme, nightTheme, tropicalTheme, sportsTheme, drinksTheme];

export function getTheme(id: string | null | undefined): Theme {
  return THEMES.find((theme) => theme.id === id) ?? classicTheme;
}

export function applyThemeVars(theme: Theme, root: HTMLElement = document.documentElement): void {
  root.dataset.theme = theme.id;
  for (const [key, value] of Object.entries(theme.cssVars)) {
    root.style.setProperty(key, value);
  }
}
