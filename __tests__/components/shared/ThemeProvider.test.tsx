import React from 'react';
import { render, screen } from '@testing-library/react';
import { ThemeProvider } from '@/components/shared/ThemeProvider';
import { themeService } from '@/services/themeService';

// Mock next-themes
jest.mock('next-themes', () => ({
  ThemeProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="next-theme-provider">{children}</div>
  ),
  useTheme: () => ({
    theme: 'system',
    setTheme: jest.fn(),
    resolvedTheme: 'light',
  }),
}));

describe('ThemeProvider Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders children wrapped inside ThemeProvider', () => {
    render(
      <ThemeProvider>
        <div data-testid="child-content">App Content</div>
      </ThemeProvider>
    );

    expect(screen.getByTestId('child-content')).toBeInTheDocument();
    expect(screen.getByTestId('next-theme-provider')).toBeInTheDocument();
  });

  it('injects anti-FOUC script tag prior to hydration', () => {
    const { container } = render(
      <ThemeProvider>
        <div>Content</div>
      </ThemeProvider>
    );

    const script = container.querySelector('script#theme-script');
    expect(script).toBeInTheDocument();
    expect(script?.innerHTML).toContain('(prefers-color-scheme: dark)');
    expect(script?.innerHTML).toContain('localStorage.getItem');
  });

  it('retrieves pre-hydration theme script from themeService', () => {
    const getScriptSpy = jest.spyOn(themeService, 'getThemeScript');
    render(
      <ThemeProvider>
        <div>Test</div>
      </ThemeProvider>
    );

    expect(getScriptSpy).toHaveBeenCalled();
  });

  it('supports OS dark mode detection when no stored preference exists', () => {
    const scriptContent = themeService.getThemeScript();
    expect(scriptContent).toContain('mediaQuery.matches');
    expect(scriptContent).toContain('prefers-color-scheme: dark');
  });
});
