'use client';

import { createContext, useContext, useEffect, useRef, useState } from 'react';
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
  const transitionTimer = useRef<number | null>(null);

  useEffect(() => {
    const root = document.documentElement;
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const initialMode = readThemeMode();
    const initialDark = initialMode === 'system' ? media.matches : initialMode === 'dark';
    themeModeRef.current = initialMode;
    setThemeMode(initialMode);
    setIsDark(initialDark);
    root.classList.toggle('dark', initialDark);

    const followSystemPreference = () => {
      if (themeModeRef.current !== 'system') return;
      setIsDark(media.matches);
      root.classList.toggle('dark', media.matches);
    };

    media.addEventListener('change', followSystemPreference);
    return () => {
      media.removeEventListener('change', followSystemPreference);
      if (transitionTimer.current) window.clearTimeout(transitionTimer.current);
    };
  }, []);

  const toggleTheme = () => {
    const root = document.documentElement;
    const nextMode: ThemeMode = themeModeRef.current === 'system'
      ? (root.classList.contains('dark') ? 'light' : 'dark')
      : 'system';
    const nextDark = nextMode === 'system'
      ? window.matchMedia('(prefers-color-scheme: dark)').matches
      : nextMode === 'dark';

    if (transitionTimer.current) window.clearTimeout(transitionTimer.current);
    root.classList.add('theme-transitioning');
    themeModeRef.current = nextMode;
    setThemeMode(nextMode);
    setIsDark(nextDark);
    root.classList.toggle('dark', nextDark);
    try {
      window.localStorage.setItem('theme', nextMode);
    } catch {
      // The in-memory preference still works when browser storage is unavailable.
    }
    transitionTimer.current = window.setTimeout(() => {
      root.classList.remove('theme-transitioning');
      transitionTimer.current = null;
    }, 260);
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
