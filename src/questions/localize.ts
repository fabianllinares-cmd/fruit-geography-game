import type { Locale } from '../i18n/types';
import dePack from './i18n/de.json';
import esPack from './i18n/es.json';
import type { Question } from './types';

export interface QuestionI18nPack {
  prompts: Record<string, string>;
  facts: Record<string, string>;
  answers: Record<string, string>;
  categories: Record<string, string>;
}

const PACKS: Record<Exclude<Locale, 'en'>, QuestionI18nPack> = {
  es: esPack,
  de: dePack,
};

export function translateAnswer(text: string, locale: Locale): string {
  if (locale === 'en') return text;
  return PACKS[locale].answers[text] ?? text;
}

export function translateCategory(category: string, locale: Locale): string {
  if (locale === 'en') return category;
  return PACKS[locale].categories[category] ?? category;
}

export function localizeQuestion(question: Question, locale: Locale): Question {
  if (locale === 'en') return { ...question };
  const pack = PACKS[locale];
  const prompt = pack.prompts[question.id] ?? question.prompt;
  const category = pack.categories[question.category] ?? question.category;
  const correct = pack.answers[question.correct] ?? question.correct;
  const choices = question.choices.map((choice) => pack.answers[choice] ?? choice) as Question['choices'];
  const fact = question.fact ? (pack.facts[question.id] ?? question.fact) : undefined;
  return {
    ...question,
    prompt,
    category,
    correct,
    choices,
    fact,
  };
}

export function hasPromptTranslation(id: string, locale: Locale): boolean {
  if (locale === 'en') return true;
  return Boolean(PACKS[locale].prompts[id]);
}
