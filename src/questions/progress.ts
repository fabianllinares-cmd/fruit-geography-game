import type { Difficulty } from './types';

export type { Difficulty };

/**
 * Map score / highest merge / drops onto early / mid / late game.
 * Any one of the three signals can advance the tier so a high-scoring
 * short run and a long low-scoring run both get harder questions.
 */
export function progression(score: number, highestLevel: number, droppedCount: number): number {
  return Math.max(score / 900, highestLevel / 8, droppedCount / 48);
}

export function difficultyFor(score: number, highestLevel: number, droppedCount: number): Difficulty {
  const p = progression(score, highestLevel, droppedCount);
  if (p < 0.33) return 'easy';
  if (p < 0.75) return 'mid';
  return 'late';
}

/** Energy required to unlock a quiz. Lower later in a run so questions appear more often. */
export function challengeThreshold(score: number, highestLevel: number, droppedCount: number): number {
  const p = progression(score, highestLevel, droppedCount);
  if (p < 0.33) return 100;
  if (p < 0.75) return 82;
  return 68;
}
