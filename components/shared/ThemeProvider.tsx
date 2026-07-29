'use client';

import React from 'react';
import { ThemeProvider as NextThemeProvider } from 'next-themes';
import { themeService } from '@/services/themeService';

interface ThemeProviderProps {
  children: React.ReactNode;
}

/**
 * OS-Aware ThemeProvider component.
 *
 * Implements OS theme detection ('prefers-color-scheme'), zero FOUC via inline script,
 * manual local storage persistence, and backend API preference synchronization following
 * the Component -> Hook -> Service architecture.
 */
export function ThemeProvider({ children }: ThemeProviderProps) {
  const themeScript = themeService.getThemeScript();

  return (
    <>
      <script
        id="theme-script"
        dangerouslySetInnerHTML={{ __html: themeScript }}
      />
      <NextThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem={true}
        disableTransitionOnChange
      >
        {children}
      </NextThemeProvider>
    </>
  );
}

export default ThemeProvider;
