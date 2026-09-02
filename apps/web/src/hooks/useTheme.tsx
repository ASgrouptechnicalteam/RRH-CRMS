/**
 * useTheme.ts
 *
 * Manages light / dark / system theme preferences.
 *
 * - Persists user choice to localStorage ('rrh_theme')
 * - Applies 'dark' class to <html> when needed
 * - 'system' mode tracks prefers-color-scheme media query live
 * - Exports ThemeContext so any component can read/set theme
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

export type ThemeMode = 'light' | 'dark' | 'system';

const STORAGE_KEY = 'rrh_theme';

interface ThemeContextValue {
  theme: ThemeMode;
  setTheme: (t: ThemeMode) => void;
  isDark: boolean;        // resolved — true when the effective display is dark
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: 'light',
  setTheme: () => {},
  isDark: false,
});

function applyTheme(mode: ThemeMode) {
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const shouldBeDark = mode === 'dark' || (mode === 'system' && prefersDark);
  document.documentElement.classList.toggle('dark', shouldBeDark);
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemeMode>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY) as ThemeMode | null;
      if (stored && ['light', 'dark', 'system'].includes(stored)) return stored;
    } catch {}
    return 'light';
  });

  // Resolve whether the screen is currently dark
  const [isDark, setIsDark] = useState(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as ThemeMode | null;
    const mode = stored && ['light', 'dark', 'system'].includes(stored) ? stored : 'light';
    const prefersDark = typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches;
    return mode === 'dark' || (mode === 'system' && prefersDark);
  });

  // Apply on mount and on theme change
  useEffect(() => {
    applyTheme(theme);
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    setIsDark(theme === 'dark' || (theme === 'system' && prefersDark));
  }, [theme]);

  // Track system preference changes when in 'system' mode
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e: MediaQueryListEvent) => {
      if (theme === 'system') {
        document.documentElement.classList.toggle('dark', e.matches);
        setIsDark(e.matches);
      }
    };
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, [theme]);

  const setTheme = useCallback((mode: ThemeMode) => {
    setThemeState(mode);
    try { localStorage.setItem(STORAGE_KEY, mode); } catch {}
  }, []);

  return React.createElement(
    ThemeContext.Provider,
    { value: { theme, setTheme, isDark } },
    children
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
