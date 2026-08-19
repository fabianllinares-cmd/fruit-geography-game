/** Near-exponential merge scores. Index is the resulting object level. */
export const SCORES = [1, 3, 7, 15, 31, 63, 127, 255, 511, 1023, 2047] as const;

export const LEVEL_COUNT = SCORES.length;
export const MAX_LEVEL = LEVEL_COUNT - 1;

export function scoreForMerge(resultLevel: number): number {
  if (resultLevel < 0 || resultLevel >= SCORES.length) return 0;
  return SCORES[resultLevel];
}

export function canMerge(levelA: number, levelB: number, maxLevel = MAX_LEVEL): boolean {
  return levelA === levelB && levelA < maxLevel;
}

export function nextLevel(level: number, maxLevel = MAX_LEVEL): number | null {
  if (level < 0 || level >= maxLevel) return null;
  return level + 1;
}
