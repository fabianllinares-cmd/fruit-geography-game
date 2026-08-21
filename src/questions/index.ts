export type { Difficulty, Question } from './types';
export { CLASSIC_QUESTIONS } from './classic';
export { TROPICAL_QUESTIONS } from './tropical';
export { SPORTS_QUESTIONS } from './sports';
export { NIGHT_QUESTIONS } from './night';
export { DRINKS_QUESTIONS } from './drinks';
export { QuestionDeck, isCorrect, questionsFor, questionsForTier, type PresentedQuestion } from './deck';
export { localizeQuestion, translateAnswer, translateCategory, hasPromptTranslation } from './localize';
export { challengeThreshold, difficultyFor, progression } from './progress';

import { CLASSIC_QUESTIONS } from './classic';
import { questionsFor } from './deck';
import type { Question } from './types';

export function questionCount(themeId = 'classic'): number {
  return questionsFor(themeId).length;
}

export function questionById(id: string, themeId?: string): Question | undefined {
  if (themeId) return questionsFor(themeId).find((item) => item.id === id);
  for (const bank of ['classic', 'tropical', 'sports', 'night'] as const) {
    const match = questionsFor(bank).find((item) => item.id === id);
    if (match) return match;
  }
  return undefined;
}

/** Combined classic geography bank, used by older tests and the menu fallback. */
export const QUESTIONS = CLASSIC_QUESTIONS;
