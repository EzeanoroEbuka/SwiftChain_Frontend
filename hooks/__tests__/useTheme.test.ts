import { act, renderHook, waitFor } from '@testing-library/react';
import { useTheme } from '@/hooks/useTheme';
import { themeService } from '@/services/themeService';

const mockSetTheme = jest.fn();
const mockUseNextTheme = jest.fn();

jest.mock('next-themes', () => ({
  useTheme: () => mockUseNextTheme(),
}));

jest.mock('@/services/themeService', () => ({
  themeService: {
    getStoredThemePreference: jest.fn(() => null),
    setStoredThemePreference: jest.fn(),
    getInitialTheme: jest.fn(() => 'light'),
    getThemeScript: jest.fn(() => ''),
    applyTheme: jest.fn(),
    getThemePreference: jest.fn(),
    saveThemePreference: jest.fn(),
  },
}));

describe('useTheme', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    mockUseNextTheme.mockReturnValue({
      theme: 'system',
      resolvedTheme: 'light',
      setTheme: mockSetTheme,
    });

    (themeService.getThemePreference as jest.Mock).mockResolvedValue({
      theme: 'system',
    });
    (themeService.saveThemePreference as jest.Mock).mockResolvedValue({
      theme: 'light',
    });
  });

  it('should toggle from light to dark and persist preference', async () => {
    const { result } = renderHook(() => useTheme());

    await act(async () => {
      await result.current.toggleTheme();
    });

    expect(mockSetTheme).toHaveBeenCalledWith('dark');
    expect(themeService.saveThemePreference).toHaveBeenCalledWith('dark');
  });

  it('should toggle from dark to light and persist preference', async () => {
    mockUseNextTheme.mockReturnValue({
      theme: 'system',
      resolvedTheme: 'dark',
      setTheme: mockSetTheme,
    });

    const { result } = renderHook(() => useTheme());

    await act(async () => {
      await result.current.toggleTheme();
    });

    expect(mockSetTheme).toHaveBeenCalledWith('light');
    expect(themeService.saveThemePreference).toHaveBeenCalledWith('light');
  });

  it('should prefer the stored local override over the backend/system theme on load', async () => {
    window.localStorage.setItem('theme', 'light');
    (themeService.getStoredThemePreference as jest.Mock).mockReturnValue('light');
    window.matchMedia = jest.fn().mockImplementation((query: string) => ({
      matches: query === '(prefers-color-scheme: dark)',
      media: query,
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      addListener: jest.fn(),
      removeListener: jest.fn(),
      dispatchEvent: jest.fn(),
    })) as typeof window.matchMedia;

    const { result } = renderHook(() => useTheme());

    await waitFor(() => {
      expect(mockSetTheme).toHaveBeenCalledWith('light');
    });

    expect(result.current.resolvedTheme).toBe('light');
  });

  it('should not throw when persistence fails', async () => {
    (themeService.saveThemePreference as jest.Mock).mockRejectedValueOnce(
      new Error('Persistence failed')
    );

    const { result } = renderHook(() => useTheme());

    await expect(
      act(async () => {
        await result.current.toggleTheme();
      })
    ).resolves.toBeUndefined();

    expect(mockSetTheme).toHaveBeenCalledWith('dark');
  });
});
