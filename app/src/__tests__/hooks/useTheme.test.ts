import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useTheme } from '@/hooks/useTheme';

describe('useTheme', () => {
  beforeEach(() => {
    window.localStorage.removeItem('theme');
    document.documentElement.className = '';
  });

  it('defaults to dark mode when no saved preference', () => {
    const { result } = renderHook(() => useTheme());
    expect(result.current.isDark).toBe(true);
  });

  it('reads saved light theme preference', () => {
    window.localStorage.setItem('theme', 'light');
    const { result } = renderHook(() => useTheme());
    expect(result.current.isDark).toBe(false);
  });

  it('reads saved dark theme preference', () => {
    window.localStorage.setItem('theme', 'dark');
    const { result } = renderHook(() => useTheme());
    expect(result.current.isDark).toBe(true);
  });

  it('toggle switches from dark to light', () => {
    const { result } = renderHook(() => useTheme());
    expect(result.current.isDark).toBe(true);

    act(() => {
      result.current.toggle();
    });

    expect(result.current.isDark).toBe(false);
  });

  it('toggle switches from light to dark', () => {
    window.localStorage.setItem('theme', 'light');
    const { result } = renderHook(() => useTheme());
    expect(result.current.isDark).toBe(false);

    act(() => {
      result.current.toggle();
    });

    expect(result.current.isDark).toBe(true);
  });

  it('persists theme to localStorage on change', () => {
    const { result } = renderHook(() => useTheme());

    act(() => {
      result.current.toggle();
    });

    expect(window.localStorage.getItem('theme')).toBe('light');

    act(() => {
      result.current.toggle();
    });

    expect(window.localStorage.getItem('theme')).toBe('dark');
  });

  it('toggles HTML class on documentElement', () => {
    const { result } = renderHook(() => useTheme());

    // Initially dark
    expect(document.documentElement.classList.contains('dark')).toBe(true);
    expect(document.documentElement.classList.contains('light')).toBe(false);

    act(() => {
      result.current.toggle();
    });

    expect(document.documentElement.classList.contains('light')).toBe(true);
    expect(document.documentElement.classList.contains('dark')).toBe(false);
  });
});
