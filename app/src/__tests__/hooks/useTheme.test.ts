import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useTheme } from '@/hooks/useTheme';

function mockMatchMedia(prefersDark: boolean) {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: query === '(prefers-color-scheme: dark)' ? prefersDark : false,
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
}

describe('useTheme', () => {
  beforeEach(() => {
    window.localStorage.removeItem('theme');
    document.documentElement.className = '';
    mockMatchMedia(true); // default: system prefers dark
  });

  it('defaults to dark when system prefers dark and no saved preference', () => {
    mockMatchMedia(true);
    const { result } = renderHook(() => useTheme());
    expect(result.current.isDark).toBe(true);
  });

  it('defaults to light when system prefers light and no saved preference', () => {
    mockMatchMedia(false);
    const { result } = renderHook(() => useTheme());
    expect(result.current.isDark).toBe(false);
  });

  it('reads saved light theme preference (overrides system)', () => {
    mockMatchMedia(true); // system says dark
    window.localStorage.setItem('theme', 'light');
    const { result } = renderHook(() => useTheme());
    expect(result.current.isDark).toBe(false);
  });

  it('reads saved dark theme preference (overrides system)', () => {
    mockMatchMedia(false); // system says light
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

    // Initially dark (system preference)
    expect(document.documentElement.classList.contains('dark')).toBe(true);
    expect(document.documentElement.classList.contains('light')).toBe(false);

    act(() => {
      result.current.toggle();
    });

    expect(document.documentElement.classList.contains('light')).toBe(true);
    expect(document.documentElement.classList.contains('dark')).toBe(false);
  });
});
