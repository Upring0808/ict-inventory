'use client';

import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { flushSync } from 'react-dom';

type ThemeMode = 'system' | 'light' | 'dark';

interface ThemeContextValue {
  isDark: boolean;
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
  const [isDark, setIsDark] = useState(false);
  const themeModeRef = useRef<ThemeMode>('system');
  const targetDarkRef = useRef(false);
  const transitionRequestRef = useRef(0);

  const commitTheme = useCallback((nextMode: ThemeMode, nextDark: boolean) => {
    themeModeRef.current = nextMode;
    targetDarkRef.current = nextDark;
    document.documentElement.classList.toggle('dark', nextDark);
    flushSync(() => setIsDark(nextDark));
    try {
      window.localStorage.setItem('theme', nextMode);
    } catch {
      // The in-memory preference still works when browser storage is unavailable.
    }
  }, []);

  const changeTheme = useCallback((nextMode: ThemeMode, nextDark: boolean) => {
    if (themeModeRef.current === nextMode && targetDarkRef.current === nextDark) return;

    themeModeRef.current = nextMode;
    targetDarkRef.current = nextDark;
    const request = ++transitionRequestRef.current;
    const root = document.documentElement;
    const transitionDocument = document as Document & {
      startViewTransition?: (updateCallback: () => void) => { finished: Promise<void> };
    };

    if (
      transitionDocument.startViewTransition &&
      !window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      try {
        const transition = transitionDocument.startViewTransition(() => {
          if (request !== transitionRequestRef.current) return;
          root.classList.add('theme-transitioning');
          commitTheme(nextMode, nextDark);
        });
        const finish = () => {
          if (request === transitionRequestRef.current) root.classList.remove('theme-transitioning');
        };
        void transition.finished.then(finish, finish);
        return;
      } catch {
        root.classList.remove('theme-transitioning');
      }
    }

    commitTheme(nextMode, nextDark);
  }, [commitTheme]);

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
      setIsDark(initialDark);
    }, 0);

    const followSystemPreference = () => {
      if (themeModeRef.current !== 'system') return;
      changeTheme('system', media.matches);
    };

    media.addEventListener('change', followSystemPreference);
    return () => {
      window.clearTimeout(initialStateTimer);
      media.removeEventListener('change', followSystemPreference);
    };
  }, [changeTheme]);

  const toggleTheme = useCallback(() => {
    const nextDark = !targetDarkRef.current;
    const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const nextMode: ThemeMode = nextDark === systemDark
      ? 'system'
      : nextDark ? 'dark' : 'light';
    changeTheme(nextMode, nextDark);
  }, [changeTheme]);

  return (
    <ThemeContext.Provider value={{ isDark, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within ThemeProvider');
  return context;
}
