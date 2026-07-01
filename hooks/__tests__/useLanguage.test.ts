import { renderHook, act } from '@testing-library/react';
import { useLanguage } from '@/hooks/useLanguage';
import { languageService } from '@/services/languageService';
import { LanguageProvider } from '@/contexts/LanguageContext';
import React from 'react';

jest.mock('@/services/languageService', () => ({
  languageService: {
    getLanguage: jest.fn(),
    saveLanguage: jest.fn(),
  },
}));

const wrapper = ({ children }: { children: React.ReactNode }) =>
  React.createElement(LanguageProvider, null, children);

describe('useLanguage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (languageService.getLanguage as jest.Mock).mockReturnValue('en');
  });

  it('returns default locale as en', () => {
    const { result } = renderHook(() => useLanguage(), { wrapper });
    expect(result.current.locale).toBe('en');
  });

  it('updates locale when setLocale is called', () => {
    const { result } = renderHook(() => useLanguage(), { wrapper });

    act(() => {
      result.current.setLocale('yo');
    });

    expect(result.current.locale).toBe('yo');
  });

  it('persists locale via languageService when setLocale is called', () => {
    const { result } = renderHook(() => useLanguage(), { wrapper });

    act(() => {
      result.current.setLocale('ha');
    });

    expect(languageService.saveLanguage).toHaveBeenCalledWith('ha');
  });

  it('restores saved locale on mount', () => {
    (languageService.getLanguage as jest.Mock).mockReturnValue('pcm');

    const { result } = renderHook(() => useLanguage(), { wrapper });

    expect(result.current.locale).toBe('pcm');
  });

  it('supports all five locales', () => {
    const { result } = renderHook(() => useLanguage(), { wrapper });
    const locales = ['en', 'pcm', 'ha', 'yo', 'ig'] as const;

    locales.forEach((l) => {
      act(() => {
        result.current.setLocale(l);
      });
      expect(result.current.locale).toBe(l);
    });
  });
});