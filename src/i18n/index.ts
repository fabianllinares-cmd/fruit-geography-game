import { de } from './de';
import { en, type MessageKey, type Messages } from './en';
import { es } from './es';
import { isLocale, type Locale } from './types';

export type { Locale, MessageKey, Messages };
export { LOCALES, LOCALE_LABELS, isLocale } from './types';
export { en } from './en';
export { es } from './es';
export { de } from './de';

const TABLES: Record<Locale, Messages> = { en, es, de };

let current: Locale = 'en';
const listeners = new Set<(locale: Locale) => void>();

export function getLocale(): Locale {
  return current;
}

export function setLocale(locale: Locale): void {
  if (current === locale) return;
  current = locale;
  if (typeof document !== 'undefined') {
    document.documentElement.lang = locale;
  }
  for (const listener of listeners) listener(locale);
}

/** Restore a saved locale without notifying listeners (used at startup). */
export function initLocale(locale: Locale): void {
  current = isLocale(locale) ? locale : 'en';
  if (typeof document !== 'undefined') {
    document.documentElement.lang = current;
  }
}

export function onLocaleChange(listener: (locale: Locale) => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function t(key: MessageKey | string, vars?: Record<string, string | number>): string {
  const table = TABLES[current] ?? en;
  const fallback = (en as Record<string, string>)[key];
  let text = (table as Record<string, string>)[key] ?? fallback ?? key;
  if (vars) {
    for (const [name, value] of Object.entries(vars)) {
      text = text.replaceAll(`{${name}}`, String(value));
    }
  }
  return text;
}

export function themeName(themeId: string, full = false): string {
  const key = full ? `theme.${themeId}Full` : `theme.${themeId}`;
  return t(key);
}

export function themeTagline(themeId: string): string {
  return t(`theme.${themeId}Tag`);
}

export function objectName(objectId: string, fallback = objectId): string {
  const key = `object.${objectId}`;
  const translated = t(key);
  return translated === key ? fallback : translated;
}

export function quizSubjectKey(themeId: string): 'geography' | 'math' | 'space' {
  if (themeId === 'sports') return 'math';
  if (themeId === 'night') return 'space';
  return 'geography';
}

export function quizSubject(themeId: string): string {
  return t(`quiz.${quizSubjectKey(themeId)}`);
}

export function messageCount(): number {
  return Object.keys(en).length;
}

export function applyDomI18n(root: ParentNode | null = typeof document === 'undefined' ? null : document): void {
  if (!root) return;
  for (const el of root.querySelectorAll<HTMLElement>('[data-i18n]')) {
    const key = el.dataset.i18n as MessageKey | undefined;
    if (key) el.textContent = t(key);
  }
  for (const el of root.querySelectorAll<HTMLElement>('[data-i18n-aria]')) {
    const key = el.dataset.i18nAria as MessageKey | undefined;
    if (key) el.setAttribute('aria-label', t(key));
  }
  for (const el of root.querySelectorAll<HTMLElement>('[data-i18n-title]')) {
    const key = el.dataset.i18nTitle as MessageKey | undefined;
    if (key) el.title = t(key);
  }
}
