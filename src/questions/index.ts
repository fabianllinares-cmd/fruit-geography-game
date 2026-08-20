export type { Difficulty, Question } from './types';
export { CLASSIC_QUESTIONS } from './classic';
export { TROPICAL_QUESTIONS } from './tropical';
export { SPORTS_QUESTIONS } from './sports';
export { NIGHT_QUESTIONS } from './night';
export { DRINKS_QUESTIONS } from './drinks';
export { QuestionDeck, isCorrect, questionsFor, questionsForTier, type PresentedQuestion } from './deck';
export { challengeThreshold, difficultyFor, progression } from './progress';

import { CLASSIC_QUESTIONS } from './classic';
import { questionsFor } from './deck';

export function questionCount(themeId = 'classic'): number {
  return questionsFor(themeId).length;
}

/** Combined classic geography bank, used by older tests and the menu fallback. */
export const QUESTIONS = CLASSIC_QUESTIONS;
