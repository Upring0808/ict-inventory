'use client';

import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import type { ReactNode } from 'react';

type ThemeMode = 'system' | 'light' | 'dark';

interface ViewTransitionHandle {
  finished: Promise<void>;
  skipTransition: () => void;
}

type DocumentWithViewTransitions = Document & {
  startViewTransition?: (updateCallback: () => void) => ViewTransitionHandle;
};

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
  const activeTransition = useRef<ViewTransitionHandle | null>(null);
  const transitionCleanupFrame = useRef<number | null>(null);
  const transitionGeneration = useRef(0);

  const applyTheme = useCallback((nextMode: ThemeMode, nextDark: boolean) => {
    const root = document.documentElement;
    const generation = ++transitionGeneration.current;
    themeModeRef.current = nextMode;
    targetDarkRef.current = nextDark;

    if (transitionCleanupFrame.current !== null) {
      window.cancelAnimationFrame(transitionCleanupFrame.current);
      transitionCleanupFrame.current = null;
    }
    activeTransition.current?.skipTransition();
    activeTransition.current = null;

    const updateTheme = () => {
      if (generation !== transitionGeneration.current) return;
      root.classList.add('theme-transitioning');
      flushSync(() => {
        root.classList.toggle('dark', nextDark);
        setThemeMode(nextMode);
        setIsDark(nextDark);
      });
      try {
        window.localStorage.setItem('theme', nextMode);
      } catch {
        // The in-memory preference still works when browser storage is unavailable.
      }
    };

    const finishTransition = () => {
      if (generation !== transitionGeneration.current) return;
      root.classList.remove('theme-transitioning');
      activeTransition.current = null;
      transitionCleanupFrame.current = null;
    };

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const viewTransitionDocument = document as DocumentWithViewTransitions;
    if (!prefersReducedMotion && typeof viewTransitionDocument.startViewTransition === 'function') {
      try {
        const transition = viewTransitionDocument.startViewTransition(updateTheme);
        activeTransition.current = transition;
        void transition.finished.then(finishTransition, finishTransition);
        return;
      } catch {
        // Fall through to an immediate, transition-suppressed update if the API is unavailable.
      }
    }

    updateTheme();
    if (prefersReducedMotion) {
      finishTransition();
      return;
    }

    // Let one frame render with component transitions disabled, then restore them.
    transitionCleanupFrame.current = window.requestAnimationFrame(() => {
      transitionCleanupFrame.current = window.requestAnimationFrame(finishTransition);
    });
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const initialMode = readThemeMode();
    const initialDark = initialMode === 'system' ? media.matches : initialMode === 'dark';
    themeModeRef.current = initialMode;
    targetDarkRef.current = initialDark;
    setThemeMode(initialMode);
    setIsDark(initialDark);
    root.classList.toggle('dark', initialDark);

    const followSystemPreference = () => {
      if (themeModeRef.current !== 'system') return;
      applyTheme('system', media.matches);
    };

    media.addEventListener('change', followSystemPreference);
    return () => {
      media.removeEventListener('change', followSystemPreference);
      transitionGeneration.current += 1;
      if (transitionCleanupFrame.current !== null) {
        window.cancelAnimationFrame(transitionCleanupFrame.current);
        transitionCleanupFrame.current = null;
      }
      activeTransition.current?.skipTransition();
      activeTransition.current = null;
      root.classList.remove('theme-transitioning');
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
