import { useCallback, useEffect } from 'react';
import { useLanguageContext, type Locale } from '@/contexts/LanguageContext';
import { languageService } from '@/services/languageService';
import type { Locale as LocaleType } from '@/contexts/LanguageContext';

export interface UseLanguageReturn {
  locale: LocaleType;
  setLocale: (locale: LocaleType) => void;
}

export function useLanguage(): UseLanguageReturn {
  const { locale, setLocale } = useLanguageContext();

  useEffect(() => {
    const saved = languageService.getLanguage();
    if (saved !== locale) {
      setLocale(saved);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSetLocale = useCallback((next: Locale) => {
    languageService.saveLanguage(next);
    setLocale(next);
  }, [setLocale]);

  return {
    locale,
    setLocale: handleSetLocale,
  };
}