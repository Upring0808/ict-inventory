'use client';

import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';

type ThemeMode = 'system' | 'light' | 'dark';

interface ThemeContextValue {
  isDark: boolean;
  themeMode: ThemeMode;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

function readThemeMode(): ThemeMode {
  try {
    const saved = window.localStorage.getItem('theme');
    return saved === 'dark' || saved === 'light' ? saved : 'system';
  } catch {
    return 'system';
  }
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [themeMode, setThemeMode] = useState<ThemeMode>('system');
  const [isDark, setIsDark] = useState(false);
  const themeModeRef = useRef<ThemeMode>('system');
  const targetDarkRef = useRef(false);

  const applyTheme = useCallback((nextMode: ThemeMode, nextDark: boolean) => {
    themeModeRef.current = nextMode;
    targetDarkRef.current = nextDark;
    document.documentElement.classList.toggle('dark', nextDark);
    setThemeMode(nextMode);
    setIsDark(nextDark);
    try {
      window.localStorage.setItem('theme', nextMode);
    } catch {
      // The in-memory preference still works when browser storage is unavailable.
    }
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const initialMode = readThemeMode();
    const initialDark = initialMode === 'system' ? media.matches : initialMode === 'dark';
    themeModeRef.current = initialMode;
    targetDarkRef.current = initialDark;
    root.classList.toggle('dark', initialDark);
    const initialStateTimer = window.setTimeout(() => {
      if (themeModeRef.current !== initialMode || targetDarkRef.current !== initialDark) return;
      setThemeMode(initialMode);
      setIsDark(initialDark);
    }, 0);

    const followSystemPreference = () => {
      if (themeModeRef.current !== 'system') return;
      applyTheme('system', media.matches);
    };

    media.addEventListener('change', followSystemPreference);
    return () => {
      window.clearTimeout(initialStateTimer);
      media.removeEventListener('change', followSystemPreference);
    };
  }, [applyTheme]);

  const toggleTheme = () => {
    const nextMode: ThemeMode = themeModeRef.current === 'system'
      ? (targetDarkRef.current ? 'light' : 'dark')
      : 'system';
    const nextDark = nextMode === 'system'
      ? window.matchMedia('(prefers-color-scheme: dark)').matches
      : nextMode === 'dark';
    applyTheme(nextMode, nextDark);
  };

  return (
    <ThemeContext.Provider value={{ isDark, themeMode, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within ThemeProvider');
  return context;
}
