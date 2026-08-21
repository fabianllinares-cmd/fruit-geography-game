import { beforeEach, describe, expect, it, vi } from 'vitest';
import { de, en, es, getLocale, initLocale, messageCount, setLocale, t, themeName } from '../src/i18n';
import { KEYS, loadLanguage, saveLanguage } from '../src/persistence';
import {
  CLASSIC_QUESTIONS,
  NIGHT_QUESTIONS,
  QuestionDeck,
  SPORTS_QUESTIONS,
  TROPICAL_QUESTIONS,
  hasPromptTranslation,
  isCorrect,
  localizeQuestion,
  questionById,
} from '../src/questions';

function stubStorage(): void {
  const mem = new Map<string, string>();
  vi.stubGlobal('localStorage', {
    getItem: (k: string) => mem.get(k) ?? null,
    setItem: (k: string, v: string) => {
      mem.set(k, v);
    },
    removeItem: (k: string) => {
      mem.delete(k);
    },
    clear: () => mem.clear(),
  });
}

describe('UI localization', () => {
  beforeEach(() => {
    stubStorage();
    initLocale('en');
  });

  it('uses English as the default language', () => {
    expect(loadLanguage()).toBe('en');
    expect(getLocale()).toBe('en');
    expect(t('hud.score')).toBe('Score');
    expect(t('menu.language')).toBe('Language');
  });

  it('persists and restores a saved language preference', () => {
    saveLanguage('es');
    expect(loadLanguage()).toBe('es');
    saveLanguage('de');
    expect(loadLanguage()).toBe('de');
    expect(KEYS.language).toBe('fruit-geo-v1-language');
  });

  it('ignores invalid stored language values', () => {
    localStorage.setItem(KEYS.language, 'fr');
    expect(loadLanguage()).toBe('en');
  });

  it('looks up translations for the active locale', () => {
    setLocale('es');
    expect(t('hud.score')).toBe('Puntuación');
    expect(t('hud.best')).toBe('Récord');
    expect(t('game.gameOver')).toBe('Fin de la partida');
    expect(t('game.playAgain')).toBe('Jugar de nuevo');
    setLocale('de');
    expect(t('hud.score')).toBe('Punkte');
    expect(t('hud.best')).toBe('Rekord');
    expect(t('game.gameOver')).toBe('Spiel vorbei');
    expect(t('game.playAgain')).toBe('Nochmal spielen');
  });

  it('falls back to English, then the key, when a translation is missing', () => {
    setLocale('es');
    expect(t('not.a.real.key')).toBe('not.a.real.key');
    const original = es['hud.score'];
    (es as Record<string, string>)['hud.score'] = undefined as unknown as string;
    expect(t('hud.score')).toBe('Score');
    (es as Record<string, string>)['hud.score'] = original;
  });

  it('interpolates variables in message templates', () => {
    setLocale('es');
    expect(t('question.correctAnswer', { answer: 'París' })).toBe('Respuesta correcta: París');
  });

  it('translates theme names', () => {
    expect(themeName('classic')).toBe('Classic');
    expect(themeName('night')).toBe('Night');
    expect(themeName('tropical')).toBe('Tropical');
    expect(themeName('sports')).toBe('Sports');
    expect(themeName('drinks')).toBe('Drinks');
    setLocale('es');
    expect(themeName('classic')).toBe('Clásico');
    expect(themeName('night')).toBe('Noche');
    expect(themeName('tropical')).toBe('Tropical');
    expect(themeName('sports')).toBe('Deportes');
    expect(themeName('drinks')).toBe('Bebidas');
    setLocale('de');
    expect(themeName('classic')).toBe('Klassisch');
    expect(themeName('night')).toBe('Nacht');
    expect(themeName('tropical')).toBe('Tropisch');
    expect(themeName('sports')).toBe('Sport');
    expect(themeName('drinks')).toBe('Getränke');
  });

  it('keeps the same keys in English, Spanish and German', () => {
    expect(Object.keys(es).sort()).toEqual(Object.keys(en).sort());
    expect(Object.keys(de).sort()).toEqual(Object.keys(en).sort());
    expect(messageCount()).toBeGreaterThan(80);
  });
});

describe('question-bank localization', () => {
  beforeEach(() => initLocale('en'));

  it('keeps stable question IDs across languages', () => {
    const original = questionById('cap-france', 'classic')!;
    const esQ = localizeQuestion(original, 'es');
    const deQ = localizeQuestion(original, 'de');
    expect(esQ.id).toBe('cap-france');
    expect(deQ.id).toBe('cap-france');
    expect(esQ.tier).toBe(original.tier);
    expect(deQ.tier).toBe(original.tier);
    expect(esQ.prompt).toBe('¿Cuál es la capital de Francia?');
    expect(deQ.prompt).toBe('Was ist die Hauptstadt von Frankreich?');
    expect(esQ.correct).toBe('París');
    expect(deQ.correct).toBe('Paris');
    expect(isCorrect(esQ, esQ.correct)).toBe(true);
    expect(isCorrect(deQ, original.correct)).toBe(original.correct === deQ.correct);
  });

  it('selects question text for the active language at draw time', () => {
    let seq = 0;
    const deck = new QuestionDeck(() => {
      seq += 1;
      return (seq % 10) / 10;
    });
    initLocale('en');
    const first = deck.draw('classic', 'easy');
    const english = localizeQuestion(questionById(first.id, 'classic')!, 'en');
    expect(first.prompt).toBe(english.prompt);

    initLocale('es');
    const spanish = deck.present(questionById(first.id, 'classic')!);
    expect(spanish.id).toBe(first.id);
    expect(spanish.prompt).toBe(localizeQuestion(questionById(first.id, 'classic')!, 'es').prompt);
    expect(spanish.prompt).not.toBe(first.prompt);
    expect(spanish.shuffled).toHaveLength(4);
    expect(spanish.shuffled).toContain(spanish.correct);
  });

  it('falls back to English question copy when a translation is missing', () => {
    const original = CLASSIC_QUESTIONS[0];
    const ghost = { ...original, id: 'missing-question-id' };
    const localized = localizeQuestion(ghost, 'es');
    expect(localized.id).toBe('missing-question-id');
    expect(localized.prompt).toBe(original.prompt);
    expect(localized.choices).toHaveLength(4);
  });

  it('covers every bank prompt in Spanish and German without crashing', () => {
    const banks = [CLASSIC_QUESTIONS, TROPICAL_QUESTIONS, SPORTS_QUESTIONS, NIGHT_QUESTIONS];
    for (const bank of banks) {
      for (const question of bank) {
        expect(hasPromptTranslation(question.id, 'es')).toBe(true);
        expect(hasPromptTranslation(question.id, 'de')).toBe(true);
        for (const locale of ['es', 'de'] as const) {
          const localized = localizeQuestion(question, locale);
          expect(localized.choices).toHaveLength(4);
          expect(new Set(localized.choices).size).toBe(4);
          expect(localized.choices).toContain(localized.correct);
          expect(localized.prompt.length).toBeGreaterThan(0);
        }
      }
    }
  });

  it('does not reshuffle recent-question IDs when the language changes', () => {
    const seen: string[] = [];
    const deck = new QuestionDeck(() => 0.3);
    initLocale('en');
    seen.push(deck.draw('sports', 'easy').id);
    initLocale('de');
    seen.push(deck.draw('sports', 'easy').id);
    initLocale('es');
    seen.push(deck.draw('sports', 'easy').id);
    expect(new Set(seen).size).toBe(3);
  });
});
