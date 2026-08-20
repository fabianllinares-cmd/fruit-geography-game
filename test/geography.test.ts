import { describe, expect, it } from 'vitest';
import { isCorrect, QuestionDeck } from '../src/questions/deck';
import {
  CLASSIC_QUESTIONS,
  NIGHT_QUESTIONS,
  QUESTIONS,
  SPORTS_QUESTIONS,
  TROPICAL_QUESTIONS,
  challengeThreshold,
  difficultyFor,
  questionsFor,
} from '../src/questions';

function assertValidBank(bank: typeof QUESTIONS, min = 40): void {
  expect(bank.length).toBeGreaterThanOrEqual(min);
  const ids = new Set(bank.map((q) => q.id));
  expect(ids.size).toBe(bank.length);
  for (const q of bank) {
    expect(q.choices).toHaveLength(4);
    expect(new Set(q.choices).size).toBe(4);
    expect(q.choices).toContain(q.correct);
    expect(['easy', 'mid', 'late']).toContain(q.tier);
  }
}

describe('geography bank', () => {
  it('includes at least 100 unique questions across several categories', () => {
    expect(QUESTIONS.length).toBeGreaterThanOrEqual(100);
    const ids = new Set(QUESTIONS.map((q) => q.id));
    expect(ids.size).toBe(QUESTIONS.length);
    const categories = new Set(QUESTIONS.map((q) => q.category));
    for (const needed of [
      'Capitals',
      'Continents',
      'Countries',
      'Oceans',
      'Flags',
      'Landmarks',
      'Rivers',
      'Mountains',
      'Europe',
      'World',
      'Physical',
    ]) {
      expect(categories.has(needed)).toBe(true);
    }
  });

  it('gives four unique choices including the correct answer', () => {
    for (const q of QUESTIONS) {
      expect(q.choices).toHaveLength(4);
      expect(new Set(q.choices).size).toBe(4);
      expect(q.choices).toContain(q.correct);
    }
  });
});

describe('theme question banks', () => {
  it('keeps Classic and Tropical as geography, Sports as math, Night as astronomy', () => {
    assertValidBank(CLASSIC_QUESTIONS, 100);
    assertValidBank(TROPICAL_QUESTIONS, 50);
    assertValidBank(SPORTS_QUESTIONS, 50);
    assertValidBank(NIGHT_QUESTIONS, 50);
    expect(questionsFor('classic').every((q) => q.category !== 'Math')).toBe(true);
    expect(SPORTS_QUESTIONS.every((q) => q.category === 'Math')).toBe(true);
    expect(NIGHT_QUESTIONS.every((q) => q.category === 'Space')).toBe(true);
    expect(NIGHT_QUESTIONS.some((q) => /black hole|light-year|andromeda/i.test(q.prompt))).toBe(true);
    expect(NIGHT_QUESTIONS.every((q) => !/relativity|quantum|parsec|redshift/i.test(q.prompt))).toBe(true);
  });
});

describe('question selection and answers', () => {
  it('randomizes order and avoids immediate repeats until the deck is exhausted', () => {
    let seq = 0;
    const deck = new QuestionDeck(() => {
      seq += 1;
      return (seq % 10) / 10;
    });
    const first = deck.draw('classic', 'easy');
    const seen = new Set([first.id]);
    const easyCount = CLASSIC_QUESTIONS.filter((q) => q.tier === 'easy').length;
    for (let i = 0; i < easyCount - 1; i++) {
      const q = deck.draw('classic', 'easy');
      expect(seen.has(q.id)).toBe(false);
      seen.add(q.id);
    }
    const recycled = deck.draw('classic', 'easy');
    expect(CLASSIC_QUESTIONS.some((q) => q.id === recycled.id)).toBe(true);
  });

  it('accepts the correct answer and rejects others', () => {
    const q = QUESTIONS[0];
    expect(isCorrect(q, q.correct)).toBe(true);
    const wrong = q.choices.find((c) => c !== q.correct)!;
    expect(isCorrect(q, wrong)).toBe(false);
  });

  it('shuffles presented choices while keeping the correct option', () => {
    const deck = new QuestionDeck(() => 0.7);
    const presented = deck.draw('sports', 'mid');
    expect(presented.shuffled).toHaveLength(4);
    expect(presented.shuffled).toContain(presented.correct);
    expect(presented.category).toBe('Math');
  });
});

describe('progression', () => {
  it('makes questions harder and more frequent as the run advances', () => {
    expect(difficultyFor(0, 0, 2)).toBe('easy');
    expect(difficultyFor(200, 3, 20)).toBe('mid');
    expect(difficultyFor(1200, 9, 60)).toBe('late');
    expect(challengeThreshold(0, 0, 2)).toBeGreaterThan(challengeThreshold(400, 4, 24));
    expect(challengeThreshold(400, 4, 24)).toBeGreaterThan(challengeThreshold(1200, 9, 60));
  });
});
