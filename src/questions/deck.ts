import { CLASSIC_QUESTIONS } from './classic';
import { DRINKS_QUESTIONS } from './drinks';
import { NIGHT_QUESTIONS } from './night';
import { SPORTS_QUESTIONS } from './sports';
import { TROPICAL_QUESTIONS } from './tropical';
import type { Difficulty, Question } from './types';

export interface PresentedQuestion extends Question {
  shuffled: string[];
}

function shuffle<T>(items: T[], random: () => number): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

const BANKS: Record<string, Question[]> = {
  classic: CLASSIC_QUESTIONS,
  tropical: TROPICAL_QUESTIONS,
  sports: SPORTS_QUESTIONS,
  night: NIGHT_QUESTIONS,
  drinks: DRINKS_QUESTIONS,
};

export function questionsFor(themeId: string): Question[] {
  return BANKS[themeId] ?? CLASSIC_QUESTIONS;
}

export function questionsForTier(themeId: string, tier: Difficulty): Question[] {
  const bank = questionsFor(themeId);
  const matched = bank.filter((item) => item.tier === tier);
  return matched.length ? matched : bank;
}

export class QuestionDeck {
  private remaining = new Map<string, Question[]>();
  private recent: string[] = [];

  constructor(private readonly random: () => number = Math.random) {}

  remainingCount(themeId = 'classic', tier: Difficulty = 'easy'): number {
    return this._pile(themeId, tier).length;
  }

  reshuffle(themeId: string, tier: Difficulty): void {
    this.remaining.set(this._key(themeId, tier), shuffle(questionsForTier(themeId, tier), this.random));
  }

  draw(themeId = 'classic', tier: Difficulty = 'easy'): PresentedQuestion {
    let pile = this._pile(themeId, tier);
    if (pile.length === 0) {
      this.reshuffle(themeId, tier);
      pile = this._pile(themeId, tier);
    }
    const recent = new Set(this.recent);
    let index = pile.findIndex((item) => !recent.has(item.id));
    if (index < 0) index = pile.length - 1;
    const question = pile.splice(index, 1)[0];
    this.recent.push(question.id);
    if (this.recent.length > 8) this.recent.shift();
    return {
      ...question,
      shuffled: shuffle([...question.choices], this.random),
    };
  }

  private _key(themeId: string, tier: Difficulty): string {
    return `${themeId}:${tier}`;
  }

  private _pile(themeId: string, tier: Difficulty): Question[] {
    const key = this._key(themeId, tier);
    let pile = this.remaining.get(key);
    if (!pile) {
      pile = shuffle(questionsForTier(themeId, tier), this.random);
      this.remaining.set(key, pile);
    }
    return pile;
  }
}

export function isCorrect(question: Question, answer: string): boolean {
  return answer === question.correct;
}
