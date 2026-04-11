import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useVisualTheme } from '@/hooks/useVisualTheme';

function mockMatchMedia() {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: query === '(prefers-color-scheme: dark)',
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
}

describe('useVisualTheme', () => {
  beforeEach(() => {
    localStorage.removeItem('visual_theme');
    document.documentElement.className = 'dark';
    mockMatchMedia();
  });

  it('defaults to "default" when no localStorage value', () => {
    const { result } = renderHook(() => useVisualTheme());
    expect(result.current.theme).toBe('default');
  });

  it('reads saved theme from localStorage', () => {
    localStorage.setItem('visual_theme', 'brutalism');
    const { result } = renderHook(() => useVisualTheme());
    expect(result.current.theme).toBe('brutalism');
  });

  it('setTheme persists to localStorage', () => {
    const { result } = renderHook(() => useVisualTheme());
    act(() => result.current.setTheme('cinema'));
    expect(localStorage.getItem('visual_theme')).toBe('cinema');
  });

  it('setTheme updates the return value', () => {
    const { result } = renderHook(() => useVisualTheme());
    act(() => result.current.setTheme('neon'));
    expect(result.current.theme).toBe('neon');
  });

  it('applies theme class to documentElement', () => {
    const { result } = renderHook(() => useVisualTheme());
    act(() => result.current.setTheme('brutalism'));
    expect(document.documentElement.classList.contains('theme-brutalism')).toBe(true);
  });

  it('removes previous theme class when switching', () => {
    const { result } = renderHook(() => useVisualTheme());
    act(() => result.current.setTheme('brutalism'));
    act(() => result.current.setTheme('cinema'));
    expect(document.documentElement.classList.contains('theme-brutalism')).toBe(false);
    expect(document.documentElement.classList.contains('theme-cinema')).toBe(true);
  });

  it('coexists with dark/light class', () => {
    document.documentElement.classList.add('dark');
    const { result } = renderHook(() => useVisualTheme());
    act(() => result.current.setTheme('neon'));
    expect(document.documentElement.classList.contains('dark')).toBe(true);
    expect(document.documentElement.classList.contains('theme-neon')).toBe(true);
  });

  it('returns list of available themes', () => {
    const { result } = renderHook(() => useVisualTheme());
    expect(result.current.themes).toEqual(['default', 'brutalism', 'cinema', 'neon']);
  });

  it('invalid localStorage value falls back to default', () => {
    localStorage.setItem('visual_theme', 'nonexistent');
    const { result } = renderHook(() => useVisualTheme());
    expect(result.current.theme).toBe('default');
  });

  it('default theme applies no theme- class', () => {
    const { result } = renderHook(() => useVisualTheme());
    act(() => result.current.setTheme('brutalism'));
    act(() => result.current.setTheme('default'));
    expect(document.documentElement.classList.contains('theme-brutalism')).toBe(false);
    expect(document.documentElement.classList.contains('theme-default')).toBe(false);
  });
});
