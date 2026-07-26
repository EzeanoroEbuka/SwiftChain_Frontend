import type { Locale } from '@/contexts/LanguageContext';

const STORAGE_KEY = 'swiftchain-language';

export const languageService = {
  getLanguage(): Locale {
    if (typeof window === 'undefined') return 'en';
    return (localStorage.getItem(STORAGE_KEY) as Locale) ?? 'en';
  },

  saveLanguage(locale: Locale): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_KEY, locale);
  },
};