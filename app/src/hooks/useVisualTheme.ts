import { useState, useEffect, useCallback } from 'react';

export type VisualTheme = 'default' | 'brutalism' | 'cinema' | 'neon';

const THEMES: readonly VisualTheme[] = ['default', 'brutalism', 'cinema', 'neon'] as const;
const STORAGE_KEY = 'visual_theme';
const CLASS_PREFIX = 'theme-';

function isValidTheme(value: string): value is VisualTheme {
  return (THEMES as readonly string[]).includes(value);
}

function getInitialTheme(): VisualTheme {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved && isValidTheme(saved)) return saved;
  return 'default';
}

function applyThemeClass(theme: VisualTheme) {
  const el = document.documentElement;
  // Remove all theme- classes
  el.classList.forEach((cls) => {
    if (cls.startsWith(CLASS_PREFIX)) el.classList.remove(cls);
  });
  // Add new theme class (skip for default — it uses base styles)
  if (theme !== 'default') {
    el.classList.add(`${CLASS_PREFIX}${theme}`);
  }
}

export function useVisualTheme() {
  const [theme, setThemeState] = useState<VisualTheme>(getInitialTheme);

  useEffect(() => {
    applyThemeClass(theme);
  }, [theme]);

  const setTheme = useCallback((next: VisualTheme) => {
    setThemeState(next);
    localStorage.setItem(STORAGE_KEY, next);
  }, []);

  return { theme, setTheme, themes: THEMES } as const;
}
