import type { SavedGame } from './game/types';

const PREFIX = 'fruit-geo-v1';

export const KEYS = {
  best: `${PREFIX}-best`,
  lastTheme: `${PREFIX}-last-theme`,
  save: `${PREFIX}-save`,
  sound: `${PREFIX}-sound`,
} as const;

export type BestScores = Record<string, number>;

function storage(): Storage | null {
  try {
    return globalThis.localStorage ?? null;
  } catch {
    return null;
  }
}

export function loadBestScores(): BestScores {
  const raw = storage()?.getItem(KEYS.best);
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw) as BestScores;
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

export function saveBestScore(themeId: string, score: number): BestScores {
  const best = loadBestScores();
  if (score > (best[themeId] ?? 0)) {
    best[themeId] = score;
    storage()?.setItem(KEYS.best, JSON.stringify(best));
  }
  return best;
}

export function getBest(themeId: string): number {
  return loadBestScores()[themeId] ?? 0;
}

export function loadLastTheme(): string | null {
  return storage()?.getItem(KEYS.lastTheme) ?? null;
}

export function saveLastTheme(themeId: string): void {
  storage()?.setItem(KEYS.lastTheme, themeId);
}

export function loadSoundEnabled(): boolean {
  const raw = storage()?.getItem(KEYS.sound);
  return raw !== 'off';
}

export function saveSoundEnabled(on: boolean): void {
  storage()?.setItem(KEYS.sound, on ? 'on' : 'off');
}

export function loadGame(): SavedGame | null {
  const raw = storage()?.getItem(KEYS.save);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as SavedGame;
    if (parsed?.version !== 1 || !Array.isArray(parsed.bodies)) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function saveGame(game: SavedGame | null): void {
  const store = storage();
  if (!store) return;
  if (!game) {
    store.removeItem(KEYS.save);
    return;
  }
  store.setItem(KEYS.save, JSON.stringify(game));
}

export function clearGame(): void {
  storage()?.removeItem(KEYS.save);
}
