import { useQuery } from '@tanstack/react-query';
import { faqService, type FaqResponse } from '@/services/faqService';
import type { Locale } from '@/contexts/LanguageContext';

export const FAQ_QUERY_KEY = (locale: Locale) => ['faq', locale] as const;

export interface UseFaqReturn {
  categories: FaqResponse;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
}

/**
 * useFaq — fetches FAQ categories and items from the backend API.
 * Accepts a locale so the query key changes when language switches,
 * triggering a fresh fetch for localised content.
 */
export function useFaq(locale: Locale = 'en'): UseFaqReturn {
  const { data, isLoading, isError, error } = useQuery<FaqResponse, Error>({
    queryKey: FAQ_QUERY_KEY(locale),
    queryFn: () => faqService.getFaqs(locale),
  });

  return {
    categories: data ?? [],
    isLoading,
    isError,
    error: error ?? null,
  };
}