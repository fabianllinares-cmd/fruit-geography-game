export type Difficulty = 'easy' | 'mid' | 'late';

export interface Question {
  id: string;
  category: string;
  prompt: string;
  correct: string;
  choices: [string, string, string, string];
  fact?: string;
  tier: Difficulty;
}

export function q(
  id: string,
  category: string,
  prompt: string,
  correct: string,
  choices: [string, string, string, string],
  tier: Difficulty,
  fact?: string,
): Question {
  return { id, category, prompt, correct, choices, tier, fact };
}
