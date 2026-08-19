import { describe, expect, it } from 'vitest';
import { isCorrect, QuestionDeck } from '../src/geography/challenge';
import { QUESTIONS } from '../src/geography/questions';

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

describe('question selection and answers', () => {
  it('randomizes order and avoids immediate repeats until the deck is exhausted', () => {
    let seq = 0;
    const deck = new QuestionDeck(QUESTIONS, () => {
      seq += 1;
      return (seq % 10) / 10;
    });
    const first = deck.draw();
    const seen = new Set([first.id]);
    for (let i = 0; i < QUESTIONS.length - 1; i++) {
      const q = deck.draw();
      expect(seen.has(q.id)).toBe(false);
      seen.add(q.id);
    }
    const recycled = deck.draw();
    expect(QUESTIONS.some((q) => q.id === recycled.id)).toBe(true);
  });

  it('accepts the correct answer and rejects others', () => {
    const q = QUESTIONS[0];
    expect(isCorrect(q, q.correct)).toBe(true);
    const wrong = q.choices.find((c) => c !== q.correct)!;
    expect(isCorrect(q, wrong)).toBe(false);
  });

  it('shuffles presented choices while keeping the correct option', () => {
    const deck = new QuestionDeck(QUESTIONS, () => 0.7);
    const presented = deck.draw();
    expect(presented.shuffled).toHaveLength(4);
    expect(presented.shuffled).toContain(presented.correct);
  });
});
