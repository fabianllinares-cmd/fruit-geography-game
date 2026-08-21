export const LOCALES = ['en', 'es', 'de'] as const;

export type Locale = (typeof LOCALES)[number];

export const LOCALE_LABELS: Record<Locale, string> = {
  en: 'English',
  es: 'Español',
  de: 'Deutsch',
};

export function isLocale(value: string | null | undefined): value is Locale {
  return value === 'en' || value === 'es' || value === 'de';
}
